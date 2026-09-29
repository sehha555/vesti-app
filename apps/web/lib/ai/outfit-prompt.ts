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
          title: { type: 'string', description: '一句話講這套穿起來的感覺，繁體中文，15 字以內，不要用「XX風」這類分類' },
          reason: { type: 'string', description: '穿起來的感覺與為什麼適合今天，繁體中文，一到兩句' },
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

export const OUTFIT_SYSTEM_PROMPT = `你是一位懂台灣氣候的穿搭顧問。使用者會給你衣櫃裡每一件衣服的照片、名稱、類別、今天的天氣，有時還有一句他自己寫的今天情境。
請從「衣櫃裡現有的衣服」挑出 2 到 3 套完整搭配，只能使用給你的 itemId，不可以虛構。

搭配原則：
- 溫度優先：體感 28 度以上以透氣單層為主，不要外套；20 到 27 度可加薄外套；20 度以下需要保暖層；下雨避免淺色下身與麂皮鞋。
- 每套至少要有上身（top_inner）與下身（bottom）；衣櫃裡有鞋子就要配鞋子（shoes）；外套（top_outer）與配件（accessory）視天氣與情境選配。同一件衣服在同一套裡只能出現一次。
- 配色：一套最多三個主色；深淺對比或同色系漸層都可以，避免全身同一個飽和色。
- 比例：上寬下窄或上窄下寬擇一，避免上下都寬鬆。
- 情境：使用者有寫今天要做什麼，就照他的描述判斷需要的正式程度、活動量與氛圍；沒寫就只看天氣與衣櫃。
- 不要把穿搭歸類成固定風格或場合標籤（例如上班風、約會風、休閒風）。同一套衣服穿在不同人身上感覺不同，用具體的感覺描述它。
- 2 到 3 套之間要有明顯差異（例如色調或風格不同），不要只換一件。
- 標註「最近穿過」的衣服，盡量不要再選；衣櫃太少、不用就湊不出整套時才可以用。
- reason 用繁體中文，一到兩句描述這套穿起來的感覺，以及為什麼適合今天的天氣與使用者寫的情境，不要客套。`;

export function buildOutfitParts(
  items: ClosetItemForPrompt[],
  weather: WeatherSummary,
  occasion: string,
  recentlyWornIds: ReadonlySet<string> = new Set()
): Part[] {
  const parts: Part[] = [
    {
      text: [
        `今天天氣：${weather.condition}，氣溫 ${weather.temperature} 度，體感 ${weather.feelsLike} 度，濕度 ${weather.humidity}%，風速 ${weather.windSpeed} km/h${weather.locationName ? `（${weather.locationName}）` : ''}。`,
        occasion ? `使用者寫的今天情境：「${occasion}」` : '使用者沒寫今天要做什麼。',
        `衣櫃共 ${items.length} 件，每件先是資料再接一張照片：`,
      ].join('\n'),
    },
  ];

  for (const item of items) {
    parts.push({
      text: `itemId: ${item.id}｜名稱: ${item.name}｜類別: ${item.category}${item.color ? `｜顏色: ${item.color}` : ''}${recentlyWornIds.has(item.id) ? '｜最近穿過' : ''}`,
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
    // 衣櫃常常沒有鞋子（UNIQLO 匯入的都是衣服），鞋子不強制，缺上身或下身才丟掉
    if (!keys.has('top_inner') || !keys.has('bottom')) continue;

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
