import type { SupabaseClient } from '@supabase/supabase-js';
import type { WeatherSummary } from '../../../../packages/types/src/weather';
import { generateJson } from './gemini';
import {
  buildOutfitParts,
  toOutfitSuggestions,
  OUTFIT_RESPONSE_SCHEMA,
  OUTFIT_SYSTEM_PROMPT,
  type ClosetItemForPrompt,
  type OutfitSuggestion,
  type RawOutfitSuggestion,
} from './outfit-prompt';
import { downloadClosetImage, freshSignedUrls, storagePathFromImageUrl } from '../closet/storage';
import { taipeiDate } from './recommendation-period';
import { loadRecentFeedback, summarizeFeedback } from '../feedback/summary';
import { parseAttributes, type ItemAttributes } from '../closet/attributes';
import { selectCandidates } from '../reco/candidates';

const MIN_ITEMS = 3;
// 一次最多送幾件（幾張圖）給模型
const MAX_ITEMS = 30;
// 從衣櫃撈多少件來挑候選；只撈文字欄位，不下載圖片
const MAX_CLOSET_ROWS = 300;
const RECENT_DAYS = 3;

interface ClosetRow {
  id: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
  attributes: unknown;
}

/** 沒有推薦時的原因，首頁據此顯示提示 */
export type SuggestReason = 'OK' | 'AI_UNAVAILABLE' | 'CLOSET_TOO_SMALL' | 'NO_OUTFIT';

async function askModel(
  items: ClosetItemForPrompt[],
  weather: WeatherSummary,
  occasion: string,
  extras: { feedbackSummary?: string | null; recentlyWornIds?: ReadonlySet<string> }
): Promise<RawOutfitSuggestion[]> {
  const response = await generateJson<{ outfits: RawOutfitSuggestion[] }>(
    OUTFIT_SYSTEM_PROMPT,
    buildOutfitParts(items, weather, occasion, extras),
    OUTFIT_RESPONSE_SCHEMA
  );
  return response.outfits ?? [];
}

/**
 * 搭配的核心：衣物（含圖片）＋天氣＋情境＋回饋 → Gemini → 過濾成合法的搭配。
 * 考卷（evals/outfits）用這一段，考卷量到的就是線上送給模型的 prompt。
 * itemsById 提供每件衣物給前端顯示的名稱與圖片網址。
 */
export async function generateOutfits(params: {
  items: ClosetItemForPrompt[];
  weather: WeatherSummary;
  occasion: string;
  feedbackSummary?: string | null;
  itemsById: Map<string, { name: string; imageUrl: string }>;
}): Promise<{ raw: RawOutfitSuggestion[]; outfits: OutfitSuggestion[] }> {
  const { items, weather, occasion, feedbackSummary, itemsById } = params;
  const raw = await askModel(items, weather, occasion, { feedbackSummary });
  return { raw, outfits: toOutfitSuggestions(raw, itemsById) };
}

/**
 * 從使用者衣櫃撈衣服 → 依天氣挑候選 → 圖片轉 base64 → 連同回饋與最近穿過的一起問 Gemini。
 * 回模型原始結果（只有 item id），可以存起來之後再用 resolveOutfits 組成首頁形狀。
 * 沒有推薦時 raw 是空陣列並附原因（沒設 AI、衣櫃不足 3 件、模型沒給出搭配）。
 */
