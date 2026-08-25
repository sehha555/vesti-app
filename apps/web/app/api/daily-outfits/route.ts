import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/services/weather';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit, cacheResponse, getCachedResponse } from '@/lib/rateLimit';
import { suggestOutfits } from '../../../lib/ai/suggest-outfits';
import type { OutfitSuggestion } from '../../../lib/ai/outfit-prompt';
import type { WeatherSummary } from '../../../../../packages/types/src/weather';

export const runtime = 'nodejs';

const OCCASIONS = ['casual', 'work', 'date', 'sport'] as const;
const RATE_LIMIT = { keyPrefix: 'daily-outfits', maxRequests: 20, windowMs: 3_600_000 };

interface DailyOutfitsResponse {
  outfits: OutfitSuggestion[];
  weather: WeatherSummary;
}

/**
 * GET /api/daily-outfits?latitude=&longitude=&occasion=
 * 依天氣從使用者衣櫃用 Gemini 挑 2-3 套。同一人同一天同場合只算一次（快取）。
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
    const outfits = await suggestOutfits({ supabase, userId: user.id, weather, occasion });
    const body: DailyOutfitsResponse = { outfits, weather };

    // signed URL 最長 900 秒，快取不能活得比圖久
    if (outfits.length > 0) {
      await cacheResponse(cacheKey, body, 900);
    }

    return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[daily-outfits] failed:', (error as Error).message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
