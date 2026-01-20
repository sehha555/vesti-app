// apps/web/app/api/outfits/route.ts
// Outfits 資料持久化 - 使用 Supabase saved_outfits 表

import { NextRequest } from 'next/server';
import type { OutfitSeason, OutfitsCreateRequest } from '../../../../../packages/types/src/outfit';
import { OutfitsCreateRequestSchema } from '../../../../../packages/types/src/outfit';
import { getSupabaseAndUser } from '../../../lib/supabase/server';
import { supabaseAdmin } from '../../../lib/supabaseClient';
import { jsonNoStore } from '../../../lib/http/no-store';

const VALID_SEASONS: OutfitSeason[] = ['spring', 'summer', 'fall', 'winter'];

export async function GET(req: NextRequest) {
  try {
    // 認證使用者
    const { user, supabase } = await getSupabaseAndUser();
    if (!user) {
      return jsonNoStore(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 只允許獲取自己的穿搭
    const userId = user.id;
    const tag = req.nextUrl.searchParams.get('tag');
    const season = req.nextUrl.searchParams.get('season');
    const occasion = req.nextUrl.searchParams.get('occasion');

    // 從 Supabase 查詢穿搭
    let query = supabase
      .from('saved_outfits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 套用篩選條件
    if (season && VALID_SEASONS.includes(season as OutfitSeason)) {
      // outfit_data 包含 season，這裡我們先不篩選（因為 outfit_data 是 JSONB）
      // TODO: 如果需要按 season 篩選，應在應用層進行
    }
    if (occasion) {
      query = query.eq('occasion', occasion);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API /api/outfits GET] Supabase error:', error);
      return jsonNoStore(
        { error: '無法取得穿搭列表' },
        { status: 500 }
      );
    }

    // 轉換回應格式
    const outfits = (data || []).map((item) => ({
      id: item.id,
      userId: item.user_id,
      name: item.outfit_data?.styleName || item.outfit_data?.name || '未命名穿搭',
      description: item.outfit_data?.description,
      itemIds: item.outfit_data?.items?.map((i: any) => i.id) || [],
      occasion: item.occasion,
      season: (item.outfit_data?.season || item.outfit_data?.season),
      imageUrl: item.outfit_data?.imageUrl || item.outfit_data?.heroImageUrl,
      source: 'user' as const,
      rating: item.outfit_data?.rating,
      createdAt: new Date(item.created_at),
      updatedAt: item.updated_at ? new Date(item.updated_at) : undefined,
    }));

    return jsonNoStore(outfits, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/outfits GET] Error:', error);
    return jsonNoStore(
      { error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 認證使用者
    const { user } = await getSupabaseAndUser();
    if (!user) {
      return jsonNoStore(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();

    // 驗證請求格式
    const parseResult = OutfitsCreateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const response: { error: string; details?: any } = {
        error: 'Invalid request payload',
      };
      if (process.env.NODE_ENV !== 'production') {
        response.details = parseResult.error.errors;
      }
      return jsonNoStore(response, { status: 400 });
    }

    let { userId, name, itemIds, season, rating } = parseResult.data;

    // 檢查是否遺漏 userId（legacy payload）
    const isMissingUserId = userId === undefined;
    const enableLegacyOutfits = process.env.ENABLE_LEGACY_OUTFITS_PAYLOAD !== "false";

    // 如果遺漏 userId 且環境變數禁用 legacy，返回 400
    if (isMissingUserId && !enableLegacyOutfits) {
      return jsonNoStore(
        { error: '缺少必要欄位 (userId, name, itemIds)' },
        { status: 400 }
      );
    }

    // 如果遺漏 userId，使用認證使用者的 ID
    if (isMissingUserId && enableLegacyOutfits) {
      userId = user.id;
    }

    // 驗證 userId 不為空
    if (!userId) {
      return jsonNoStore(
        { error: '缺少必要欄位 userId' },
        { status: 401 }
      );
    }

    // 驗證所有權：userId 必須符合認證使用者
    if (userId !== user.id) {
      return jsonNoStore(
        { error: 'Forbidden: userId does not match authenticated user' },
        { status: 403 }
      );
    }

    // 驗證 itemIds 至少有一個
    if (!itemIds || itemIds.length === 0) {
      return jsonNoStore(
        { error: 'An outfit must contain at least one item.' },
        { status: 400 }
      );
    }

    // 構建 outfit_data
    const outfitData = {
      name,
      styleName: name, // 相容 saved_outfits 表格式
      itemIds,
      items: itemIds.map((id) => ({ id })), // 簡化的項目列表
      season,
      rating,
      description: body.description || '',
    };

    // 保存到 Supabase
    const { data, error } = await supabaseAdmin
      .from('saved_outfits')
      .insert([
        {
          user_id: userId,
          outfit_data: outfitData,
          occasion: body.occasion || null,
          outfit_type: 'saved',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[API /api/outfits POST] Supabase error:', error);
      return jsonNoStore(
        { error: '無法建立穿搭' },
        { status: 500 }
      );
    }

    // 回傳建立的 outfit
    return jsonNoStore(
      {
        id: data.id,
        userId: data.user_id,
        name,
        itemIds,
        season,
        rating,
        createdAt: new Date(data.created_at),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[API /api/outfits POST] Error:', error);
    return jsonNoStore(
      { error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}
