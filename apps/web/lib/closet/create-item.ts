import type { SupabaseClient } from '@supabase/supabase-js';
import { verifyFileSignature } from '../security/file-signature';
import { removeBackground, type RemovedBg } from './remove-bg';
import { uploadClosetImage, isClosetImageMime, CLOSET_BUCKET } from './storage';
import type { ClosetCategory } from './categories';
import type { ItemAttributes } from './attributes';
import { tagClosetItem } from '../ai/tag-item';

export const DEFAULT_ITEM_NAME = '未命名衣物';

export type CreateClosetItemError = 'BAD_MIME' | 'BAD_SIGNATURE' | 'STORAGE' | 'DB';

// 成功時 error 為 null；apps/web 沒開 strictNullChecks，用 error 判斷比用 union 收窄可靠
export interface CreateClosetItemResult {
  error: CreateClosetItemError | null;
  data?: unknown;
  imageUrl?: string;
  expiresAt?: string;
}

/** 使用者有填就用使用者的；沒填（或選「未分類」）才用 AI 辨識的 */
export function closetItemColumns(
  fields: { name?: string; category: ClosetCategory; fallbackName?: string },
  attrs: ItemAttributes | null
) {
  return {
    name: fields.name ?? attrs?.name ?? fields.fallbackName ?? DEFAULT_ITEM_NAME,
    category: fields.category === 'uncategorized' && attrs ? attrs.category : fields.category,
    ...(attrs
      ? {
          subcategory: attrs.subcategory || null,
          color: attrs.colors[0],
          season: attrs.seasons.join(',') || null,
          tags: attrs.styles,
          attributes: attrs,
        }
      : {}),
  };
}

/**
 * 拍照上傳與貼連結匯入共用的後半段：
 * 驗 MIME 與檔案簽章 → 去背（失敗沿用原圖）→ 存 Storage，同時 AI 辨識屬性 → 寫 closet_items（失敗就刪掉剛存的圖）。
 * 各 route 只負責取得圖片與決定錯誤訊息。
 * name：使用者填的名稱；fallbackName：AI 也沒辨識出名稱時用（例如商品頁標題）。
 */
export async function createClosetItemFromImage(
  supabase: SupabaseClient,
  userId: string,
  image: RemovedBg,
  fields: { name?: string; fallbackName?: string; category: ClosetCategory; sourceUrl?: string }
): Promise<CreateClosetItemResult> {
  if (!isClosetImageMime(image.contentType)) return { error: 'BAD_MIME' };
  // 防止改副檔名 / 偽造 MIME；先驗完才送去第三方去背
  if (!verifyFileSignature(image.buffer, image.contentType).valid) return { error: 'BAD_SIGNATURE' };

  const processed = (await removeBackground(image.buffer, image.contentType)) ?? image;
  if (!isClosetImageMime(processed.contentType)) return { error: 'BAD_MIME' };

  // 辨識不會失敗（失敗回 null），跟上傳同時跑
  const attrsPromise = tagClosetItem(processed);
  let stored;
  try {
    stored = await uploadClosetImage(supabase, userId, processed.buffer, processed.contentType);
  } catch (err) {
    console.error('[closet] upload failed:', (err as Error).message);
    return { error: 'STORAGE' };
  }

  const attrs = await attrsPromise;
  const { data, error } = await supabase
    .from('closet_items')
    .insert({
      user_id: userId,
      ...closetItemColumns(fields, attrs),
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
