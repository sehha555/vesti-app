import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyFileSignature } from '../../../../lib/security/file-signature';
import { isClosetImageMime } from '../../../../lib/closet/storage';
import { analyzeClothingImage } from '../../../../lib/closet/analyze-clothing';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
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

  let file: File | null;
  try {
    file = (await req.formData()).get('file') as File | null;
  } catch {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400, headers: NO_STORE });
  }
  if (!file) {
    return NextResponse.json({ error: 'File is required' }, { status: 400, headers: NO_STORE });
  }
  if (!isClosetImageMime(file.type)) {
    return NextResponse.json({ error: '只支援 JPG、PNG、WebP' }, { status: 400, headers: NO_STORE });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: '圖片不能超過 10MB' }, { status: 400, headers: NO_STORE });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!verifyFileSignature(buffer, file.type).valid) {
    return NextResponse.json({ error: '檔案內容與格式不符' }, { status: 400, headers: NO_STORE });
  }

  try {
    const data = await analyzeClothingImage(buffer, file.type);
    return NextResponse.json({ data }, { headers: NO_STORE });
  } catch (err) {
    console.error('[closet-items/analyze] 分析失敗:', (err as Error).message);
    return NextResponse.json({ error: 'AI 分析失敗，請手動填寫' }, { status: 502, headers: NO_STORE });
  }
}
