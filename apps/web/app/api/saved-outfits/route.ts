import { NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { jsonNoStore } from '@/lib/http/no-store';
import { checkRateLimit, type RateLimitConfig } from '@/lib/rateLimit';
import { logSecurityEvent } from '@/lib/metrics';
import { freshSignedUrls } from '../../../lib/closet/storage';
import { outfitKeyFromSlots } from '../../../lib/outfits/key';

/**
 * 首頁收藏的穿搭。
 *
 * outfit_data 存的是卡片當下的樣子（styleName、description、layoutSlots），
 * 另外存 key（組成單品 id 排序串起來）用來去重、讓前端辨認哪張卡已收藏。
 */

const LayoutSlotSchema = z.object({
  slotKey: z.string().min(1).max(50),
  item: z.object({
    id: z.string().max(100).optional(),
    name: z.string().max(200).optional(),
    imageUrl: z.string().max(2000).optional(),
  }),
  priority: z.number().int(),
});

const SaveOutfitSchema = z.object({
  outfitData: z.object({
    imageUrl: z.string().min(1).max(2000),
    styleName: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    layoutSlots: z.array(LayoutSlotSchema).max(10).optional(),
  }),
  weather: z.record(z.string(), z.unknown()).optional(),
  occasion: z.string().max(50).optional(),
  outfitType: z.enum(['saved', 'confirmed']).optional(),
});

type OutfitData = z.infer<typeof SaveOutfitSchema>['outfitData'] & { key?: string | null };

interface SavedOutfitRow {
  id: string;
  outfit_data: OutfitData;
  [key: string]: unknown;
}

const POST_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 20, keyPrefix: 'saved-outfits-post' };
const GET_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 30, keyPrefix: 'saved-outfits-get' };
const DELETE_LIMIT: RateLimitConfig = { windowMs: 60_000, maxRequests: 30, keyPrefix: 'saved-outfits-delete' };

/** 驗證登入並限流；通過回 userId 與使用者自己的 supabase client，否則回錯誤 response */
async function authorize(request: NextRequest, limit: RateLimitConfig) {
  const { supabase, user } = await getSupabaseAndUser();
  const userAgent = request.headers.get('user-agent') || '';
  if (!user) {
    logSecurityEvent({ endpoint: '/api/saved-outfits', statusCode: 401, reason: 'auth_required', userAgent });
    return { error: jsonNoStore({ success: false, error: 'Unauthorized' }, { status: 401 }) };
  }

  const rl = await checkRateLimit(user.id, limit);
  if (!rl.allowed) {
    logSecurityEvent({ endpoint: '/api/saved-outfits', statusCode: 429, reason: 'forbidden', userAgent });
    return {
      error: jsonNoStore(
        { success: false, error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'RateLimit-Limit': String(rl.limit),
            'RateLimit-Remaining': String(rl.remaining),
            'RateLimit-Reset': String(rl.resetAfter),
            'Retry-After': String(rl.retryAfter ?? rl.resetAfter),
          },
        }
      ),
    };
  }

  return { supabase, userId: user.id };
}