export async function pickOutfits(params: {
  supabase: SupabaseClient;
  userId: string;
  weather: WeatherSummary;
  occasion: string;
}): Promise<{ raw: RawOutfitSuggestion[]; reason: SuggestReason }> {
  const { supabase, userId, weather, occasion } = params;
  if (!process.env.GEMINI_API_KEY) return { raw: [], reason: 'AI_UNAVAILABLE' };
  const t0 = Date.now();

  const { data, error } = await supabase
    .from('active_closet_items')
    .select('id, name, category, color, image_url, attributes')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(MAX_CLOSET_ROWS);

  if (error) throw new Error(`closet query failed: ${error.message}`);

  const closet = ((data ?? []) as ClosetRow[])
    .filter((r) => r.image_url)
    .map((r) => ({ ...r, attributes: parseAttributes(r.attributes) as ItemAttributes | null }));
  const rows = selectCandidates(closet, weather.feelsLike, occasion, MAX_ITEMS);
  if (rows.length < MIN_ITEMS) return { raw: [], reason: 'CLOSET_TOO_SMALL' };

  // 回饋與最近穿過只需要 userId，跟圖片下載同時開始
  const feedbackRows = loadRecentFeedback(supabase, userId);
  const recentlyWorn = recentlyWornIds(supabase, userId);

  const settled = await Promise.allSettled(
    rows.map(async (row): Promise<ClosetItemForPrompt> => {
      const { buffer, mimeType } = await downloadClosetImage(supabase, storagePathFromImageUrl(row.image_url!));
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        color: row.color,
        attributes: row.attributes,
        imageBase64: buffer.toString('base64'),
        mimeType,
      };
    })
  );
  const items = settled
    .filter((s): s is PromiseFulfilledResult<ClosetItemForPrompt> => s.status === 'fulfilled')
    .map((s) => s.value);
  const firstFailure = settled.find((s) => s.status === 'rejected') as PromiseRejectedResult | undefined;
  if (firstFailure) {
    console.error('[suggest-outfits] image download failed:', (firstFailure.reason as Error).message);
  }
  if (items.length < MIN_ITEMS) return { raw: [], reason: 'NO_OUTFIT' };
  const tImages = Date.now();

  // 核心迴圈：把使用者最近的回饋（要這套 / 不要 / 有沒有穿）一起給模型
  const feedbackSummary = summarizeFeedback(await feedbackRows, new Map(items.map((item) => [item.id, item.name])));
  const raw = await askModel(items, weather, occasion, { feedbackSummary, recentlyWornIds: await recentlyWorn });

  console.info(
    `[suggest-outfits] closet=${closet.length} candidates=${rows.length} sent=${items.length} feedback=${feedbackSummary ? 'yes' : 'no'} raw=${raw.length} images=${tImages - t0}ms model=${Date.now() - tImages}ms`
  );
  return { raw, reason: raw.length > 0 ? 'OK' : 'NO_OUTFIT' };
}

/**
 * 把模型結果（item id）組成首頁要的 outfits：查衣櫃現況、重新簽圖片網址。
 * 之後被刪掉或封存的衣服會被略過，缺上身或下身的整套丟掉。
 */
export async function resolveOutfits(
  supabase: SupabaseClient,
  userId: string,
  raw: RawOutfitSuggestion[]
): Promise<OutfitSuggestion[]> {
  const ids = [...new Set(raw.flatMap((o) => (o.slots ?? []).map((s) => s.itemId)))];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('active_closet_items')
    .select('id, name, image_url')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .in('id', ids);
  if (error) throw new Error(`closet query failed: ${error.message}`);

  const rows = (data ?? []) as Array<{ id: string; name: string; image_url: string | null }>;
  const urls = await freshSignedUrls(supabase, userId, rows);
  const itemsById = new Map<string, { name: string; imageUrl: string }>();
  for (const row of rows) {
    const url = urls.get(row.id);
    if (url) itemsById.set(row.id, { name: row.name, imageUrl: url });
  }
  return toOutfitSuggestions(raw, itemsById);
}

/** 最近幾天（不含今天）選定穿過的單品 id；查不到就當沒有，不擋推薦 */
async function recentlyWornIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const now = Date.now();
  const { data, error } = await supabase
    .from('daily_outfit_plans')
    .select('layout_slots')
    .eq('user_id', userId)
    .gte('date', taipeiDate(new Date(now - RECENT_DAYS * 86_400_000)))
    .lt('date', taipeiDate(new Date(now)));
  if (error) {
    console.error('[suggest-outfits] recent plans query failed:', error.message);
    return new Set();
  }
  const rows = (data ?? []) as Array<{ layout_slots: Array<{ item?: { id?: string } }> | null }>;
  return new Set(rows.flatMap((r) => (r.layout_slots ?? []).map((s) => s.item?.id)).filter((id): id is string => !!id));
}
