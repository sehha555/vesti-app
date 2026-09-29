import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { readImageUpload } from '../../../../lib/closet/read-image-upload';
import { analyzeOrderScreenshot } from '../../../../lib/closet/analyze-order';

export const runtime = 'nodejs';

const RATE_LIMIT = { keyPrefix: 'closet-analyze-order', maxRequests: 10, windowMs: 600_000 };
const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * POST /api/closet-items/analyze-order
 * FormData: file（訂單截圖，JPG/PNG/WebP，最大 10MB）
 * 回 { data: { orderId, items: [{ name, category, color, brand, box }] } }。只分析，不存檔；
 * 前端依 box 從截圖裁縮圖，再逐件送 closet-items/upload（source_type=EXTERNAL_ORDER）。
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user } = await getSupabaseAndUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const rl = await checkRateLimit(user.id, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: '分析太頻繁，請稍後再試' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
    );
  }

  const image = await readImageUpload(req);
  if (image instanceof NextResponse) return image;

  try {
    const data = await analyzeOrderScreenshot(image.buffer, image.contentType);
    return NextResponse.json({ data }, { headers: NO_STORE });
  } catch (err) {
    console.error('[closet-items/analyze-order] 分析失敗:', (err as Error).message);
    return NextResponse.json({ error: 'AI 讀取訂單失敗，請稍後再試' }, { status: 502, headers: NO_STORE });
  }
}