/**
 * POST /api/saved-outfits
 * Body: { outfitData: { imageUrl, styleName, description?, layoutSlots? }, weather?, occasion?, outfitType? }
 *
 * - 201: { success: true, savedOutfit }
 * - 200: { success: true, savedOutfit, message: 'Outfit already saved' }（同一套已收藏過）
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authorize(request, POST_LIMIT);
    if (auth.error) return auth.error;
    const { userId } = auth;

    let body: z.infer<typeof SaveOutfitSchema>;
    try {
      body = SaveOutfitSchema.parse(await request.json());
    } catch {
      return jsonNoStore({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const outfitType = body.outfitType ?? 'saved';
    const key = outfitKeyFromSlots(body.outfitData.layoutSlots);

    // 同樣幾件衣服組成的就是同一套，不重複存
    if (key) {
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('saved_outfits')
        .select('*')
        .eq('user_id', userId)
        .eq('outfit_type', outfitType)
        .contains('outfit_data', { key })
        .limit(1);

      if (checkError) {
        console.error('[API /saved-outfits] duplicate check failed:', checkError.message);
      } else if (existing && existing.length > 0) {
        return jsonNoStore(
          { success: true, savedOutfit: existing[0], message: 'Outfit already saved' },
          { status: 200 }
        );
      }
    }

    const outfitData: OutfitData = { ...body.outfitData, key };
    const { data, error } = await supabaseAdmin
      .from('saved_outfits')
      .insert([
        {
          user_id: userId,
          outfit_data: outfitData,
          weather_info: body.weather ?? null,
          occasion: body.occasion ?? 'casual',
          outfit_type: outfitType,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[API /saved-outfits] insert failed:', error.message);
      return jsonNoStore({ success: false, error: 'Failed to save outfit' }, { status: 500 });
    }

    return jsonNoStore({ success: true, savedOutfit: data }, { status: 201 });
  } catch (error) {
    console.error('[API /saved-outfits POST] unexpected:', (error as Error).message);
    return jsonNoStore({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/saved-outfits?outfitType=saved&occasion=&limit=20
 * 回傳前把單品圖片換成新的簽章網址（存進去的簽章 5 分鐘就過期）。
 *
 * - 200: { success: true, outfits: [...], count }
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authorize(request, GET_LIMIT);
    if (auth.error) return auth.error;
    const { supabase, userId } = auth;

    const searchParams = request.nextUrl.searchParams;
    const outfitType = searchParams.get('outfitType') || 'saved';
    const occasion = searchParams.get('occasion');
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10) || 20, 1), 100);

    let query = supabaseAdmin
      .from('saved_outfits')
      .select('*')
      .eq('user_id', userId)
      .eq('outfit_type', outfitType)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (occasion) {
      query = query.eq('occasion', occasion);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[API /saved-outfits] select failed:', error.message);
      return jsonNoStore({ success: false, error: 'Failed to fetch saved outfits' }, { status: 500 });
    }

    const outfits = await withFreshImages(supabase, userId, (data ?? []) as SavedOutfitRow[]);
    return jsonNoStore({ success: true, outfits, count: outfits.length }, { status: 200 });
  } catch (error) {
    console.error('[API /saved-outfits GET] unexpected:', (error as Error).message);
    return jsonNoStore({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/saved-outfits?id=<uuid>
 * - 200: { success: true }
 * - 404: 不存在或不是自己的
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authorize(request, DELETE_LIMIT);
    if (auth.error) return auth.error;
    const { userId } = auth;

    const id = z.string().uuid().safeParse(request.nextUrl.searchParams.get('id'));
    if (!id.success) {
      return jsonNoStore({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('saved_outfits')
      .delete()
      .eq('id', id.data)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      console.error('[API /saved-outfits] delete failed:', error.message);
      return jsonNoStore({ success: false, error: 'Failed to delete outfit' }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return jsonNoStore({ success: false, error: 'Not found' }, { status: 404 });
    }

    return jsonNoStore({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[API /saved-outfits DELETE] unexpected:', (error as Error).message);
    return jsonNoStore({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 用單品的 closet item id 查出 Storage 路徑，重新簽章後換掉 layoutSlots 與封面的圖片網址。
 * 衣物已被刪掉或簽不出來就沿用原本的網址。
 */
async function withFreshImages(
  supabase: Parameters<typeof freshSignedUrls>[0],
  userId: string,
  rows: SavedOutfitRow[]
): Promise<SavedOutfitRow[]> {
  const itemIds = new Set<string>();
  for (const row of rows) {
    for (const slot of row.outfit_data?.layoutSlots ?? []) {
      if (slot.item?.id) itemIds.add(slot.item.id);
    }
  }
  if (itemIds.size === 0) return rows;

  const { data: closetRows, error } = await supabase
    .from('closet_items')
    .select('id, image_url')
    .eq('user_id', userId)
    .in('id', [...itemIds]);
  if (error || !closetRows) return rows;

  const urls = await freshSignedUrls(supabase, userId, closetRows);
  if (urls.size === 0) return rows;

  return rows.map((row) => {
    const slots = row.outfit_data?.layoutSlots;
    if (!slots || slots.length === 0) return row;
    const freshSlots = slots.map((slot) => {
      const url = slot.item?.id ? urls.get(slot.item.id) : undefined;
      return url ? { ...slot, item: { ...slot.item, imageUrl: url } } : slot;
    });
    const cover = freshSlots[0]?.item?.imageUrl ?? row.outfit_data.imageUrl;
    return { ...row, outfit_data: { ...row.outfit_data, layoutSlots: freshSlots, imageUrl: cover } };
  });
}
