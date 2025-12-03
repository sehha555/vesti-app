import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * 儲存穿搭的請求 body 型別
 */
interface SaveOutfitRequest {
  userId: string;
  items: string[]; // 單品 ID 列表
  weather: {
    temp_c: number;
    condition: string;
    description: string;
    iconUrl?: string;
    humidity: number;
    feels_like: number;
    locationName?: string;
  };
  occasion: string;
  outfitType?: 'saved' | 'confirmed'; // saved = 收藏, confirmed = 確認穿著
}

/**
 * POST /api/saved-outfits
 *
 * 儲存使用者選擇的穿搭組合
 *
 * Body:
 * {
 *   "userId": "uuid",
 *   "items": ["item-id-1", "item-id-2", ...],
 *   "weather": { ... },
 *   "occasion": "casual",
 *   "outfitType": "saved" | "confirmed"
 * }
 *
 * Response:
 * - 201: 儲存成功，回傳穿搭資料
 * - 400: 請求參數錯誤
 * - 500: 伺服器錯誤
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveOutfitRequest;

    // === 驗證必要欄位 ===
    if (!body.userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid field: items (must be a non-empty array)' },
        { status: 400 }
      );
    }

    if (!body.weather || typeof body.weather !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid field: weather' },
        { status: 400 }
      );
    }

    if (!body.occasion) {
      return NextResponse.json(
        { error: 'Missing required field: occasion' },
        { status: 400 }
      );
    }

    // === 寫入 Supabase ===
    const { data, error } = await supabase
      .from('saved_outfits')
      .insert([
        {
          user_id: body.userId,
          items: body.items,
          weather_info: body.weather,
          occasion: body.occasion,
          outfit_type: body.outfitType || 'saved',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[API /saved-outfits] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save outfit', details: error.message },
        { status: 500 }
      );
    }

    console.log('[API /saved-outfits] Outfit saved successfully:', data.id);

    return NextResponse.json(
      {
        message: 'Outfit saved successfully',
        outfit: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /saved-outfits] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/saved-outfits?userId=xxx
 *
 * 取得使用者儲存的穿搭列表
 *
 * Query Parameters:
 * - userId (required): 使用者 ID
 * - outfitType (optional): 'saved' | 'confirmed'
 * - occasion (optional): 'casual' | 'work' | 'date' | 'formal' | 'outdoor'
 * - limit (optional): 限制回傳數量，預設 20
 *
 * Response:
 * - 200: 成功，回傳穿搭列表
 * - 400: 缺少 userId
 * - 500: 伺服器錯誤
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const outfitType = searchParams.get('outfitType');
    const occasion = searchParams.get('occasion');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // === 驗證必要參數 ===
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // === 建立查詢 ===
    let query = supabase
      .from('saved_outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // 可選篩選條件
    if (outfitType) {
      query = query.eq('outfit_type', outfitType);
    }
    if (occasion) {
      query = query.eq('occasion', occasion);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API /saved-outfits] Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch saved outfits', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        outfits: data || [],
        count: data?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /saved-outfits] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
