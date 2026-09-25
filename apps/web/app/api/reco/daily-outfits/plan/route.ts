import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';

/**
 * 今日穿搭計畫：每人每天一筆（daily_outfit_plans 有 UNIQUE(user_id, date)）。
 * userId 一律取自 session，不接受 client 傳入；RLS 也只允許碰自己的資料。
 *
 * GET    /api/reco/daily-outfits/plan?date=YYYY-MM-DD → { ok, plan | null }
 * PUT    /api/reco/daily-outfits/plan  { date, outfitId, layoutSlots, occasion?, weather? } → { ok, plan }
 * PATCH  /api/reco/daily-outfits/plan  { date, wore } → { ok, plan }（隔天回答「有沒有穿」）
 * DELETE /api/reco/daily-outfits/plan?date=YYYY-MM-DD → { ok }
 */

const NO_STORE = { 'Cache-Control': 'private, no-store' };

// 日期由前端用使用者當地時間算好送來（台灣早上 8 點前 UTC 還是昨天）
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

const LayoutSlotSchema = z.object({
  slotKey: z.string().min(1).max(50),
  item: z
    .object({
      id: z.string().max(100).optional(),
      name: z.string().max(200).optional(),
      imageUrl: z.string().max(2000).optional(),
    })
    .passthrough(),
  priority: z.number().int(),
});

const PutBodySchema = z.object({
  date: DateSchema,
  outfitId: z.number().int(),
  layoutSlots: z.array(LayoutSlotSchema).min(1).max(10),
  occasion: z.string().max(50).optional(),
  weather: z.record(z.string(), z.unknown()).optional(),
});

const PatchBodySchema = z.object({
  date: DateSchema,
  wore: z.boolean(),
});

interface PlanRow {
  date: string;
  outfit_id: number;
  layout_slots: z.infer<typeof LayoutSlotSchema>[];
  occasion: string | null;
  weather: Record<string, unknown> | null;
  wore: boolean | null;
  updated_at: string | null;
}

function toPlan(row: PlanRow) {
  return {
    date: row.date,
    outfitId: row.outfit_id,
    layoutSlots: row.layout_slots,
    occasion: row.occasion,
    weather: row.weather,
    wore: row.wore,
    updatedAt: row.updated_at,
  };
}

const PLAN_COLUMNS = 'date, outfit_id, layout_slots, occasion, weather, wore, updated_at';

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);

  const date = DateSchema.safeParse(req.nextUrl.searchParams.get('date'));
  if (!date.success) return json({ ok: false, error: 'Invalid date' }, 400);

  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .select(PLAN_COLUMNS)
    .eq('user_id', user.id)
    .eq('date', date.data)
    .maybeSingle();

  if (error) {
    console.error('[daily-outfits/plan] select failed:', error.message);
    return json({ ok: false, error: 'Failed to load plan' }, 500);
  }

  return json({ ok: true, plan: data ? toPlan(data as PlanRow) : null });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);

  let body: z.infer<typeof PutBodySchema>;
  try {
    body = PutBodySchema.parse(await req.json());
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, 400);
  }

  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .upsert(
      {
        user_id: user.id,
        date: body.date,
        outfit_id: body.outfitId,
        layout_slots: body.layoutSlots,
        occasion: body.occasion ?? null,
        weather: body.weather ?? null,
        // 換了一套就要重新問有沒有穿
        wore: null,
      },
      { onConflict: 'user_id,date' }
    )
    .select(PLAN_COLUMNS)
    .single();

  if (error) {
    console.error('[daily-outfits/plan] upsert failed:', error.message);
    return json({ ok: false, error: 'Failed to save plan' }, 500);
  }

  return json({ ok: true, plan: toPlan(data as PlanRow) });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);

  let body: z.infer<typeof PatchBodySchema>;
  try {
    body = PatchBodySchema.parse(await req.json());
  } catch {
    return json({ ok: false, error: 'Invalid request body' }, 400);
  }

  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .update({ wore: body.wore })
    .eq('user_id', user.id)
    .eq('date', body.date)
    .select(PLAN_COLUMNS)
    .maybeSingle();

  if (error) {
    console.error('[daily-outfits/plan] update failed:', error.message);
    return json({ ok: false, error: 'Failed to update plan' }, 500);
  }
  if (!data) return json({ ok: false, error: 'Plan not found' }, 404);

  return json({ ok: true, plan: toPlan(data as PlanRow) });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return json({ ok: false, error: 'Unauthorized' }, 401);

  const date = DateSchema.safeParse(req.nextUrl.searchParams.get('date'));
  if (!date.success) return json({ ok: false, error: 'Invalid date' }, 400);

  const { error } = await supabase
    .from('daily_outfit_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date.data);

  if (error) {
    console.error('[daily-outfits/plan] delete failed:', error.message);
    return json({ ok: false, error: 'Failed to delete plan' }, 500);
  }

  return json({ ok: true });
}
