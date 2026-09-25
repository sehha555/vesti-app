import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/http/require-user';
import { jsonNoStore } from '@/lib/http/no-store';
import { DateSchema, LayoutSlotSchema, WeatherSchema, type LayoutSlotInput } from '@/lib/outfits/schemas';

/**
 * 今日穿搭計畫：每人每天一筆（daily_outfit_plans 有 UNIQUE(user_id, date)）。
 * userId 一律取自 session，不接受 client 傳入；RLS 也只允許碰自己的資料。
 *
 * GET    /api/reco/daily-outfits/plan?date=YYYY-MM-DD → { ok, plan | null }
 * PUT    /api/reco/daily-outfits/plan  { date, outfitId, layoutSlots, occasion?, weather? } → { ok, plan }
 * PATCH  /api/reco/daily-outfits/plan  { date, wore } → { ok, plan }（隔天回答「有沒有穿」）
 * DELETE /api/reco/daily-outfits/plan?date=YYYY-MM-DD → { ok }
 */

const RATE_LIMIT = { keyPrefix: 'daily-plan', maxRequests: 60, windowMs: 60_000 };

const PutBodySchema = z.object({
  date: DateSchema,
  outfitId: z.number().int(),
  layoutSlots: z.array(LayoutSlotSchema).min(1).max(10),
  occasion: z.string().max(50).optional(),
  weather: WeatherSchema.optional(),
});

const PatchBodySchema = z.object({
  date: DateSchema,
  wore: z.boolean(),
});

interface PlanRow {
  date: string;
  outfit_id: number;
  layout_slots: LayoutSlotInput[];
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

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const date = DateSchema.safeParse(req.nextUrl.searchParams.get('date'));
  if (!date.success) return jsonNoStore({ error: 'Invalid date' }, { status: 400 });

  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .select(PLAN_COLUMNS)
    .eq('user_id', user.id)
    .eq('date', date.data)
    .maybeSingle();

  if (error) {
    console.error('[daily-outfits/plan] select failed:', error.message);
    return jsonNoStore({ error: 'Failed to load plan' }, { status: 500 });
  }

  return jsonNoStore({ ok: true, plan: data ? toPlan(data as PlanRow) : null });
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body: z.infer<typeof PutBodySchema>;
  try {
    body = PutBodySchema.parse(await req.json());
  } catch {
    return jsonNoStore({ error: 'Invalid request body' }, { status: 400 });
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
    return jsonNoStore({ error: 'Failed to save plan' }, { status: 500 });
  }

  return jsonNoStore({ ok: true, plan: toPlan(data as PlanRow) });
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  let body: z.infer<typeof PatchBodySchema>;
  try {
    body = PatchBodySchema.parse(await req.json());
  } catch {
    return jsonNoStore({ error: 'Invalid request body' }, { status: 400 });
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
    return jsonNoStore({ error: 'Failed to update plan' }, { status: 500 });
  }
  if (!data) return jsonNoStore({ error: 'Plan not found' }, { status: 404 });

  return jsonNoStore({ ok: true, plan: toPlan(data as PlanRow) });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const auth = await requireUser(req, RATE_LIMIT);
  if (auth.response) return auth.response;
  const { supabase, user } = auth;

  const date = DateSchema.safeParse(req.nextUrl.searchParams.get('date'));
  if (!date.success) return jsonNoStore({ error: 'Invalid date' }, { status: 400 });

  const { error } = await supabase
    .from('daily_outfit_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date.data);

  if (error) {
    console.error('[daily-outfits/plan] delete failed:', error.message);
    return jsonNoStore({ error: 'Failed to delete plan' }, { status: 500 });
  }

  return jsonNoStore({ ok: true });
}
