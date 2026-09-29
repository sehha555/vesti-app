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

const MIN_ITEMS = 3;
const MAX_ITEMS = 30;
const RECENT_DAYS = 3;

interface ClosetRow {
  id: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
}

/**
 * 從使用者衣櫃撈衣服 → 圖片轉 base64 → Gemini 挑搭配。回模型原始結果（只有 item id），
 * 可以存起來之後再用 resolveOutfits 組成首頁形狀。衣櫃不足 3 件回空陣列。
 */
export async function pickOutfits(params: {
  supabase: SupabaseClient;
  userId: string;
  weather: WeatherSummary;
  occasion: string;
}): Promise<RawOutfitSuggestion[]> {
  const { supabase, userId, weather, occasion } = params;
  const t0 = Date.now();

  const { data, error } = await supabase
    .from('active_closet_items')
    .select('id, name, category, color, image_url')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(MAX_ITEMS);

  if (error) throw new Error(`closet query failed: ${error.message}`);

  const rows = ((data ?? []) as ClosetRow[]).filter((r) => r.image_url);
  if (rows.length < MIN_ITEMS) return [];

  const settled = await Promise.allSettled(
    rows.map(async (row): Promise<ClosetItemForPrompt> => {
      const { buffer, mimeType } = await downloadClosetImage(supabase, storagePathFromImageUrl(row.image_url!));
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        color: row.color,
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
  const tImages = Date.now();
  const imageBytes = items.reduce((sum, i) => sum + i.imageBase64.length * 0.75, 0);

  const raw = await generateJson<{ outfits: RawOutfitSuggestion[] }>(
    OUTFIT_SYSTEM_PROMPT,
    buildOutfitParts(items, weather, occasion, await recentlyWornIds(supabase, userId)),
    OUTFIT_RESPONSE_SCHEMA
  );

  console.info(
    `[suggest-outfits] closet=${rows.length} sent=${items.length} raw=${raw.outfits?.length ?? 0} images=${tImages - t0}ms/${Math.round(imageBytes / 1024)}KB model=${Date.now() - tImages}ms`
  );
  return raw.outfits ?? [];
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
