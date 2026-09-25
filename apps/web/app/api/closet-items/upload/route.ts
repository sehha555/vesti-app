import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyFileSignature } from '../../../../lib/security/file-signature';
import { removeBackground } from '../../../../lib/closet/remove-bg';
import { uploadClosetImage, isClosetImageMime, CLOSET_BUCKET } from '../../../../lib/closet/storage';
import { CLOSET_CATEGORIES } from '../../../../lib/closet/categories';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const RATE_LIMIT = { keyPrefix: 'closet-upload', maxRequests: 10, windowMs: 600_000 };
const NO_STORE = { 'Cache-Control': 'private, no-store' };

const MetadataSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  category: z.enum(CLOSET_CATEGORIES).optional(),
});

/**
 * POST /api/closet-items/upload
 * 拍照 / 選相簿上傳衣物：跟 from-url 同一條流程（驗簽章 → 去背 → Storage → closet_items）。
 *
 * FormData:
 * - file: 圖片（必填，JPEG / PNG / WebP，最大 10MB）
 * - name: 名稱（選填）
 * - category: 類別（選填，預設 uncategorized）
 *
 * Returns: 201 { data: ClosetItem, imageUrl, expiresAt }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const rl = await checkRateLimit(user.id, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '上傳太頻繁，請稍後再試' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: '請用表單上傳圖片' }, { status: 400, headers: NO_STORE });
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: '請選擇一張圖片' }, { status: 400, headers: NO_STORE });
  }
  if (!isClosetImageMime(file.type)) {
    return NextResponse.json(
      { error: '圖片格式不支援（只接受 JPEG / PNG / WebP）' },
      { status: 400, headers: NO_STORE }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '圖片太大，最大 10MB' }, { status: 400, headers: NO_STORE });
  }

  const meta = MetadataSchema.safeParse({
    name: formData.get('name') || undefined,
    category: formData.get('category') || undefined,
  });
  if (!meta.success) {
    return NextResponse.json({ error: '名稱或類別不正確' }, { status: 400, headers: NO_STORE });
  }

  let image: { buffer: Buffer; contentType: string } = {
    buffer: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  };

  // 防止改副檔名 / 偽造 MIME
  if (!verifyFileSignature(image.buffer, image.contentType).valid) {
    return NextResponse.json({ error: '檔案內容不是有效的圖檔' }, { status: 400, headers: NO_STORE });
  }

  // 去背失敗就沿用原圖，不讓整個上傳失敗
  const removed = await removeBackground(image.buffer, image.contentType);
  if (removed) image = removed;

  if (!isClosetImageMime(image.contentType)) {
    return NextResponse.json({ error: '圖片處理失敗' }, { status: 500, headers: NO_STORE });
  }

  let stored;
  try {
    stored = await uploadClosetImage(supabase, user.id, image.buffer, image.contentType);
  } catch (err) {
    console.error('[closet-items/upload] upload failed:', (err as Error).message);
    return NextResponse.json({ error: '圖片儲存失敗' }, { status: 500, headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from('closet_items')
    .insert({
      user_id: user.id,
      name: meta.data.name ?? '未命名衣物',
      category: meta.data.category ?? 'uncategorized',
      image_url: stored.signedUrl,
      source_type: 'OWNED',
      source_ref_id: null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(CLOSET_BUCKET).remove([stored.filePath]);
    console.error('[closet-items/upload] insert failed:', error.message);
    return NextResponse.json({ error: '衣物建立失敗' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json(
    { data, imageUrl: stored.signedUrl, expiresAt: stored.expiresAt },
    { status: 201, headers: NO_STORE }
  );
}
