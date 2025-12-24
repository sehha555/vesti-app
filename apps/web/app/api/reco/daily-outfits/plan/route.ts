// apps/web/app/api/reco/daily-outfits/plan/route.ts
// GET 今日穿搭計畫（回填用）

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface DailyPlanResponse {
  ok: boolean;
  plan: {
    outfitId: number;
    layoutSlots: Record<string, any>;
    occasion?: string;
  } | null;
  message?: string;
}

// 初始化 Supabase Client（使用 service_role 繞過 RLS）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/reco/daily-outfits/plan?userId=...&date=...
 * 查詢指定日期的穿搭計畫
 */
export async function GET(req: NextRequest): Promise<NextResponse<DailyPlanResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    if (!userId) {
      return NextResponse.json({ ok: false, plan: null, message: 'userId 為必填' }, { status: 400 });
    }

    // 查詢 daily_outfit_plans
    const { data, error } = await supabase
      .from('daily_outfit_plans')
      .select('outfit_id, layout_slots, occasion')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle(); // 可能沒有資料

    if (error) {
      console.error('[API] plan query error:', error);
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
