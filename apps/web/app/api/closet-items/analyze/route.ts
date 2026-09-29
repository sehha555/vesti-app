import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { readImageUpload } from '../../../../lib/closet/read-image-upload';
import { analyzeClothingImage } from '../../../../lib/closet/analyze-clothing';

export const runtime = 'nodejs';

const RATE_LIMIT = { keyPrefix: 'closet-analyze', maxRequests: 20, windowMs: 600_000 };
const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * POST /api/closet-items/analyze
 * FormData: file（JPG/PNG/WebP，最大 10MB）
 * 看照片預填上傳表單（名稱、類別、顏色、品牌、標籤）。只分析，不存檔。
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
    const data = await analyzeClothingImage(image.buffer, image.contentType);
    return NextResponse.json({ data }, { headers: NO_STORE });
  } catch (err) {
    console.error('[closet-items/analyze] 分析失敗:', (err as Error).message);
    return NextResponse.json({ error: 'AI 分析失敗，請手動填寫' }, { status: 502, headers: NO_STORE });
  }
}
