// apps/web/app/api/reco/daily/route.ts
// POST /api/reco/daily - Daily outfit recommendations based on weather + occasion + wardrobe
// Security: BFF dual auth required (user session + internal API key)

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireBffAuth } from '../../_middleware/auth';
import {
  DailyOutfitRequestSchema,
  MAX_BODY_SIZE,
  type DailyOutfitRequest,
  type GeneratedOutfit,
  type SuggestedPurchase,
  type WeatherInfo,
  type OutfitReasons,
} from '../../../../lib/validation/dailyOutfit';
import { geocodeLocation, DEFAULT_LOCATION } from '@/services/weather/geocoding.service';
import { getWeather } from '@/services/weather';
import type { WardrobeItem } from '../../../../../../packages/types/src/wardrobe';

interface ErrorResponse {
  error: string;
  code?: string;
  details?: string[];
}

interface DailyOutfitResponse {
  ok: boolean;
  date: string;
  weather: WeatherInfo;
  outfits: GeneratedOutfit[];
  suggestedPurchases?: SuggestedPurchase[];
  message?: string;
}

// Occasion mapping (Chinese to English)
const OCCASION_MAP: Record<string, string> = {
  '上班': 'work',
  '約會': 'date',
  '休閒': 'casual',
  '運動': 'sports',
  '正式場合': 'formal',
  '派對': 'party',
  '旅行': 'travel',
  '居家': 'home',
};

/**
 * Determines if weather is suitable for certain clothing types
 */
function getWeatherSuitability(temp: number, condition: string): {
  needsOuterwear: boolean;
  preferLight: boolean;
  rainProtection: boolean;
} {
  return {
    needsOuterwear: temp < 20,
    preferLight: temp > 25,
    rainProtection: condition === 'rainy' || condition === 'drizzle',
  };
}

/**
 * Filters wardrobe items based on weather conditions
 */
function filterByWeather(items: WardrobeItem[], weather: WeatherInfo): WardrobeItem[] {
  const temp = weather.temperature;
  const condition = weather.condition;

  return items.filter(item => {
    const season = item.season;

    // Summer items for hot weather
    if (temp > 25 && (season === 'summer' || season === 'all-season')) {
      return true;
    }

    // Winter items for cold weather
    if (temp < 15 && (season === 'winter' || season === 'autumn' || season === 'all-season')) {
      return true;
    }

    // Spring/Autumn items for moderate weather
    if (temp >= 15 && temp <= 25 && (season === 'spring' || season === 'autumn' || season === 'all-season')) {
      return true;
    }

    // All-season items always pass
    return season === 'all-season';
  });
}

/**
 * Filters wardrobe items based on occasion
 */
function filterByOccasion(items: WardrobeItem[], occasion: string): WardrobeItem[] {
  const normalizedOccasion = OCCASION_MAP[occasion] || occasion.toLowerCase();

  return items.filter(item => {
    // Check if item has matching occasions
    if (item.occasions && item.occasions.length > 0) {
      return item.occasions.some(o => o.toLowerCase() === normalizedOccasion);
    }

    // Fallback: check style compatibility
    if (normalizedOccasion === 'work' || normalizedOccasion === 'formal') {
      return item.style === 'formal' || item.style === 'minimalist';
    }

    if (normalizedOccasion === 'casual' || normalizedOccasion === 'travel') {
      return item.style === 'casual' || item.style === 'sporty';
    }

    if (normalizedOccasion === 'sports') {
      return item.style === 'sporty';
    }

    if (normalizedOccasion === 'party' || normalizedOccasion === 'date') {
      return item.style === 'boho' || item.style === 'vintage' || item.style === 'casual';
    }

    return true; // Allow all for home/other occasions
  });
}

/**
 * Groups wardrobe items by type
 */
function groupByType(items: WardrobeItem[]): Record<string, WardrobeItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);
}

/**
 * Generates outfit combinations from grouped items
 */
