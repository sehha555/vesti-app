import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { taipeiDate } from '../../../../../lib/ai/recommendation-period';

/**
 * 今天穿哪一套：每人每天（台灣日期，由 server 決定）一筆 daily_outfit_plans。
 * GET 讀今天的、POST 選定（同一天再選會蓋掉）、DELETE 取消。
 */

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const RATE_LIMIT = { keyPrefix: 'daily-plan', maxRequests: 30, windowMs: 60_000 };

const PlanSchema = z.object({
  outfitId: z.number().int(),
  layoutSlots: z
    .array(
      z.object({
        slotKey: z.string().max(40),
        item: z.object({ id: z.string().uuid(), name: z.string().max(200).optional() }),
      })
    )
    .min(1)
    .max(10),
  occasion: z.enum(['casual', 'work', 'date', 'sport']).optional(),
  weather: z.record(z.string(), z.unknown()).optional(),
});

interface PlanRow {
  date: string;
  outfit_id: number;
  layout_slots: Array<{ slotKey: string; item: { id: string; name?: string } }>;
  occasion: string | null;
}

function toPlan(row: PlanRow) {
  return {
    date: row.date,
    outfitId: row.outfit_id,
    itemIds: row.layout_slots.map((s) => s.item.id),
    occasion: row.occasion,
  };
}

export async function GET(): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });

  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .select('date, outfit_id, layout_slots, occasion')
    .eq('user_id', user.id)
    .eq('date', taipeiDate())
    .maybeSingle();
  if (error) {
    console.error('[daily-outfits/plan] read failed:', error.message);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true, plan: data ? toPlan(data as PlanRow) : null }, { headers: NO_STORE });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });

  const rl = await checkRateLimit(user.id, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
    );
  }

  const parsed = PlanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400, headers: NO_STORE });
  }
  const { outfitId, layoutSlots, occasion, weather } = parsed.data;

  // 只存 id 與名稱；signed URL 會過期，不存
  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .upsert(
      {
        user_id: user.id,
        date: taipeiDate(),
        outfit_id: outfitId,
        layout_slots: layoutSlots.map((s) => ({ slotKey: s.slotKey, item: { id: s.item.id, name: s.item.name } })),
        occasion: occasion ?? null,
        weather: weather ?? null,
      },
      { onConflict: 'user_id,date' }
    )
    .select('date, outfit_id, layout_slots, occasion')
    .single();
  if (error) {
    console.error('[daily-outfits/plan] save failed:', error.message);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true, plan: toPlan(data as PlanRow) }, { headers: NO_STORE });
}

export async function DELETE(): Promise<NextResponse> {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: NO_STORE });

  const { error } = await supabase
    .from('daily_outfit_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('date', taipeiDate());
  if (error) {
    console.error('[daily-outfits/plan] delete failed:', error.message);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: NO_STORE });
  }

  return NextResponse.json({ ok: true, plan: null }, { headers: NO_STORE });
}
