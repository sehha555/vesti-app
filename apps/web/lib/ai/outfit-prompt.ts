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
 * 穿搭守則（日系簡約）。搭配的 AI 與考卷評審共用這一份，兩邊標準才一致。
 * 改這段 OUTFIT_SYSTEM_PROMPT 的指紋會變，考卷成績單看得出是哪一版守則。
 */
export const STYLE_GUIDE = `風格：日系簡約。乾淨、低調、有質感，像 UNIQLO／MUJI 的型錄，不像運動品牌廣告。

一、配色
- 主色從中性色選：白、米白、黑、灰、炭灰、深藍、米色、卡其、橄欖綠、咖啡、丹寧藍。
- 一套最多 3 個顏色；非中性色（紅、黃、亮藍、紫等）整套最多一件，而且只能是小面積（內搭、配件），不能當上衣或褲子的主色。
- 要有深淺層次：深上淺下、淺上深下，或同色系一深一淺。全身同一個灰或同一個藍會顯得平，要避免。
- 鞋子、皮帶跟上衣或褲子其中一件的顏色呼應。
- 白 T 是萬用基底：單穿，或當內搭露出領口、下襬，外面疊襯衫、背心、夾克。

二、版型與單品（要跟得上現在的流行）
- 現在流行寬褲：下身優先選寬版西裝褲、打褶寬褲、弧形褲（褲管有弧度的寬褲）、寬版卡其褲、寬直筒牛仔褲；窄管、緊身褲看起來過時，盡量不選。
- 一套 2 到 4 件衣服就好，配件頂多皮帶或墨鏡，不要堆疊。
- 寬上衣配寬褲可以（city boy 風格），但上衣要紮進去一點、或上衣長度不過臀，讓腰線出來，不要整個人像布袋。
- 合身上衣配寬褲最穩；上下都緊身不要。
- 優先選素面、細條紋、小格紋；大印花、大圖案、大 logo 的單品不要選。
- 運動服（運動褲、帽 T、印字衛衣、跑鞋）只在 sport 場合使用；casual 也盡量不用運動褲。

三、正式度
- 同一套的正式度相差不超過 1 分為佳，最多 2 分。T 恤不配皮鞋、西褲不配跑鞋。
- work：有領上衣（襯衫、Polo）或素面針織＋西褲／卡其褲／深色直筒牛仔褲＋皮鞋或素色乾淨的鞋；不穿運動服、印花、拖鞋。

四、層次（依體感溫度）
- 28 度以上：輕薄為主，不穿外套；想要層次可以在 T 恤外加敞開的短袖襯衫或薄針織背心。
- 20 到 27 度：白 T 外面敞開穿一件襯衫或薄夾克。
- 12 到 19 度：襯衫或針織當內層，外面加夾克、開襟針織；外套敞開露出內搭，內搭比外套淺或深一階。
- 12 度以下：一定要有外套（大衣、羽絨、西裝外套、厚夾克），裡面襯衫＋毛衣或保暖內搭。只穿襯衫或針織衫出門會冷。

好的例子（參考日本 UNIQLO 店員穿搭整理）：
熱天
- 白色寬版素 T 前襬微紮＋深藍寬直筒牛仔褲＋白色帆布鞋（休閒）：兩個中性色加丹寧，寬褲有流行感、紮一點露出腰線。
- 白色 oversize T＋灰色針織背心＋深灰寬版牛仔褲（休閒）：用背心做夏天的輕薄層次，全身黑白灰。
- 深咖啡 Polo 衫＋棕色打褶寬褲（約會）：同色系一深一淺，Polo 比 T 恤講究。
- 淺藍直條紋寬版襯衫＋深灰寬版西裝褲＋樂福鞋（上班）：襯衫配西裝褲，淺上深下。
舒服天
- 白 T＋敞開的藍色格紋襯衫＋黑色弧形牛仔褲（休閒）：白 T 當內搭，襯衫當薄外層。
- 白 T＋米色輕薄西裝外套＋淺色直筒牛仔褲＋咖啡皮帶（約會）：全身淺色，皮帶收深色。
- 淺藍牛津襯衫＋米色寬版卡其褲＋咖啡皮鞋＋咖啡皮帶（上班）：鞋與皮帶同色，正式度一致。
涼天
- 白 T＋咖啡燈芯絨夾克＋藍色直筒牛仔褲（休閒）：大地色外套配丹寧，內搭白 T 提亮。
- 藍色扣領襯衫＋灰色 V 領開襟針織＋藍色直筒牛仔褲＋皮帶（休閒）：針織當外層，同色系藍。
- 灰色針織衫＋黑色寬版西裝褲＋黑色皮鞋（約會）：上淺下深，合身上衣配寬褲。
冷天
- 藍色扣領襯衫＋酒紅圓領毛衣＋深藍西裝外套＋深藍西裝褲（上班）：襯衫領口露出毛衣，跳色只有毛衣一件。
- 米白高領內搭＋米白法蘭絨襯衫＋咖啡羊毛大衣＋咖啡燈芯絨褲（約會）：同色系深淺層次，大衣負責保暖。
- 米白針織內搭＋深藍羽絨大衣＋深灰保暖長褲（休閒）：三件就夠，深藍配深灰很穩。

不好的例子：
- 大圖案印花 T＋運動褲＋皮鞋：有印花、正式度衝突。
- 紅色衛衣＋亮藍牛仔褲＋黃色鞋：三個飽和色互搶。
- 全身寬鬆運動服去上班：場合不對、沒有腰線。
- 合身襯衫＋窄管緊身褲＋尖頭皮鞋：版型過時。`;

