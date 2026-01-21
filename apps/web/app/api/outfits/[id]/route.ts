// apps/web/app/api/outfits/[id]/route.ts
// 獲取、更新、刪除單個 outfit

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSupabaseAndUser } from '../../../../lib/supabase/server';
import { supabaseAdmin } from '../../../../lib/supabaseClient';
import { jsonNoStore } from '../../../../lib/http/no-store';
import { checkRateLimit } from '../../../../lib/rateLimit';
import { logSecurityEvent } from '../../../../lib/metrics';

// 更新 outfit 的 schema
const UpdateOutfitSchema = z.object({
  name: z.string().trim().min(1, 'name must be non-empty after trim').optional(),
  itemIds: z.array(z.string().uuid()).min(1, 'itemIds must contain at least one UUID').optional(),
  season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  description: z.string().optional(),
  occasion: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認證使用者
    const { user } = await getSupabaseAndUser();
    if (!user) {
      logSecurityEvent({
        endpoint: '/api/outfits/[id]',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: req.headers.get('user-agent') || '',
      });
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

    // 限流檢查 (GET /api/outfits/[id])
    const RATE_LIMIT_CONFIG = {
      windowMs: 60 * 1000, // 60 seconds
      maxRequests: 30,
      keyPrefix: 'outfits-get-id',
    };
    const rateLimitResult = await checkRateLimit(user.id, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      logSecurityEvent({
        endpoint: '/api/outfits/[id]',
        statusCode: 429,
        reason: 'forbidden',
        userAgent: req.headers.get('user-agent') || '',
      });
      return jsonNoStore(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'RateLimit-Limit': String(rateLimitResult.limit),
            'RateLimit-Remaining': String(rateLimitResult.remaining),
            'RateLimit-Reset': String(rateLimitResult.resetAfter),
            'Retry-After': String(rateLimitResult.retryAfter ?? rateLimitResult.resetAfter),
          },
        }
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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認證使用者
    const { user } = await getSupabaseAndUser();
    if (!user) {
      logSecurityEvent({
        endpoint: '/api/outfits/[id]',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: req.headers.get('user-agent') || '',
      });
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

    // 限流檢查 (PUT /api/outfits/[id])
    const RATE_LIMIT_CONFIG = {
      windowMs: 60 * 1000, // 60 seconds
      maxRequests: 30,
      keyPrefix: 'outfits-put',
    };
    const rateLimitResult = await checkRateLimit(user.id, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      logSecurityEvent({
        endpoint: '/api/outfits/[id]',
        statusCode: 429,
        reason: 'forbidden',
        userAgent: req.headers.get('user-agent') || '',
      });
      return jsonNoStore(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'RateLimit-Limit': String(rateLimitResult.limit),
            'RateLimit-Remaining': String(rateLimitResult.remaining),
            'RateLimit-Reset': String(rateLimitResult.resetAfter),
            'Retry-After': String(rateLimitResult.retryAfter ?? rateLimitResult.resetAfter),
          },
        }
      );
    }

    // 解析 request body
    const body = await req.json();

    // 驗證 schema
    const parseResult = UpdateOutfitSchema.safeParse(body);
    if (!parseResult.success) {
      const response: { error: string; details?: any } = {
        error: 'Invalid request payload',
      };
      if (process.env.NODE_ENV !== 'production') {
        response.details = parseResult.error.errors;
      }
      return jsonNoStore(response, { status: 400 });
    }

    // 防止篡改：刪除不允許修改的欄位
    const updates: Record<string, any> = { ...parseResult.data };
    delete updates.id;
    delete updates.userId;

    // 如果提供了 itemIds 或 name，更新 outfit_data
    const outfitDataUpdates: Record<string, any> = {};
    if (updates.name) {
      outfitDataUpdates.styleName = updates.name;
      outfitDataUpdates.name = updates.name;
      delete updates.name;
    }
    if (updates.itemIds) {
      outfitDataUpdates.itemIds = updates.itemIds;
      outfitDataUpdates.items = updates.itemIds.map((id) => ({ id }));
      delete updates.itemIds;
    }
    if (updates.season) {
      outfitDataUpdates.season = updates.season;
      delete updates.season;
    }
    if (updates.rating) {
      outfitDataUpdates.rating = updates.rating;
      delete updates.rating;
    }
    if (updates.description) {
      outfitDataUpdates.description = updates.description;
      delete updates.description;
    }

    // 構建更新對象
    if (Object.keys(outfitDataUpdates).length > 0) {
      updates.outfit_data = {
        '...': 'outfit_data', // Supabase update syntax for merging objects
        ...outfitDataUpdates,
      };
    }

    // 從 Supabase 更新穿搭
    const { data, error } = await supabaseAdmin
      .from('saved_outfits')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id) // 確保使用者所有權
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return jsonNoStore(
          { error: 'Outfit not found' },
          { status: 404 }
        );
      }
      console.error('[API /api/outfits/[id] PUT] Supabase error:', error);
      return jsonNoStore(
        { error: '無法更新穿搭' },
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
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    };

    return jsonNoStore(outfit, { status: 200 });
  } catch (error: any) {
    console.error('[API /api/outfits/[id] PUT] Error:', error);
    return jsonNoStore(
      { error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認證使用者
    const { user } = await getSupabaseAndUser();
    if (!user) {
      logSecurityEvent({
        endpoint: '/api/outfits/[id]',
        statusCode: 401,
        reason: 'auth_required',
        userAgent: req.headers.get('user-agent') || '',
      });
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

    // 限流檢查 (DELETE /api/outfits/[id])
    const RATE_LIMIT_CONFIG = {
      windowMs: 60 * 1000, // 60 seconds
      maxRequests: 30,
      keyPrefix: 'outfits-delete',
    };
    const rateLimitResult = await checkRateLimit(user.id, RATE_LIMIT_CONFIG);
    if (!rateLimitResult.allowed) {
      logSecurityEvent({
        endpoint: '/api/outfits/[id]',
        statusCode: 429,
        reason: 'forbidden',
        userAgent: req.headers.get('user-agent') || '',
      });
      return jsonNoStore(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'RateLimit-Limit': String(rateLimitResult.limit),
            'RateLimit-Remaining': String(rateLimitResult.remaining),
            'RateLimit-Reset': String(rateLimitResult.resetAfter),
            'Retry-After': String(rateLimitResult.retryAfter ?? rateLimitResult.resetAfter),
          },
        }
      );
    }

    // 從 Supabase 刪除穿搭
    const { error, count } = await supabaseAdmin
      .from('saved_outfits')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id); // 確保使用者所有權

    if (error) {
      console.error('[API /api/outfits/[id] DELETE] Supabase error:', error);
      return jsonNoStore(
        { error: '無法刪除穿搭' },
        { status: 500 }
      );
    }

    if (count === 0) {
      return jsonNoStore(
        { error: 'Outfit not found' },
        { status: 404 }
      );
    }

    return jsonNoStore(
      { message: '穿搭已成功刪除' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[API /api/outfits/[id] DELETE] Error:', error);
    return jsonNoStore(
      { error: error.message || '內部伺服器錯誤' },
      { status: 500 }
    );
  }
}

