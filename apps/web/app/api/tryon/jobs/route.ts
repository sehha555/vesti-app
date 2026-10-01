import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { getTryonStates } from '@/lib/tryon/jobs';

export const runtime = 'nodejs';

// 卡片每 15 秒問一次，一小時最多 240 次；留點餘裕給多開分頁
const RATE_LIMIT = { keyPrefix: 'tryon-jobs', maxRequests: 600, windowMs: 3_600_000 };
const IdsSchema = z.array(z.string().uuid()).min(1).max(10);

/**
 * GET /api/tryon/jobs?ids=a,b,c
 * 查自己幾件試穿工作的狀態，做好的附結果圖網址。Returns: 200 { jobs: TryonState[] }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const ids = IdsSchema.safeParse((req.nextUrl.searchParams.get('ids') ?? '').split(',').filter(Boolean));
  if (!ids.success) return jsonNoStore({ error: 'ids 格式不正確' }, { status: 400 });

  try {
    return jsonNoStore({ jobs: await getTryonStates(supabase, user.id, ids.data) });
  } catch (err) {
    console.error('[tryon/jobs] failed:', (err as Error).message);
    return jsonNoStore({ error: '讀取試穿狀態失敗' }, { status: 500 });
  }
}
