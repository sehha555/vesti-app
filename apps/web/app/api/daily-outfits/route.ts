import { NextRequest, NextResponse } from 'next/server';
import { getWeather } from '@/services/weather';
import { getSupabaseAndUser } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { pickOutfits, resolveOutfits, type SuggestReason } from '../../../lib/ai/suggest-outfits';
import { currentPeriodStart } from '../../../lib/ai/recommendation-period';
import type { OutfitSuggestion, RawOutfitSuggestion } from '../../../lib/ai/outfit-prompt';
import type { WeatherSummary } from '../../../../../packages/types/src/weather';
import { cancelQueuedTryonJobs, ensureTryonJobs, type TryonState } from '../../../lib/tryon/jobs';

export const runtime = 'nodejs';

const MAX_OCCASION_LENGTH = 100;
const RATE_LIMIT = { keyPrefix: 'daily-outfits', maxRequests: 20, windowMs: 3_600_000 };

type OutfitWithTryon = OutfitSuggestion & { tryon?: TryonState };

interface DailyOutfitsResponse {
  outfits: OutfitWithTryon[];
  weather: WeatherSummary;
  /** outfits 為空時說明原因，首頁據此顯示提示 */
  reason: SuggestReason;
}

/**
 * GET /api/daily-outfits?latitude=&longitude=&occasion=&refresh=1
 * occasion 是使用者自己寫的一句今天情境（可空），不是固定標籤。
 * 依天氣從使用者衣櫃用 Gemini 挑 2-3 套。同一人同一時段同一句話只算一次，結果存在 daily_recommendations，
 * 之後直接讀表、重新簽圖片網址就回，不用再等模型。
 * 推薦失敗（沒設 AI、模型出錯、衣櫃不足）不算錯誤：照樣回 200 與天氣，outfits 為空並附 reason。
 * refresh=1 是「換一批」：不讀存好的，請模型避開剛給過的幾套重挑，新結果蓋掉存的那份，
 * 並取消舊推薦還在排隊的試穿工作。重挑失敗就不動存的與試穿，回原本那幾套並附原因。
 * 有上傳全身照時，每套順便登記試穿工作（桌機 worker 會來做），並附上 tryon 狀態；做好了就有 imageUrl。
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
  const refresh = params.get('refresh') === '1';

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
    if (stored && !refresh) {
      const outfits = await resolveOutfits(supabase, user.id, stored.outfits as RawOutfitSuggestion[]);
      // 存的衣服全被刪光才重算，否則直接回
      if (outfits.length > 0) {
        return NextResponse.json(
          { outfits: await withTryon(supabase, user.id, outfits), weather, reason: 'OK' } satisfies DailyOutfitsResponse,
          { headers }
        );
      }
    }

    const rl = await checkRateLimit(user.id, RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter ?? rl.resetAfter) } }
      );
    }

    let raw: RawOutfitSuggestion[] = [];
    let outfits: OutfitSuggestion[] = [];
    let reason: SuggestReason;
    try {
      ({ raw, reason } = await pickOutfits({
        supabase,
        userId: user.id,
        weather,
        occasion,
        ...(refresh && stored ? { avoid: stored.outfits as RawOutfitSuggestion[] } : {}),
      }));
      // 模型不一定照「不要再給」做，換一批時程式自己再濾掉剛給過的組合
      if (refresh && stored) raw = withoutRepeats(raw, stored.outfits as RawOutfitSuggestion[]);
      outfits = await resolveOutfits(supabase, user.id, raw);
      if (outfits.length === 0 && reason === 'OK') reason = 'NO_OUTFIT';
    } catch (error) {
      console.error('[daily-outfits] suggest failed:', (error as Error).message);
      reason = 'AI_UNAVAILABLE';
    }

    // 換一批沒換成：回原本那幾套，附上原因讓首頁提示
    if (refresh && stored && outfits.length === 0) {
      const previous = await resolveOutfits(supabase, user.id, stored.outfits as RawOutfitSuggestion[]);
      return NextResponse.json(
        { outfits: await withTryon(supabase, user.id, previous), weather, reason } satisfies DailyOutfitsResponse,
        { headers }
      );
    }

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
      if (refresh) await cancelQueuedTryonJobs(supabase, user.id);
    }

    return NextResponse.json(
      { outfits: await withTryon(supabase, user.id, outfits), weather, reason } satisfies DailyOutfitsResponse,
      { headers }
    );
  } catch (error) {
    console.error('[daily-outfits] failed:', (error as Error).message);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

async function withTryon(
  supabase: Parameters<typeof ensureTryonJobs>[0],
  userId: string,
  outfits: OutfitSuggestion[]
): Promise<OutfitWithTryon[]> {
  if (outfits.length === 0) return outfits;
  const states = await ensureTryonJobs(supabase, userId, outfits);
  return outfits.map((o) => (states.has(o.id) ? { ...o, tryon: states.get(o.id) } : o));
}

/** 同一組衣服（不論順序、部位）算同一套 */
function withoutRepeats(raw: RawOutfitSuggestion[], previous: RawOutfitSuggestion[]): RawOutfitSuggestion[] {
  const key = (o: RawOutfitSuggestion) => [...new Set(o.slots.map((s) => s.itemId))].sort().join(',');
  const seen = new Set(previous.map(key));
  return raw.filter((o) => !seen.has(key(o)));
}
