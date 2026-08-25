import type { Part } from '@google/genai';
import type { WeatherSummary } from '../../../../packages/types/src/weather';

export const SLOT_KEYS = ['top_inner', 'top_outer', 'bottom', 'shoes', 'accessory'] as const;
export type SlotKey = (typeof SLOT_KEYS)[number];

const SLOT_PRIORITY: Record<SlotKey, number> = {
  top_inner: 1,
  top_outer: 2,
  bottom: 3,
  shoes: 4,
  accessory: 5,
};

export interface ClosetItemForPrompt {
  id: string;
  name: string;
  category: string;
  color: string | null;
  imageBase64: string;
  mimeType: string;
}

/** 模型回傳的原始形狀 */
export interface RawOutfitSuggestion {
  title: string;
  reason: string;
  slots: Array<{ slotKey: string; itemId: string }>;
}

export const OUTFIT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    outfits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '這套搭配的短名稱，繁體中文，10 字以內' },
          reason: { type: 'string', description: '為什麼這樣搭，繁體中文，一句話' },
          slots: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slotKey: { type: 'string', enum: [...SLOT_KEYS] },
                itemId: { type: 'string' },
              },
              required: ['slotKey', 'itemId'],
            },
          },
        },
        required: ['title', 'reason', 'slots'],
      },
    },
  },
  required: ['outfits'],
};

export const OUTFIT_SYSTEM_PROMPT = `你是一位懂台灣氣候的穿搭顧問。使用者會給你衣櫃裡每一件衣服的照片、名稱、類別，以及今天的天氣與場合。
請從「衣櫃裡現有的衣服」挑出 2 到 3 套完整搭配，只能使用給你的 itemId，不可以虛構。

搭配原則：
- 溫度優先：體感 28 度以上以透氣單層為主，不要外套；20 到 27 度可加薄外套；20 度以下需要保暖層；下雨避免淺色下身與麂皮鞋。
- 每套至少要有上身（top_inner）、下身（bottom）、鞋子（shoes）；外套（top_outer）與配件（accessory）視天氣與場合選配。同一件衣服在同一套裡只能出現一次。
- 配色：一套最多三個主色；深淺對比或同色系漸層都可以，避免全身同一個飽和色。
- 比例：上寬下窄或上窄下寬擇一，避免上下都寬鬆。
- 場合：casual 可以輕鬆；work 要整齊、避免破損牛仔與拖鞋；date 可以稍微講究；sport 以機能與運動鞋為主。
- 2 到 3 套之間要有明顯差異（例如色調或風格不同），不要只換一件。
- reason 用繁體中文，一句話講清楚為什麼這樣搭（提到天氣或配色），不要客套。`;

export function buildOutfitParts(
  items: ClosetItemForPrompt[],
  weather: WeatherSummary,
  occasion: string
): Part[] {
  const parts: Part[] = [
    {
      text: [
        `今天天氣：${weather.condition}，氣溫 ${weather.temperature} 度，體感 ${weather.feelsLike} 度，濕度 ${weather.humidity}%，風速 ${weather.windSpeed} km/h${weather.locationName ? `（${weather.locationName}）` : ''}。`,
        `場合：${occasion}。`,
        `衣櫃共 ${items.length} 件，每件先是資料再接一張照片：`,
      ].join('\n'),
    },
  ];

  for (const item of items) {
    parts.push({
      text: `itemId: ${item.id}｜名稱: ${item.name}｜類別: ${item.category}${item.color ? `｜顏色: ${item.color}` : ''}`,
    });
    parts.push({ inlineData: { data: item.imageBase64, mimeType: item.mimeType } });
  }

  parts.push({ text: '請依照原則挑出 2 到 3 套搭配。' });
  return parts;
}

export interface LayoutSlot {
  slotKey: SlotKey;
  item: { id: string; name: string; imageUrl: string };
  priority: number;
}

export interface OutfitSuggestion {
  id: number;
  styleName: string;
  description: string;
  imageUrl: string;
  layoutSlots: LayoutSlot[];
}

/**
 * 把模型回傳轉成首頁要的形狀，順便過濾掉不存在的 itemId、非法 slotKey、缺少基本三件的套裝。
 */
export function toOutfitSuggestions(
  raw: RawOutfitSuggestion[],
  itemsById: Map<string, { name: string; imageUrl: string }>
): OutfitSuggestion[] {
  const result: OutfitSuggestion[] = [];

  for (const outfit of raw) {
    const seen = new Set<string>();
    const layoutSlots: LayoutSlot[] = [];

    for (const slot of outfit.slots ?? []) {
      if (!SLOT_KEYS.includes(slot.slotKey as SlotKey)) continue;
      const item = itemsById.get(slot.itemId);
      if (!item || seen.has(slot.itemId)) continue;
      seen.add(slot.itemId);
      const slotKey = slot.slotKey as SlotKey;
      layoutSlots.push({
        slotKey,
        item: { id: slot.itemId, name: item.name, imageUrl: item.imageUrl },
        priority: SLOT_PRIORITY[slotKey],
      });
    }

    const keys = new Set(layoutSlots.map((s) => s.slotKey));
    if (!keys.has('top_inner') || !keys.has('bottom') || !keys.has('shoes')) continue;

    layoutSlots.sort((a, b) => a.priority - b.priority);
    result.push({
      id: result.length + 1,
      styleName: outfit.title || '今日推薦',
      description: outfit.reason || '',
      imageUrl: layoutSlots[0].item.imageUrl,
      layoutSlots,
    });
  }

  return result;
}
