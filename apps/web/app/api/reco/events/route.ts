import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { outfitKeyFromItemIds } from '../../../../lib/outfits/key';
import { FEEDBACK_ACTIONS, DISLIKE_REASON_VALUES } from '../../../../lib/feedback/types';

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const RATE_LIMIT = { keyPrefix: 'reco-events', maxRequests: 120, windowMs: 60_000 };

const EventSchema = z.object({
  action: z.enum(FEEDBACK_ACTIONS),
  itemIds: z.array(z.string().uuid()).min(1).max(10),
  reasons: z.array(z.enum(DISLIKE_REASON_VALUES)).max(DISLIKE_REASON_VALUES.length).optional(),
  context: z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      occasion: z.string().max(50).optional(),
      styleName: z.string().max(200).optional(),
      weather: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

/**
 * POST /api/reco/events
 * 記錄使用者對一套推薦的反應（要這套 / 不要 / 滑過 / 收藏 / 有沒有穿），下一次推薦會參考。
 * Body: { action, itemIds, reasons?, context? }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });
  }

  const rl = await checkRateLimit(user.id, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
    );
  }

  let body: z.infer<typeof EventSchema>;
  try {
    body = EventSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400, headers: NO_STORE });
  }

  const itemIds = [...new Set(body.itemIds)];
  const { error } = await supabase.from('outfit_feedback').insert({
    user_id: user.id,
    action: body.action,
    outfit_key: outfitKeyFromItemIds(itemIds),
    item_ids: itemIds,
    // 原因只對「不要」有意義
    reasons: body.action === 'dislike' ? [...new Set(body.reasons ?? [])] : [],
    context: body.context ?? {},
  });

  if (error) {
    console.error('[reco/events] insert failed:', error.message);
    return NextResponse.json({ ok: false, error: 'Failed to record event' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
}
