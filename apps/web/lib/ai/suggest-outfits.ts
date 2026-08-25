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

const MIN_ITEMS = 3;
const MAX_ITEMS = 30;

interface ClosetRow {
  id: string;
  name: string;
  category: string;
  color: string | null;
  image_url: string | null;
}

/**
 * 從使用者衣櫃撈衣服 → 圖片轉 base64 → Gemini → 組成首頁要的 outfits。
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
  if (items.length < MIN_ITEMS) return [];

  const raw = await generateJson<{ outfits: RawOutfitSuggestion[] }>(
    OUTFIT_SYSTEM_PROMPT,
    buildOutfitParts(items, weather, occasion),
    OUTFIT_RESPONSE_SCHEMA
  );

  const urls = await freshSignedUrls(supabase, userId, rows);
  const itemsById = new Map<string, { name: string; imageUrl: string }>();
  for (const row of rows) {
    const url = urls.get(row.id);
    if (url) itemsById.set(row.id, { name: row.name, imageUrl: url });
  }

  return toOutfitSuggestions(raw.outfits ?? [], itemsById);
}
