import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { outfitKeyFromItemIds } from '@/lib/outfits/key';
import { DateSchema, WeatherSchema } from '@/lib/outfits/schemas';
import { FEEDBACK_ACTIONS, DISLIKE_REASON_VALUES } from '@/lib/feedback/types';

const RATE_LIMIT = { keyPrefix: 'reco-events', maxRequests: 120, windowMs: 60_000 };

const EventSchema = z.object({
  action: z.enum(FEEDBACK_ACTIONS),
  itemIds: z.array(z.string().uuid()).min(1).max(10),
  reasons: z.array(z.enum(DISLIKE_REASON_VALUES)).max(DISLIKE_REASON_VALUES.length).optional(),
  context: z
    .object({
      date: DateSchema.optional(),
      occasion: z.string().max(50).optional(),
      styleName: z.string().max(200).optional(),
      weather: WeatherSchema.optional(),
    })
    .optional(),
});

/**
 * POST /api/reco/events
 * 記錄使用者對一套推薦的反應（要這套 / 不要 / 滑過 / 收藏 / 有沒有穿），下一次推薦會參考。
 * Body: { action, itemIds, reasons?, context? }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body: z.infer<typeof EventSchema>;
  try {
    body = EventSchema.parse(await req.json());
  } catch {
    return jsonNoStore({ error: 'Invalid request body' }, { status: 400 });
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
    return jsonNoStore({ error: 'Failed to record event' }, { status: 500 });
  }

  return jsonNoStore({ ok: true }, { status: 201 });
}
