import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyFileSignature } from '../security/file-signature';
import { removeBackground, type RemovedBg } from './remove-bg';
import { uploadClosetImage, isClosetImageMime, CLOSET_BUCKET } from './storage';
import type { ClosetCategory } from './categories';

export type CreateClosetItemError = 'BAD_MIME' | 'BAD_SIGNATURE' | 'STORAGE' | 'DB';

// 成功時 error 為 null；apps/web 沒開 strictNullChecks，用 error 判斷比用 union 收窄可靠
export interface CreateClosetItemResult {
  error: CreateClosetItemError | null;
  data?: unknown;
  imageUrl?: string;
  expiresAt?: string;
}

/**
 * 拍照上傳與貼連結匯入共用的後半段：
 * 驗 MIME 與檔案簽章 → 去背（失敗沿用原圖）→ 存 Storage → 寫 closet_items（失敗就刪掉剛存的圖）。
 * 各 route 只負責取得圖片與決定錯誤訊息。
 */
export async function createClosetItemFromImage(
  supabase: SupabaseClient,
  userId: string,
  image: RemovedBg,
  fields: { name: string; category: ClosetCategory; sourceUrl?: string }
): Promise<CreateClosetItemResult> {
  if (!isClosetImageMime(image.contentType)) return { error: 'BAD_MIME' };
  // 防止改副檔名 / 偽造 MIME；先驗完才送去第三方去背
  if (!verifyFileSignature(image.buffer, image.contentType).valid) return { error: 'BAD_SIGNATURE' };

  const processed = (await removeBackground(image.buffer, image.contentType)) ?? image;
  if (!isClosetImageMime(processed.contentType)) return { error: 'BAD_MIME' };

  let stored;
  try {
    stored = await uploadClosetImage(supabase, userId, processed.buffer, processed.contentType);
  } catch (err) {
    console.error('[closet] upload failed:', (err as Error).message);
    return { error: 'STORAGE' };
  }

  const { data, error } = await supabase
    .from('closet_items')
    .insert({
      user_id: userId,
      name: fields.name,
      category: fields.category,
      image_url: stored.signedUrl,
      ...(fields.sourceUrl ? { source_url: fields.sourceUrl } : {}),
      source_type: 'OWNED',
      source_ref_id: null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(CLOSET_BUCKET).remove([stored.filePath]);
    console.error('[closet] insert failed:', error.message);
    return { error: 'DB' };
  }

  return { error: null, data, imageUrl: stored.signedUrl, expiresAt: stored.expiresAt };
}
