import { generateJson, imagePart } from '../ai/gemini';

export const CLOSET_CATEGORIES = ['top', 'outerwear', 'bottom', 'shoes', 'accessory'] as const;
export type ClosetCategory = (typeof CLOSET_CATEGORIES)[number];

export interface ClothingAnalysis {
  name: string;
  category: ClosetCategory;
  color: string;
  brand: string | null;
  tags: string[];
}

const SYSTEM_PROMPT = `你在幫使用者把一件衣物加進數位衣櫃。看照片，填出這件衣物的資料。

- name：簡短的繁體中文名稱，顏色 + 版型 + 品項，例如「黑色寬版連帽外套」。
- category：只能是 top（上身）、outerwear（外套）、bottom（下身）、shoes（鞋子）、accessory（配件、包包、帽子）。
- color：主要顏色，繁體中文一個詞，例如「黑色」「米白」。
- brand：照片上看得到 logo 或吊牌才填，看不出來就填 null，不要猜。
- tags：2-4 個繁體中文風格或場合標籤，例如「休閒」「通勤」「保暖」。

照片裡有好幾件時，描述最主要、佔畫面最大的那一件。`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    category: { type: 'string', enum: [...CLOSET_CATEGORIES] },
    color: { type: 'string' },
    brand: { type: ['string', 'null'] },
    tags: { type: 'array', items: { type: 'string' } },
  },
  required: ['name', 'category', 'color', 'brand', 'tags'],
};

/** 看一張衣物照片，回傳可直接預填上傳表單的欄位。模型出錯時直接丟出，由呼叫端決定怎麼回應。 */
export async function analyzeClothingImage(buffer: Buffer, mimeType: string): Promise<ClothingAnalysis> {
  const result = await generateJson<ClothingAnalysis>(
    SYSTEM_PROMPT,
    [imagePart(buffer.toString('base64'), mimeType)],
    RESPONSE_SCHEMA
  );
  // schema 已限制 enum，這裡防模型不照做
  if (!CLOSET_CATEGORIES.includes(result.category)) {
    throw new Error(`Unexpected category: ${result.category}`);
  }
  return { ...result, tags: result.tags.slice(0, 4) };
}
