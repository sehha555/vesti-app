import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

/**
 * 儲存穿搭的請求 body 型別
 */
interface SaveOutfitRequest {
  userId: string;
  outfitData: {
    imageUrl: string;
    styleName: string;
    description: string;
    heroImageUrl?: string;
    items?: {
      id: string;
      name: string;
      imageUrl: string;
    }[];
  };
  weather?: {
    temp_c: number;
    condition: string;
    description: string;
    iconUrl?: string;
    humidity: number;
    feels_like: number;
    locationName?: string;
  };
  occasion?: string;
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
 *   "outfitData": {
 *     "imageUrl": "...",
 *     "styleName": "...",
 *     "description": "...",
 *     "heroImageUrl": "...",
 *     "items": [...]
 *   },
 *   "weather": { ... },
 *   "occasion": "casual",
 *   "outfitType": "saved" | "confirmed",
 *   "timestamp": "ISO 8601 timestamp" (optional)
 * }
 *
 * Response:
 * - 201: { success: true, savedOutfit: {...} }
 * - 400: { success: false, error: "..." }
 * - 500: { success: false, error: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveOutfitRequest;

    // === 驗證必要欄位 ===
    if (!body.userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (!body.outfitData || typeof body.outfitData !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: outfitData' },
        { status: 400 }
      );
    }

    if (!body.outfitData.imageUrl || !body.outfitData.styleName) {
      return NextResponse.json(
        { success: false, error: 'outfitData must contain imageUrl and styleName' },
        { status: 400 }
      );
    }

    // === 檢查是否已存在相同的穿搭（避免重複儲存）===
    const { data: existingOutfits, error: checkError } = await supabaseAdmin
      .from('saved_outfits')
      .select('id, outfit_data, created_at')
      .eq('user_id', body.userId)
      .eq('outfit_type', body.outfitType || 'saved')
      .order('created_at', { ascending: false })
      .limit(5); // 只檢查最近 5 筆

    if (checkError) {
      console.error('[API /saved-outfits] Error checking duplicates:', checkError);
      // 不阻斷流程，繼續儲存
    }

    // 檢查是否有完全相同的穿搭（比對 styleName 和 imageUrl）
    if (existingOutfits && existingOutfits.length > 0) {
      const duplicate = existingOutfits.find((outfit) => {
        const existingData = outfit.outfit_data as typeof body.outfitData;
        return (
          existingData.styleName === body.outfitData.styleName &&
          existingData.imageUrl === body.outfitData.imageUrl
        );
      });

      if (duplicate) {
        // 如果是最近 1 分鐘內儲存的，視為重複
        const timeDiff = new Date().getTime() - new Date(duplicate.created_at).getTime();
        if (timeDiff < 60000) { // 1 分鐘 = 60000ms
          console.log('[API /saved-outfits] Duplicate outfit detected (within 1 min):', duplicate.id);
          return NextResponse.json(
            {
              success: true,
              savedOutfit: duplicate,
              message: 'Outfit already saved'
            },
            { status: 200 } // 回傳 200 而非 201，表示已存在
          );
        }
      }
    }

    // === 寫入 Supabase ===
    const { data, error } = await supabaseAdmin
      .from('saved_outfits')
      .insert([
        {
          user_id: body.userId,
          outfit_data: body.outfitData,
          weather_info: body.weather || null,
          occasion: body.occasion || 'casual',
          outfit_type: body.outfitType || 'saved',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[API /saved-outfits] Supabase error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save outfit', details: error.message },
        { status: 500 }
      );
    }

    console.log('[API /saved-outfits] Outfit saved successfully:', data.id);

    return NextResponse.json(
      {
        success: true,
        savedOutfit: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API /saved-outfits POST] Error details:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.toString() : String(error)
      },
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
 * - outfitType (optional): 'saved' | 'confirmed'，預設 'saved'
 * - occasion (optional): 'casual' | 'work' | 'date' | 'formal' | 'outdoor'
 * - limit (optional): 限制回傳數量，預設 20
 *
 * Response:
 * - 200: { success: true, outfits: [...], count: number }
 * - 400: { success: false, error: "..." }
 * - 500: { success: false, error: "..." }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const outfitType = searchParams.get('outfitType') || 'saved';
    const occasion = searchParams.get('occasion');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // === 驗證必要參數 ===
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // === 建立查詢 ===
    let query = supabaseAdmin
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
        { success: false, error: 'Failed to fetch saved outfits', details: error.message },
        { status: 500 }
      );
    }

    console.log(`[API /saved-outfits] Fetched ${data?.length || 0} outfits for user ${userId}`);

    return NextResponse.json(
      {
        success: true,
        outfits: data || [],
        count: data?.length || 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API /saved-outfits] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
