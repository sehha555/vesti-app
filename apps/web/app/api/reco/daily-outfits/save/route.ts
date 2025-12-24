// apps/web/app/api/reco/daily-outfits/save/route.ts
// 使用 Supabase 持久化每日穿搭計畫

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// TypeScript Interface 定義
interface SaveDailyOutfitRequest {
  userId: string;
  date: string;
  outfitId: number;
  layoutSlots: Record<string, any>;
  occasion?: string;
  weather?: Record<string, any>;
}

interface DailyOutfitResponse {
  ok: boolean;
  saved?: boolean;
  date?: string;
  outfits?: Array<{
    outfitId: number;
    layoutSlots: Record<string, any>;
  }>;
  message?: string;
}

// 初始化 Supabase Client（使用 service_role 以繞過 RLS）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('缺少 Supabase 環境變數: NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/reco/daily-outfits/save
 * 保存/更新今日穿搭計畫（upsert）
 */
export async function POST(req: NextRequest): Promise<NextResponse<DailyOutfitResponse>> {
  try {
    // 驗證 Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { ok: false, message: '必須使用 application/json' },
        { status: 400 }
      );
    }

    // 解析請求體
    const body = await req.json() as SaveDailyOutfitRequest;

    // 驗證必填字段
    if (!body.userId || !body.date || !body.outfitId || !body.layoutSlots) {
      return NextResponse.json(
        {
          ok: false,
          message: '缺少必填字段: userId, date, outfitId, layoutSlots'
        },
        { status: 400 }
      );
    }

    // 驗證 date 格式 (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
      return NextResponse.json(
        { ok: false, message: '日期格式無效，應為 YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 執行 Upsert（衝突時更新，無衝突時新增）
    // Unique key: (user_id, date)
    const { data, error } = await supabase
      .from('daily_outfit_plans')
      .upsert(
        {
          user_id: body.userId,
          date: body.date,
          outfit_id: body.outfitId,
          layout_slots: body.layoutSlots,
          occasion: body.occasion || null,
          weather: body.weather || null,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,date' // 複合唯一鍵
        }
      )
      .select();

    if (error) {
      console.error('[API] Supabase upsert error:', error.code, error.message);
      return NextResponse.json(
        { ok: false, message: '無法保存穿搭計畫' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, saved: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] POST /api/reco/daily-outfits/save error:', error);
    return NextResponse.json(
      { ok: false, message: '伺服器錯誤' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reco/daily-outfits/save?userId=...&date=...
 * 回填今日已選定的穿搭計畫
 */
export async function GET(req: NextRequest): Promise<NextResponse<DailyOutfitResponse>> {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId || !date) {
      return NextResponse.json(
        { ok: false, message: 'userId 和 date 為必填參數' },
        { status: 400 }
      );
    }

    // 驗證 date 格式
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { ok: false, message: '日期格式無效，應為 YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 查詢該用戶在指定日期的穿搭計畫
    const { data, error } = await supabase
      .from('daily_outfit_plans')
      .select('outfit_id, layout_slots')
      .eq('user_id', userId)
      .eq('date', date)
      .single(); // 期望只有一筆記錄

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned，這不是錯誤
      console.error('[API] Supabase select error:', error);
      return NextResponse.json(
        { ok: false, message: '無法查詢穿搭計畫' },
        { status: 500 }
      );
    }

    // 如果沒有找到記錄，回傳空陣列
    if (!data) {
      return NextResponse.json(
        {
          ok: true,
          date: date,
          outfits: []
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        date: date,
        outfits: [
          {
            outfitId: data.outfit_id,
            layoutSlots: data.layout_slots
          }
        ]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API] GET /api/reco/daily-outfits/save error:', error);
    return NextResponse.json(
      { ok: false, message: '伺服器錯誤' },
      { status: 500 }
    );
  }
}
