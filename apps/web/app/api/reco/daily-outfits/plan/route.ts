// apps/web/app/api/reco/daily-outfits/plan/route.ts
// GET 今日穿搭計畫（回填用）

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface DailyPlanResponse {
  ok: boolean;
  plan: {
    outfitId: number;
    layoutSlots: Record<string, any>;
    occasion?: string;
  } | null;
  message?: string;
}

/**
 * GET /api/reco/daily-outfits/plan?date=...
 * 查詢指定日期的穿搭計畫。userId 從 session 取得。
 */
export async function GET(req: NextRequest): Promise<NextResponse<DailyPlanResponse>> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ ok: false, plan: null, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 查詢 daily_outfit_plans
    const { data, error } = await supabase
      .from('daily_outfit_plans')
      .select('outfit_id, layout_slots, occasion')
      .eq('user_id', user.id) // 改用 session user.id
      .eq('date', date)
      .maybeSingle(); // 可能沒有資料

    if (error) {
      console.error('[API] plan query error:', error);
      // TODO: RLS 失敗時，error.code 可能為 '42501' (permission denied)，需做對應處理
      return NextResponse.json({ ok: false, plan: null, message: '查詢失敗' }, { status: 500 });
    }

    // 沒有找到計畫
    if (!data) {
      return NextResponse.json({ ok: true, plan: null }, { status: 200 });
    }

    return NextResponse.json({
      ok: true,
      plan: {
        outfitId: data.outfit_id,
        layoutSlots: data.layout_slots,
        occasion: data.occasion
      }
    }, { status: 200 });
  } catch (error) {
    console.error('[API] GET /plan error:', error);
    return NextResponse.json({ ok: false, plan: null, message: '伺服器錯誤' }, { status: 500 });
  }
}