function generateOutfits(
  grouped: Record<string, WardrobeItem[]>,
  count: number,
  weather: WeatherInfo,
  occasion: string
): { outfits: GeneratedOutfit[]; missingTypes: string[] } {
  const tops = grouped['top'] || [];
  const bottoms = grouped['bottom'] || [];
  const shoes = grouped['shoes'] || [];
  const outerwear = grouped['outerwear'] || [];

  const missingTypes: string[] = [];
  if (tops.length === 0) missingTypes.push('top');
  if (bottoms.length === 0) missingTypes.push('bottom');
  if (shoes.length === 0) missingTypes.push('shoes');

  const suitability = getWeatherSuitability(weather.temperature, weather.condition);
  if (suitability.needsOuterwear && outerwear.length === 0) {
    missingTypes.push('outerwear');
  }

  // If missing essential items, return empty
  if (tops.length === 0 || bottoms.length === 0) {
    return { outfits: [], missingTypes };
  }

  const outfits: GeneratedOutfit[] = [];
  const usedCombinations = new Set<string>();

  for (let i = 0; i < Math.min(count * 3, tops.length * bottoms.length); i++) {
    const topIndex = i % tops.length;
    const bottomIndex = Math.floor(i / tops.length) % bottoms.length;
    const shoeIndex = i % (shoes.length || 1);
    const outerwearIndex = i % (outerwear.length || 1);

    const top = tops[topIndex];
    const bottom = bottoms[bottomIndex];
    const shoe = shoes[shoeIndex] || null;
    const outer = suitability.needsOuterwear ? (outerwear[outerwearIndex] || null) : null;

    const combinationKey = `${top.id}-${bottom.id}-${shoe?.id || 'none'}-${outer?.id || 'none'}`;
    if (usedCombinations.has(combinationKey)) continue;
    usedCombinations.add(combinationKey);

    // Calculate score and reasons
    const weatherMatched = weather.temperature < 15 ? (outer !== null) : true;
    const normalizedOccasion = OCCASION_MAP[occasion] || occasion.toLowerCase();
    const occasionMatched = top.style === 'formal' && (normalizedOccasion === 'work' || normalizedOccasion === 'formal');

    const reasons: OutfitReasons = {
      weatherMatched,
      occasionMatched: occasionMatched || [top, bottom, shoe, outer].filter(Boolean).some(item =>
        item?.occasions?.some(o => o.toLowerCase() === normalizedOccasion)
      ),
      colorHarmony: calculateColorHarmony(top, bottom, shoe, outer),
      styleConsistency: calculateStyleConsistency(top, bottom, shoe, outer),
    };

    const score = calculateOutfitScore(reasons);

    outfits.push({
      id: `outfit-${Date.now()}-${outfits.length}`,
      items: {
        top: { id: top.id, name: top.name, imageUrl: top.imageUrl, type: 'top' },
        bottom: { id: bottom.id, name: bottom.name, imageUrl: bottom.imageUrl, type: 'bottom' },
        shoes: shoe ? { id: shoe.id, name: shoe.name, imageUrl: shoe.imageUrl, type: 'shoes' } : undefined,
        outerwear: outer ? { id: outer.id, name: outer.name, imageUrl: outer.imageUrl, type: 'outerwear' } : undefined,
      },
      score,
      reasons,
    });

    if (outfits.length >= count) break;
  }

  // Sort by score descending
  outfits.sort((a, b) => b.score - a.score);

  return { outfits: outfits.slice(0, count), missingTypes };
}

/**
 * Calculate color harmony score (0-1)
 */
function calculateColorHarmony(...items: (WardrobeItem | null | undefined)[]): number {
  const validItems = items.filter(Boolean) as WardrobeItem[];
  if (validItems.length < 2) return 0.5;

  const allColors = validItems.flatMap(item => item.colors || []);
  const uniqueColors = [...new Set(allColors)];

  // Fewer unique colors = better harmony
  if (uniqueColors.length <= 3) return 1;
  if (uniqueColors.length <= 5) return 0.7;
  return 0.4;
}

/**
 * Calculate style consistency score (0-1)
 */
function calculateStyleConsistency(...items: (WardrobeItem | null | undefined)[]): number {
  const validItems = items.filter(Boolean) as WardrobeItem[];
  if (validItems.length < 2) return 0.5;

  const styles = validItems.map(item => item.style).filter(Boolean);
  const uniqueStyles = [...new Set(styles)];

  if (uniqueStyles.length === 1) return 1; // All same style
  if (uniqueStyles.length === 2) return 0.7; // Two styles
  return 0.4;
}

/**
 * Calculate overall outfit score
 */
function calculateOutfitScore(reasons: OutfitReasons): number {
  let score = 0;

  if (reasons.weatherMatched) score += 0.3;
  if (reasons.occasionMatched) score += 0.25;
  score += (reasons.colorHarmony || 0) * 0.25;
  score += (reasons.styleConsistency || 0) * 0.2;

  return Math.round(score * 100) / 100;
}

/**
 * Generate suggested purchases for missing items
 */
