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
import { loadRecentFeedback, summarizeFeedback } from '../feedback/summary';
import { parseAttributes, type ItemAttributes } from '../closet/attributes';
import { selectCandidates } from '../reco/candidates';

const MIN_ITEMS = 3;
// 一次最多送幾件（幾張圖）給模型
const MAX_ITEMS = 30;
// 從衣櫃撈多少件來挑候選；只撈文字欄位，不下載圖片
const MAX_CLOSET_ROWS = 300;

interface ClosetRow {
  id: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
  attributes: unknown;
}

/**
 * 從使用者衣櫃撈衣服 → 依天氣與類別挑候選 → 圖片轉 base64 → Gemini → 組成首頁要的 outfits。
 * 衣櫃不足 3 件回空陣列，讓首頁走既有 fallback。
 */
export async function suggestOutfits(params: {
  supabase: SupabaseClient;
  userId: string;
  weather: WeatherSummary;
  occasion: string;
}): Promise<OutfitSuggestion[]> {
  const { supabase, userId, weather, occasion } = params;

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
  const rows = selectCandidates(closet, weather.feelsLike, MAX_ITEMS);
  if (rows.length < MIN_ITEMS) return [];

  // 回饋只需要 userId，跟圖片下載同時開始
  const feedbackRows = loadRecentFeedback(supabase, userId);

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
  if (items.length < MIN_ITEMS) return [];

  // 核心迴圈：把使用者最近的回饋（要這套 / 不要 / 有沒有穿）一起給模型
  const feedbackSummary = summarizeFeedback(
    await feedbackRows,
    new Map(items.map((item) => [item.id, item.name]))
  );

  const raw = await generateJson<{ outfits: RawOutfitSuggestion[] }>(
    OUTFIT_SYSTEM_PROMPT,
    buildOutfitParts(items, weather, occasion, feedbackSummary),
    OUTFIT_RESPONSE_SCHEMA
  );

  const urls = await freshSignedUrls(supabase, userId, rows);
  const itemsById = new Map<string, { name: string; imageUrl: string }>();
  for (const row of rows) {
    const url = urls.get(row.id);
    if (url) itemsById.set(row.id, { name: row.name, imageUrl: url });
  }

  const outfits = toOutfitSuggestions(raw.outfits ?? [], itemsById);
  console.info(
    `[suggest-outfits] closet=${closet.length} candidates=${rows.length} sent=${items.length} feedback=${feedbackSummary ? 'yes' : 'no'} raw=${raw.outfits?.length ?? 0} final=${outfits.length}`
  );
  return outfits;
}
