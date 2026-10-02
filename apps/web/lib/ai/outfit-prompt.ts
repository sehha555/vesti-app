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
          title: { type: 'string', description: '一句話講這套穿起來的感覺，繁體中文，15 字以內，不要用「XX風」這類分類' },
          reason: { type: 'string', description: '穿起來的感覺與為什麼適合今天，繁體中文，一到兩句' },
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
 * 穿搭守則：只寫跟品味無關的搭配技巧（配色、比例、層次、正式度），不指定風格，
 * 使用者不希望風格被釘住。搭配的 AI 與考卷評審共用這一份，兩邊標準才一致。
 * 改這段 OUTFIT_SYSTEM_PROMPT 的指紋會變，考卷成績單看得出是哪一版守則。
 */
export const STYLE_GUIDE = `以下是搭配技巧，不是指定風格。整體感覺依使用者寫的情境和衣櫃裡的衣服決定。

一、配色
- 一套最多 3 個顏色；飽和的顏色（紅、黃、亮藍、紫等）整套最多一件當重點，其他用中性色（白、黑、灰、米、卡其、深藍、咖啡、丹寧）襯。
- 要有深淺層次：深上淺下、淺上深下，或同色系一深一淺。全身同一個灰或同一個藍會顯得平，要避免。
- 鞋子、皮帶跟上衣或褲子其中一件的顏色呼應。

二、比例
- 一套 2 到 4 件衣服就好，配件不要堆疊。
- 上下都寬鬆時，上衣紮進去一點或選不過臀的長度，讓腰線出來，不要整個人像布袋。
- 上下都緊身容易顯得拘束，一寬一窄最穩。

三、正式度
- 同一套的正式度相差不超過 1 分為佳，最多 2 分。T 恤不配皮鞋、西褲不配跑鞋。
- 需要多正式、能不能穿運動服，看使用者寫的情境判斷；沒寫就以日常外出為準。

四、層次（依體感溫度）
- 28 度以上：輕薄為主，不穿外套；想要層次可以在短袖外加敞開的短袖襯衫或薄背心。
- 20 到 27 度：短袖或薄長袖，外面可以敞開穿一件襯衫或薄夾克。
- 12 到 19 度：襯衫或針織當內層，外面加夾克、開襟針織；外套敞開露出內搭，內搭比外套淺或深一階。
- 12 度以下：一定要有外套（大衣、羽絨、西裝外套、厚夾克），裡面襯衫＋毛衣或保暖內搭。只穿襯衫或針織衫出門會冷。

示範技巧的例子（看的是配色和層次怎麼處理，不是要照這個風格穿）：
- 白色素 T 前襬微紮＋深藍直筒牛仔褲＋白色帆布鞋：兩個中性色加丹寧，紮一點露出腰線。
- 白 T＋敞開的藍色格紋襯衫＋黑色牛仔褲：白 T 當內搭，襯衫當薄外層。
- 淺藍襯衫＋米色卡其褲＋咖啡皮鞋＋咖啡皮帶：鞋與皮帶同色，正式度一致。
- 藍色襯衫＋酒紅毛衣＋深藍外套＋深藍長褲：襯衫領口露出毛衣，跳色只有毛衣一件。

不好的例子：
- 紅色衛衣＋亮藍牛仔褲＋黃色鞋：三個飽和色互搶。
- 印字 T＋運動褲＋皮鞋：正式度衝突。
- 上下都很寬又沒有腰線：比例鬆垮。`;

