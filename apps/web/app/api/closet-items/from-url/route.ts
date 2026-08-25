import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyFileSignature } from '../../../../lib/security/file-signature';
import { safeFetch, SafeFetchError } from '../../../../lib/http/safe-fetch';
import { parseOg } from '../../../../lib/closet/og';
import { uploadClosetImage, isClosetImageMime, CLOSET_BUCKET } from '../../../../lib/closet/storage';

export const runtime = 'nodejs';

const CATEGORIES = ['top', 'outerwear', 'bottom', 'shoes', 'accessory', 'uncategorized'] as const;

const BodySchema = z.object({
  url: z.string().url(),
  name: z.string().trim().min(1).max(100).optional(),
  category: z.enum(CATEGORIES).optional(),
});

const RATE_LIMIT = { keyPrefix: 'from-url', maxRequests: 10, windowMs: 600_000 };
const PAGE_LIMIT = { maxBytes: 1_000_000, timeoutMs: 5_000, accept: ['text/html', 'application/xhtml+xml'] };
const IMAGE_LIMIT = { maxBytes: 10 * 1024 * 1024, timeoutMs: 10_000, accept: ['image/'] };

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * POST /api/closet-items/from-url
 * 貼商品頁網址 → 抓 og:image 存進衣櫃。不做去背。
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const rl = await checkRateLimit(user.id, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '匯入太頻繁，請稍後再試' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
    );
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: '請提供有效的商品網址' }, { status: 400, headers: NO_STORE });
  }

  // 1. 抓商品頁
  let og;
  try {
    const page = await safeFetch(body.url, PAGE_LIMIT);
    og = parseOg(page.buffer.toString('utf8'), page.finalUrl);
  } catch (err) {
    return fetchErrorResponse(err, '無法讀取這個網址');
  }

  if (!og.image) {
    return NextResponse.json(
      { error: '這個網站抓不到商品圖片，請改用拍照上傳' },
      { status: 422, headers: NO_STORE }
    );
  }

  // 2. 抓圖片
  let image;
  try {
    image = await safeFetch(og.image, IMAGE_LIMIT);
  } catch (err) {
    return fetchErrorResponse(err, '無法下載商品圖片');
  }

  if (!isClosetImageMime(image.contentType)) {
    return NextResponse.json(
      { error: '商品圖片格式不支援（只接受 JPEG / PNG / WebP）' },
      { status: 422, headers: NO_STORE }
    );
  }
  const signature = verifyFileSignature(image.buffer, image.contentType);
  if (!signature.valid) {
    return NextResponse.json({ error: '商品圖片內容不是有效的圖檔' }, { status: 422, headers: NO_STORE });
  }

  // 3. 存進 Storage + DB
  let stored;
  try {
    stored = await uploadClosetImage(supabase, user.id, image.buffer, image.contentType);
  } catch (err) {
    console.error('[closet-items/from-url] upload failed:', (err as Error).message);
    return NextResponse.json({ error: '圖片儲存失敗' }, { status: 500, headers: NO_STORE });
  }

  const { data, error } = await supabase
    .from('closet_items')
    .insert({
      user_id: user.id,
      name: body.name ?? og.title ?? '未命名商品',
      category: body.category ?? 'uncategorized',
      image_url: stored.signedUrl,
      source_url: body.url,
      source_type: 'OWNED',
      source_ref_id: null,
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(CLOSET_BUCKET).remove([stored.filePath]);
    console.error('[closet-items/from-url] insert failed:', error.message);
    return NextResponse.json({ error: '衣物建立失敗' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json(
    { data, imageUrl: stored.signedUrl, expiresAt: stored.expiresAt },
    { status: 201, headers: NO_STORE }
  );
}

function fetchErrorResponse(err: unknown, fallback: string): NextResponse {
  if (err instanceof SafeFetchError) {
    const status = err.code === 'BLOCKED' ? 400 : 422;
    const message =
      err.code === 'BLOCKED'
        ? '這個網址不允許匯入'
        : err.code === 'TOO_LARGE'
          ? '內容太大，無法匯入'
          : fallback;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE });
  }
  console.error('[closet-items/from-url] unexpected:', (err as Error).message);
  return NextResponse.json({ error: fallback }, { status: 500, headers: NO_STORE });
}
