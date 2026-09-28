import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/services/weather';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit, cacheResponse, getCachedResponse } from '@/lib/rateLimit';
import { suggestOutfits, type SuggestReason } from '../../../lib/ai/suggest-outfits';
import type { OutfitSuggestion } from '../../../lib/ai/outfit-prompt';
import type { WeatherSummary } from '../../../../../packages/types/src/weather';

export const runtime = 'nodejs';

const OCCASIONS = ['casual', 'work', 'date', 'sport'] as const;
const RATE_LIMIT = { keyPrefix: 'daily-outfits', maxRequests: 20, windowMs: 3_600_000 };

interface DailyOutfitsResponse {
  outfits: OutfitSuggestion[];
  weather: WeatherSummary;
  /** outfits 為空時說明原因，首頁據此顯示提示 */
  reason: SuggestReason;
}

/**
 * GET /api/daily-outfits?latitude=&longitude=&occasion=
 * 依天氣從使用者衣櫃用 Gemini 挑 2-3 套。同一人同一天同場合只算一次（快取）。
 * 推薦失敗（沒設 AI、模型出錯、衣櫃不足）不算錯誤：照樣回 200 與天氣，outfits 為空並附 reason。
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const lat = parseFloat(params.get('latitude') ?? '');
  const lon = parseFloat(params.get('longitude') ?? '');
  const occasion = params.get('occasion') ?? 'casual';

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ message: 'Invalid latitude or longitude' }, { status: 400 });
  }
  if (!OCCASIONS.includes(occasion as (typeof OCCASIONS)[number])) {
    return NextResponse.json({ message: 'Invalid occasion' }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const cacheKey = `daily-outfit:${user.id}:${today}:${occasion}`;

  const cached = await getCachedResponse<DailyOutfitsResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const rl = await checkRateLimit(user.id, RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { message: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
    );
  }

  try {
    const weather = await getWeather({ lat, lon });
    let result: Awaited<ReturnType<typeof suggestOutfits>>;
    try {
      result = await suggestOutfits({ supabase, userId: user.id, weather, occasion });
    } catch (error) {
      console.error('[daily-outfits] suggest failed:', (error as Error).message);
      result = { outfits: [], reason: 'AI_UNAVAILABLE' };
    }
    const { outfits, reason } = result;
    const body: DailyOutfitsResponse = { outfits, weather, reason };

    // signed URL 最長 900 秒，快取不能活得比圖久；沒有推薦時不快取，暫時的失敗才不會卡 15 分鐘
    if (outfits.length > 0) {
      await cacheResponse(cacheKey, body, 900);
    }

    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[daily-outfits] failed:', (error as Error).message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