export const OUTFIT_SYSTEM_PROMPT = `你是一位懂台灣氣候的穿搭顧問。使用者會給你衣櫃裡每一件衣服的照片、名稱、類別（多數附有保暖度、正式度等 1–5 分的屬性），以及今天的天氣，有時還有一句他自己寫的今天情境。
請從「衣櫃裡現有的衣服」挑出 2 到 3 套完整搭配，只能使用給你的 itemId，不可以虛構。

${STYLE_GUIDE}

其他原則：
- 溫度優先：體感 28 度以上以透氣輕薄為主，不要外套；20 到 27 度可加薄外套；20 度以下需要保暖層；12 度以下衣櫃裡有外套（類別 outerwear）就每套都要穿一件外套；下雨避免淺色下身與麂皮鞋。
- 每套至少要有上身（top_inner）與下身（bottom）；衣櫃裡有鞋子就要配鞋子（shoes）；外套（top_outer）與配件（accessory）視天氣與情境選配。同一件衣服在同一套裡只能出現一次。
- 情境：使用者有寫今天要做什麼，就照他的描述判斷需要的正式程度、活動量與氛圍；沒寫就只看天氣與衣櫃。
- 不要把穿搭歸類成固定風格或場合標籤（例如上班風、約會風、休閒風）。同一套衣服穿在不同人身上感覺不同，用具體的感覺描述它。
- 2 到 3 套之間要有明顯差異（例如色調或給人的感覺不同），不要只換一件。
- 衣櫃裡沒有完全符合守則的單品時，挑最接近的，並在 reason 直接說缺什麼（例如「衣櫃沒有短袖，先用最薄的長袖捲袖」），不要假裝很完美。
- 標註「最近穿過」的衣服，盡量不要再選；衣櫃太少、不用就湊不出整套時才可以用。
- reason 用繁體中文，一到兩句描述這套穿起來的感覺，以及為什麼適合今天的天氣與使用者寫的情境，不要客套。
- howToWear 寫具體穿法：要不要紮、袖子捲不捲、褲管要不要反摺、外套開或扣，讓人看了就知道怎麼穿。
- 衣服資料裡有「版型」「袖長」「衣長」時照著用：寬褲看版型是不是寬鬆；上衣是一般或長版又配寬褲時，穿法要寫紮進去；熱天選短袖。
- 如果有提供「使用者回饋」，要照著調整：絕對不要再用使用者說過「不要」的組合；避開不喜歡的原因、參考喜歡過的搭配、不要重複最近穿過的整套。`;

export function buildOutfitParts(
  items: ClosetItemForPrompt[],
  weather: WeatherSummary,
  occasion: string,
  {
    feedbackSummary,
    recentlyWornIds = new Set(),
    avoidOutfits = [],
  }: {
    feedbackSummary?: string | null;
    recentlyWornIds?: ReadonlySet<string>;
    /** 「換一批」時剛給過的幾套（每套是 itemId 清單），這次不要再給一樣的 */
    avoidOutfits?: string[][];
  } = {}
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
      text: `itemId: ${item.id}｜名稱: ${item.name}｜類別: ${item.category}${
        item.attributes ? `｜${describeAttributes(item.attributes)}` : item.color ? `｜顏色: ${item.color}` : ''
      }${recentlyWornIds.has(item.id) ? '｜最近穿過' : ''}`,
    });
    parts.push({ inlineData: { data: item.imageBase64, mimeType: item.mimeType } });
  }

  if (feedbackSummary) {
    parts.push({ text: `使用者回饋（最近 30 天）：\n${feedbackSummary}` });
  }

  // 守則寫了冷天要穿外套，模型還是常拿針織衫當外層；在最後指令再講一次，而且只在真的有外套時講
  const needCoat = weather.feelsLike < 12 && items.some((item) => item.category === 'outerwear');
  // 跟外套同理，放在最後指令才會被遵守
  const avoid =
    avoidOutfits.length > 0
      ? `使用者想換一批，下面這幾套剛剛給過，不要再給一樣的組合：\n${avoidOutfits.map((ids, i) => `${i + 1}. ${ids.join('、')}`).join('\n')}\n`
      : '';
  parts.push({
    text: `${avoid}請依照原則挑出 2 到 3 套搭配。${needCoat ? `今天體感 ${weather.feelsLike} 度，每套都要從類別 outerwear 的衣服選一件外套放在 top_outer，針織衫、襯衫不算外套。` : ''}`,
  });
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
