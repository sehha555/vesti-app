import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/services/weather';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { pickOutfits, resolveOutfits } from '../../../lib/ai/suggest-outfits';
import { currentPeriodStart } from '../../../lib/ai/recommendation-period';
import type { OutfitSuggestion, RawOutfitSuggestion } from '../../../lib/ai/outfit-prompt';
import type { WeatherSummary } from '../../../../../packages/types/src/weather';

export const runtime = 'nodejs';

const MAX_OCCASION_LENGTH = 100;
const RATE_LIMIT = { keyPrefix: 'daily-outfits', maxRequests: 20, windowMs: 3_600_000 };

interface DailyOutfitsResponse {
  outfits: OutfitSuggestion[];
  weather: WeatherSummary;
}

/**
 * GET /api/daily-outfits?latitude=&longitude=&occasion=
 * occasion 是使用者自己寫的一句今天情境（可空），不是固定標籤。
 * 依天氣從使用者衣櫃用 Gemini 挑 2-3 套。同一人同一時段同一句話只算一次，結果存在 daily_recommendations，
 * 之後直接讀表、重新簽圖片網址就回，不用再等模型。
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await getSupabaseAndUser();
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const lat = parseFloat(params.get('latitude') ?? '');
  const lon = parseFloat(params.get('longitude') ?? '');
  const occasion = (params.get('occasion') ?? '').trim();

  if (isNaN(lat) || isNaN(lon)) {
    return NextResponse.json({ message: 'Invalid latitude or longitude' }, { status: 400 });
  }
  if (occasion.length > MAX_OCCASION_LENGTH) {
    return NextResponse.json({ message: 'Invalid occasion' }, { status: 400 });
  }

  const periodStart = currentPeriodStart().toISOString();
  const headers = { 'Cache-Control': 'private, no-store' };

  try {
    // 天氣有自己的 30 分鐘快取，每次都拿最新的給天氣卡
    const weather = await getWeather({ lat, lon });

    const { data: stored } = await supabase
      .from('daily_recommendations')
      .select('outfits')
      .eq('user_id', user.id)
      .eq('period_start', periodStart)
      .eq('occasion', occasion)
      .maybeSingle();
    if (stored) {
      const outfits = await resolveOutfits(supabase, user.id, stored.outfits as RawOutfitSuggestion[]);
      // 存的衣服全被刪光才重算，否則直接回
      if (outfits.length > 0) {
        return NextResponse.json({ outfits, weather } satisfies DailyOutfitsResponse, { headers });
      }
    }

    const rl = await checkRateLimit(user.id, RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
      );
    }

    const raw = await pickOutfits({ supabase, userId: user.id, weather, occasion });
    const outfits = await resolveOutfits(supabase, user.id, raw);

    if (outfits.length > 0) {
      const { error } = await supabase.from('daily_recommendations').upsert({
        user_id: user.id,
        period_start: periodStart,
        occasion,
        outfits: raw,
        weather,
        latitude: lat,
        longitude: lon,
      });
      if (error) console.error('[daily-outfits] save failed:', error.message);
    }

    return NextResponse.json({ outfits, weather } satisfies DailyOutfitsResponse, { headers });
  } catch (error) {
    console.error('[daily-outfits] failed:', (error as Error).message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
