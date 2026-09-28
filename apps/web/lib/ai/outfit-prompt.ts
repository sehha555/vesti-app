import type { Part } from '@google/genai';
import type { WeatherSummary } from '../../../../packages/types/src/weather';
import { describeAttributes, type ItemAttributes } from '../closet/attributes';

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
  /** AI 辨識的屬性；舊資料沒辨識過是 null */
  attributes?: ItemAttributes | null;
  imageBase64: string;
  mimeType: string;
}

/** 模型回傳的原始形狀 */
export interface RawOutfitSuggestion {
  title: string;
  reason: string;
  howToWear?: string;
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
          howToWear: {
            type: 'string',
            description: '具體怎麼穿，繁體中文，25 字以內（例：襯衫前襬紮進褲頭、褲管反摺一次、外套敞開）',
          },
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
        required: ['title', 'reason', 'howToWear', 'slots'],
      },
    },
  },
  required: ['outfits'],
};

/**
 * 穿搭守則（日系簡約）。搭配的 AI 與考卷評審共用這一份，兩邊標準才一致。
 * 改這段 OUTFIT_SYSTEM_PROMPT 的指紋會變，考卷成績單看得出是哪一版守則。
 */
export const STYLE_GUIDE = `風格：日系簡約。乾淨、低調、有質感，像 UNIQLO／MUJI 的型錄，不像運動品牌廣告。

一、配色
- 主色從中性色選：白、米白、黑、灰、炭灰、深藍、米色、卡其、橄欖綠、咖啡、丹寧藍。
- 一套最多 3 個顏色；非中性色（紅、黃、亮藍、紫等）整套最多一件，而且只能是小面積（內搭、配件），不能當上衣或褲子的主色。
- 要有深淺層次：深上淺下、淺上深下，或同色系一深一淺。全身同一個灰或同一個藍會顯得平，要避免。
- 鞋子、皮帶跟上衣或褲子其中一件的顏色呼應。

二、版型與單品（要跟得上現在的流行）
- 現在流行寬褲：下身優先選寬版西裝褲、寬版卡其褲、寬直筒牛仔褲；窄管、緊身褲看起來過時，盡量不選。
- 寬上衣配寬褲可以（city boy 風格），但上衣要紮進去一點、或上衣長度不過臀，讓腰線出來，不要整個人像布袋。
- 合身上衣配寬褲最穩；上下都緊身不要。
- 優先選素面、細條紋、小格紋；大印花、大圖案、大 logo 的單品不要選。
- 運動服（運動褲、帽 T、印字衛衣、跑鞋）只在 sport 場合使用；casual 也盡量不用運動褲。

三、正式度
- 同一套的正式度相差不超過 1 分為佳，最多 2 分。T 恤不配皮鞋、西褲不配跑鞋。
- work：有領上衣（襯衫、Polo）或素面針織＋西褲／卡其褲／深色直筒牛仔褲＋皮鞋或素色乾淨的鞋；不穿運動服、印花、拖鞋。

四、層次（體感 20 度以下）
- 用襯衫、開襟針織、夾克當外層；外套敞開露出內搭，內搭比外套淺或深一階。

好的例子：
- 白色寬版素 T 前襬微紮＋深藍寬直筒牛仔褲＋白色帆布鞋（熱天休閒）：兩個中性色加丹寧，寬褲有流行感、紮一點露出腰線。
- 淺藍牛津襯衫＋米色寬版卡其褲＋咖啡皮鞋＋咖啡皮帶（上班）：鞋與皮帶同色，正式度一致。
- 灰色針織衫＋黑色寬版西裝褲＋黑色皮鞋（涼天約會）：上淺下深，合身上衣配寬褲。

不好的例子：
- 大圖案印花 T＋運動褲＋皮鞋：有印花、正式度衝突。
- 紅色衛衣＋亮藍牛仔褲＋黃色鞋：三個飽和色互搶。
- 全身寬鬆運動服去上班：場合不對、沒有腰線。
- 合身襯衫＋窄管緊身褲＋尖頭皮鞋：版型過時。`;

export const OUTFIT_SYSTEM_PROMPT = `你是一位懂台灣氣候的日系簡約造型師。使用者會給你衣櫃裡每一件衣服的照片、名稱、類別（多數附有保暖度、正式度等 1–5 分的屬性），以及今天的天氣與場合。
請從「衣櫃裡現有的衣服」挑出 2 到 3 套完整搭配，只能使用給你的 itemId，不可以虛構。

${STYLE_GUIDE}

其他原則：
- 溫度優先：體感 28 度以上以透氣單層為主，不要外套；20 到 27 度可加薄外套；20 度以下需要保暖層；下雨避免淺色下身與麂皮鞋。
- 每套至少要有上身（top_inner）與下身（bottom）；衣櫃裡有鞋子就要配鞋子（shoes）；外套（top_outer）與配件（accessory）視天氣與場合選配。同一件衣服在同一套裡只能出現一次。
- 場合：casual 可以輕鬆；work 照上面的正式度原則；date 可以稍微講究；sport 以機能與運動鞋為主。
- 2 到 3 套之間要有明顯差異（例如色調或風格不同），不要只換一件。
- 衣櫃裡沒有完全符合守則的單品時，挑最接近的，並在 reason 直接說缺什麼（例如「衣櫃沒有短袖，先用最薄的長袖捲袖」），不要假裝很完美。
- reason 用繁體中文，一句話講清楚為什麼這樣搭（提到天氣或配色），不要客套。
- howToWear 寫具體穿法：要不要紮、袖子捲不捲、褲管要不要反摺、外套開或扣，讓人看了就知道怎麼穿。
- 衣服資料裡有「版型」「袖長」「衣長」時照著用：寬褲看版型是不是寬鬆；上衣是一般或長版又配寬褲時，穿法要寫紮進去；熱天選短袖。
- 如果有提供「使用者回饋」，要照著調整：絕對不要再用使用者說過「不要」的組合；避開不喜歡的原因、參考喜歡的風格、不要重複最近穿過的整套。`;

export function buildOutfitParts(
  items: ClosetItemForPrompt[],
  weather: WeatherSummary,
  occasion: string,
  feedbackSummary?: string | null
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
      text: `itemId: ${item.id}｜名稱: ${item.name}｜類別: ${item.category}${
        item.attributes ? `｜${describeAttributes(item.attributes)}` : item.color ? `｜顏色: ${item.color}` : ''
      }`,
    });
    parts.push({ inlineData: { data: item.imageBase64, mimeType: item.mimeType } });
  }

  if (feedbackSummary) {
    parts.push({ text: `使用者回饋（最近 30 天）：\n${feedbackSummary}` });
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
  /** 具體穿法；舊資料或模型沒給時沒有 */
  howToWear?: string;
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
      howToWear: outfit.howToWear || undefined,
      imageUrl: layoutSlots[0].item.imageUrl,
      layoutSlots,
    });
  }

  return result;
}
