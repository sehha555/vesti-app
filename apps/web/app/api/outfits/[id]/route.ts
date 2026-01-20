// apps/web/app/api/outfits/[id]/route.ts
// 獲取單個 outfit

import { NextRequest } from 'next/server';
import { getSupabaseAndUser } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { jsonNoStore } from '../../../../lib/http/no-store';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認證使用者
    const { user } = await getSupabaseAndUser();
    if (!user) {
      return jsonNoStore(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // 驗證 ID 格式
    if (!id || typeof id !== 'string') {
      return jsonNoStore(
        { error: 'Invalid outfit ID' },
        { status: 400 }
      );
    }

    // 從 Supabase 查詢穿搭
    const { data, error } = await supabaseAdmin
      .from('saved_outfits')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // 確保使用者所有權
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Not found
        return jsonNoStore(
          { error: 'Outfit not found' },
          { status: 404 }
        );
      }
      console.error('[API /api/outfits/[id] GET] Supabase error:', error);
      return jsonNoStore(
        { error: '無法取得穿搭' },
        { status: 500 }
      );
    }

    if (!data) {
      return jsonNoStore(
        { error: 'Outfit not found' },
        { status: 404 }
      );
    }

    // 轉換回應格式
    const outfit = {
      id: data.id,
      userId: data.user_id,
      name: data.outfit_data?.styleName || data.outfit_data?.name || '未命名穿搭',
      description: data.outfit_data?.description,
      itemIds: data.outfit_data?.items?.map((i: any) => i.id) || [],
      occasion: data.occasion,
      season: data.outfit_data?.season,
      imageUrl: data.outfit_data?.imageUrl || data.outfit_data?.heroImageUrl,
      source: 'user' as const,
      rating: data.outfit_data?.rating,
      isLiked: data.is_liked,
      weatherInfo: data.weather_info,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };

    return jsonNoStore(outfit, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/outfits/[id] GET] Error:', error);
    return jsonNoStore(
      { error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