function generateSuggestedPurchases(missingTypes: string[], occasion: string): SuggestedPurchase[] {
  // Placeholder - In production, this would query a product catalog
  return missingTypes.map(type => ({
    id: `suggestion-${type}-${Date.now()}`,
    name: `推薦${type === 'top' ? '上衣' : type === 'bottom' ? '下裝' : type === 'shoes' ? '鞋子' : '外套'}`,
    type,
    imageUrl: 'https://via.placeholder.com/150',
    reason: `您的衣櫃缺少適合${occasion}場合的${type === 'top' ? '上衣' : type === 'bottom' ? '下裝' : type === 'shoes' ? '鞋子' : '外套'}`,
  }));
}

/**
 * POST /api/reco/daily
 * Generates daily outfit recommendations based on weather, occasion, and user wardrobe.
 *
 * Security: Requires BFF dual-layer authentication
 * - Valid user session (Supabase auth)
 * - Valid internal API key (X-API-Key header)
 */
export async function POST(req: NextRequest): Promise<NextResponse<DailyOutfitResponse | ErrorResponse>> {
  try {
    // 1. BFF dual-layer authentication
    const authResult = await requireBffAuth(req);
    if (!authResult.authorized) {
      return authResult.error! as NextResponse<ErrorResponse>;
    }

    const userId = authResult.userId!;

    // 2. Check Content-Length
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' },
        { status: 413 }
      );
    }

    // 3. Parse and validate request body
    let body: unknown;
    try {
      const text = await req.text();
      if (text.length > MAX_BODY_SIZE) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Request body too large', code: 'PAYLOAD_TOO_LARGE' },
          { status: 413 }
        );
      }
      body = JSON.parse(text);
    } catch {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid JSON body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // 4. Validate with Zod schema
    const parseResult = DailyOutfitRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const issues = parseResult.error.issues || [];
      const errorMessages = issues.map(
        (e: { path: (string | number | symbol)[]; message: string; code?: string }) =>
          `${e.path.map(String).join('.')}: ${e.message}`
      );
      return NextResponse.json<ErrorResponse>(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: errorMessages },
        { status: 400 }
      );
    }

    const { date, location, occasion, bodyType, outfitCount } = parseResult.data;

    // 5. Geocode location to coordinates
    const coords = await geocodeLocation(location) || DEFAULT_LOCATION;

    // 6. Get weather for location
    const weatherSummary = await getWeather(coords);
    const weatherInfo: WeatherInfo = {
      temperature: weatherSummary.temperature,
      feelsLike: weatherSummary.feelsLike,
      condition: weatherSummary.condition,
      humidity: weatherSummary.humidity,
      locationName: weatherSummary.locationName,
    };

    // 7. Fetch user wardrobe from Supabase
    // Note: Using supabaseAdmin for server-side operations
    const { supabaseAdmin } = await import('@/lib/supabaseClient');
    const { data: wardrobeData, error: wardrobeError } = await supabaseAdmin
      .from('user_wardrobe')
      .select('*')
      .eq('user_id', userId);

    if (wardrobeError) {
      console.error('[API] Wardrobe fetch error:', wardrobeError.message);
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to fetch wardrobe', code: 'WARDROBE_ERROR' },
        { status: 500 }
      );
    }

    const wardrobeItems: WardrobeItem[] = wardrobeData || [];

    // 8. Filter wardrobe by weather and occasion
    const weatherFiltered = filterByWeather(wardrobeItems, weatherInfo);
    const occasionFiltered = filterByOccasion(weatherFiltered, occasion);

    // 9. Group items by type
    const grouped = groupByType(occasionFiltered.length > 0 ? occasionFiltered : weatherFiltered);

    // 10. Generate outfit combinations
    const { outfits, missingTypes } = generateOutfits(grouped, outfitCount, weatherInfo, occasion);

    // 11. Generate suggested purchases if needed
    const suggestedPurchases = missingTypes.length > 0
      ? generateSuggestedPurchases(missingTypes, occasion)
      : undefined;

    // 12. Build response
    const response: DailyOutfitResponse = {
      ok: true,
      date,
      weather: weatherInfo,
      outfits,
      suggestedPurchases,
      message: outfits.length === 0
        ? '衣櫃庫存不足，請參考推薦補貨建議'
        : undefined,
    };

    console.log(`[API] Generated ${outfits.length} outfits for ${location} on ${date}`);

    return NextResponse.json<DailyOutfitResponse>(response, { status: 200 });
  } catch (error) {
    console.error('[API] POST /api/reco/daily error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// GET method not allowed
export async function GET(): Promise<NextResponse<ErrorResponse>> {
  return NextResponse.json<ErrorResponse>(
    { error: 'Method not allowed. Use POST.', code: 'METHOD_NOT_ALLOWED' },
    { status: 405 }
  );
}
