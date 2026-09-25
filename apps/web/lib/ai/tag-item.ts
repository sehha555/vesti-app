import { generateJson, imagePart } from './gemini';
import { ATTRIBUTES_VERSION, ItemAttributesSchema, PATTERNS, SEASONS, type ItemAttributes } from '../closet/attributes';
import { CLOSET_CATEGORIES } from '../closet/categories';

const SYSTEM_PROMPT = `你是服飾商品標註員。看一張衣物照片（通常已去背），辨識這一件衣物的屬性。
- 照片裡有多件時，標註最主要、最完整的那一件。
- category：top 上身（T 恤、襯衫、毛衣、洋裝也算 top）、outerwear 外套（夾克、大衣、西裝外套、開襟外套）、bottom 下身（褲、裙）、shoes 鞋子、accessory 配件（包、帽、圍巾、皮帶、飾品）；不是衣物或看不出來就填 uncategorized。
- subcategory：細類，繁體中文，例如「圓領T恤」「牛仔寬褲」「帆布鞋」。
- name：給使用者看的短名稱，繁體中文，顏色＋細類，例如「白色圓領T恤」，12 字以內。
- colors：主色在前，最多 3 個，繁體中文常用色名（白、黑、灰、米、卡其、深藍、淺藍、紅、粉、綠、橄欖綠、棕、黃、紫…）。
- warmth 保暖度 1–5：1 背心短褲涼鞋、2 短袖或薄長褲、3 長袖襯衫薄針織、4 毛衣厚帽T薄外套、5 羽絨大衣厚外套。
- formality 正式度 1–5：1 運動居家拖鞋、2 休閒 T 恤牛仔、3 休閒襯衫卡其褲、4 商務休閒西裝外套樂福鞋、5 西裝正裝皮鞋。
- styles：最多 4 個風格詞，繁體中文，例如 休閒、簡約、街頭、運動、日系、復古、優雅、商務。
- seasons：適合的季節，可複選。`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: [...CLOSET_CATEGORIES] },
    subcategory: { type: 'string' },
    name: { type: 'string' },
    colors: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 3 },
    pattern: { type: 'string', enum: [...PATTERNS] },
    warmth: { type: 'integer', minimum: 1, maximum: 5 },
    formality: { type: 'integer', minimum: 1, maximum: 5 },
    styles: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    seasons: { type: 'array', items: { type: 'string', enum: [...SEASONS] } },
  },
  required: ['category', 'subcategory', 'name', 'colors', 'pattern', 'warmth', 'formality', 'styles', 'seasons'],
};

// 模型偶爾超出長度或重複，先修剪再驗證，不要整筆丟掉
function normalize(raw: Record<string, unknown>): Record<string, unknown> {
  const list = (v: unknown, max: number) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string').map((x) => x.trim()).filter(Boolean))].slice(0, max) : v;
  return {
    ...raw,
    version: ATTRIBUTES_VERSION,
    name: typeof raw.name === 'string' ? raw.name.trim().slice(0, 30) : raw.name,
    subcategory: typeof raw.subcategory === 'string' ? raw.subcategory.trim().slice(0, 30) : raw.subcategory,
    colors: list(raw.colors, 3),
    styles: list(raw.styles, 4),
    seasons: list(raw.seasons, 4),
  };
}

/**
 * 核心循環 ①「衣物理解」：用 Gemini 看圖辨識類別、顏色、保暖度、正式度、風格。
 * 辨識失敗（沒設 key、模型出錯、回傳不合格）回 null，不擋上傳。
 */
export async function tagClosetItem(image: { buffer: Buffer; contentType: string }): Promise<ItemAttributes | null> {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const raw = await generateJson<Record<string, unknown>>(
      SYSTEM_PROMPT,
      [imagePart(image.buffer.toString('base64'), image.contentType), { text: '請標註這件衣物。' }],
      RESPONSE_SCHEMA,
      { temperature: 0.2 }
    );
    const parsed = ItemAttributesSchema.safeParse(normalize(raw));
    if (!parsed.success) {
      console.error('[tag-item] invalid response:', parsed.error.issues[0]?.message);
      return null;
    }
    return parsed.data;
  } catch (err) {
    console.error('[tag-item] failed:', (err as Error).message);
    return null;
  }
}