export const OUTFIT_SYSTEM_PROMPT = `你是一位懂台灣氣候的日系簡約造型師。使用者會給你衣櫃裡每一件衣服的照片、名稱、類別（多數附有保暖度、正式度等 1–5 分的屬性），以及今天的天氣，有時還有一句他自己寫的今天情境。
請從「衣櫃裡現有的衣服」挑出 2 到 3 套完整搭配，只能使用給你的 itemId，不可以虛構。

${STYLE_GUIDE}

其他原則：
- 溫度優先：體感 28 度以上以透氣輕薄為主，不要外套；20 到 27 度可加薄外套；20 度以下需要保暖層；12 度以下衣櫃裡有外套（類別 outerwear）就每套都要穿一件外套；下雨避免淺色下身與麂皮鞋。
- 每套至少要有上身（top_inner）與下身（bottom）；衣櫃裡有鞋子就要配鞋子（shoes）；外套（top_outer）與配件（accessory）視天氣與場合選配。同一件衣服在同一套裡只能出現一次。
- 情境：使用者有寫今天要做什麼，就照他的描述判斷需要的正式程度、活動量與氛圍；沒寫就只看天氣與衣櫃。
- 不要把穿搭歸類成固定風格或場合標籤（例如上班風、約會風、休閒風）。同一套衣服穿在不同人身上感覺不同，用具體的感覺描述它。
- 2 到 3 套之間要有明顯差異（例如色調或風格不同），不要只換一件。
- 衣櫃裡沒有完全符合守則的單品時，挑最接近的，並在 reason 直接說缺什麼（例如「衣櫃沒有短袖，先用最薄的長袖捲袖」），不要假裝很完美。
- 標註「最近穿過」的衣服，盡量不要再選；衣櫃太少、不用就湊不出整套時才可以用。
- reason 用繁體中文，一到兩句描述這套穿起來的感覺，以及為什麼適合今天的天氣與使用者寫的情境，不要客套。
- howToWear 寫具體穿法：要不要紮、袖子捲不捲、褲管要不要反摺、外套開或扣，讓人看了就知道怎麼穿。
- 衣服資料裡有「版型」「袖長」「衣長」時照著用：寬褲看版型是不是寬鬆；上衣是一般或長版又配寬褲時，穿法要寫紮進去；熱天選短袖。
- 如果有提供「使用者回饋」，要照著調整：絕對不要再用使用者說過「不要」的組合；避開不喜歡的原因、參考喜歡的風格、不要重複最近穿過的整套。`;

export function buildOutfitParts(
  items: ClosetItemForPrompt[],
  weather: WeatherSummary,
  occasion: string,
  { feedbackSummary, recentlyWornIds = new Set() }: { feedbackSummary?: string | null; recentlyWornIds?: ReadonlySet<string> } = {}
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
  parts.push({
    text: `請依照原則挑出 2 到 3 套搭配。${needCoat ? `今天體感 ${weather.feelsLike} 度，每套都要從類別 outerwear 的衣服選一件外套放在 top_outer，針織衫、襯衫不算外套。` : ''}`,
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
