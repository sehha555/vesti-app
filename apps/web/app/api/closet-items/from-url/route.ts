import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { safeFetch, SafeFetchError } from '@/lib/http/safe-fetch';
import { parseOg, knownProductImages } from '@/lib/closet/og';
import { pickFlatImage } from '@/lib/closet/pick-flat-image';
import { CLOSET_CATEGORIES } from '@/lib/closet/categories';
import { createClosetItemFromImage } from '@/lib/closet/create-item';

export const runtime = 'nodejs';

const BodySchema = z.object({
  url: z.string().url(),
  name: z.string().trim().min(1).max(100).optional(),
  category: z.enum(CLOSET_CATEGORIES).optional(),
});

const RATE_LIMIT = { keyPrefix: 'from-url', maxRequests: 10, windowMs: 600_000 };
const IMAGE_LIMIT = { maxBytes: 10 * 1024 * 1024, timeoutMs: 10_000, accept: ['image/'] };
// 第一次抓同時接受商品頁與圖片：貼進來的可能是「複製圖片位址」的圖片網址
const PAGE_OR_IMAGE_LIMIT = { ...IMAGE_LIMIT, accept: ['text/html', 'application/xhtml+xml', 'image/'] };

// 匯入失敗的原因對應給使用者看的訊息
const CREATE_ERRORS = {
  BAD_MIME: { status: 422, error: '商品圖片格式不支援（只接受 JPEG / PNG / WebP）' },
  BAD_SIGNATURE: { status: 422, error: '商品圖片內容不是有效的圖檔' },
  STORAGE: { status: 500, error: '圖片儲存失敗' },
  DB: { status: 500, error: '衣物建立失敗' },
} as const;

/**
 * POST /api/closet-items/from-url
 * 貼商品頁網址（抓 og:image）、圖片網址（直接存）、或已知純 JS 網站的商品頁（固定規則推圖片）→ 去背後存進衣櫃。
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return jsonNoStore({ error: '請提供有效的商品網址' }, { status: 400 });
  }

  // 1. 找出圖片：已知規則 → 直接是圖片 → 商品頁的 og:image
  let image;
  let title: string | null = null;
  try {
    const known = knownProductImages(body.url);
    if (known.length > 0) {
      // 同一件商品的多張圖裡混著模特兒照與平拍照，抓回來讓模型挑最像商品圖的那張
      const settled = await Promise.allSettled(known.map((u) => safeFetch(u, IMAGE_LIMIT)));
      const candidates = settled
        .flatMap((r, i) => (r.status === 'fulfilled' ? [{ url: known[i], ...r.value }] : []))
        .filter((c) => c.contentType.startsWith('image/'));
      if (candidates.length === 0) {
        // 全部被網站的 robots.txt / 封鎖名單擋下時，講清楚原因
        const disallowed = settled.find(
          (r) => r.status === 'rejected' && r.reason instanceof SafeFetchError && r.reason.code === 'DISALLOWED'
        ) as PromiseRejectedResult | undefined;
        if (disallowed) return fetchErrorResponse(disallowed.reason, '無法讀取這個網址');
        return jsonNoStore({ error: '這個網站抓不到商品圖片，請改貼圖片網址或拍照上傳' }, { status: 422 });
      }
      image = await pickFlatImage(candidates);
    } else {
      const first = await safeFetch(body.url, PAGE_OR_IMAGE_LIMIT);
      if (first.contentType.startsWith('image/')) {
        image = first;
      } else {
        const og = parseOg(first.buffer.toString('utf8'), first.finalUrl);
        title = og.title;
        if (!og.image) {
          return jsonNoStore({ error: '這個網站抓不到商品圖片，請改貼圖片網址或拍照上傳' }, { status: 422 });
        }
        image = await safeFetch(og.image, IMAGE_LIMIT);
      }
    }
  } catch (err) {
    return fetchErrorResponse(err, '無法讀取這個網址');
  }

  // 2. 驗圖、去背（UNIQLO 的商品圖多半是模特兒實穿照，去掉人和背景才看得出是哪一件）、存進衣櫃
  const result = await createClosetItemFromImage(supabase, user.id, image, {
    name: body.name ?? title ?? '未命名商品',
    category: body.category ?? 'uncategorized',
    sourceUrl: body.url,
  });
  if (result.error) {
    const { status, error } = CREATE_ERRORS[result.error];
    return jsonNoStore({ error }, { status });
  }

  return jsonNoStore({ data: result.data, imageUrl: result.imageUrl, expiresAt: result.expiresAt }, { status: 201 });
}

function fetchErrorResponse(err: unknown, fallback: string): NextResponse {
  if (err instanceof SafeFetchError) {
    const status = err.code === 'BLOCKED' ? 400 : 422;
    const message =
      err.code === 'BLOCKED'
        ? '這個網址不允許匯入'
        : err.code === 'DISALLOWED'
          ? '這個網站不允許自動擷取，請改用拍照上傳'
          : err.code === 'TOO_LARGE'
          ? '內容太大，無法匯入'
          : fallback;
    return jsonNoStore({ error: message }, { status });
  }
  console.error('[closet-items/from-url] unexpected:', (err as Error).message);
  return jsonNoStore({ error: fallback }, { status: 500 });
}
