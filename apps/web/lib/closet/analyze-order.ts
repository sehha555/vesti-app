import { generateJson, imagePart } from '../ai/gemini';
import { CLOSET_CATEGORIES, type ClosetCategory } from './analyze-clothing';

/** [ymin, xmin, ymax, xmax]，0-1000 的相對座標（Gemini 物件定位的慣例） */
export type Box = [number, number, number, number];

export interface OrderItem {
  name: string;
  category: ClosetCategory;
  color: string;
  brand: string | null;
  box: Box;
}

export interface OrderAnalysis {
  orderId: string | null;
  items: OrderItem[];
}

const SYSTEM_PROMPT = `你在幫使用者把網購訂單裡的衣物加進數位衣櫃。會給你一張訂單截圖（蝦皮、momo、UNIQLO、Zara 等都可能）。

找出截圖裡每一件「衣物類商品」（衣服、褲子、外套、鞋子、包包、帽子等配件），非衣物（家電、食品、運費、折價券）一律跳過。

每件填：
- name：繁體中文簡短名稱，顏色 + 版型 + 品項，例如「白色寬版圓領 T 恤」；截圖上有商品名就以它為準整理成簡短版。
- category：只能是 top（上身）、outerwear（外套）、bottom（下身）、shoes（鞋子）、accessory（配件、包包、帽子）。
- color：主要顏色，繁體中文一個詞；截圖上有寫規格顏色就用它。
- brand：截圖上看得到品牌或店名才填，否則 null，不要猜。
- box：這件商品「縮圖」在截圖中的位置 [ymin, xmin, ymax, xmax]，0-1000 的相對座標；只框商品圖本身，不要框到文字。

orderId：截圖上看得到訂單編號就填，否則 null。沒有任何衣物時 items 給空陣列。`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    orderId: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          category: { type: 'string', enum: [...CLOSET_CATEGORIES] },
          color: { type: 'string' },
          brand: { type: ['string', 'null'] },
          box: { type: 'array', items: { type: 'integer' }, minItems: 4, maxItems: 4 },
        },
        required: ['name', 'category', 'color', 'brand', 'box'],
      },
    },
  },
  required: ['orderId', 'items'],
};

const MAX_ITEMS = 20;

function isValidBox(box: unknown): box is Box {
  if (!Array.isArray(box) || box.length !== 4) return false;
  const [ymin, xmin, ymax, xmax] = box;
  return box.every((n) => Number.isFinite(n) && n >= 0 && n <= 1000) && ymax > ymin && xmax > xmin;
}

/** 讀訂單截圖，列出裡面的衣物與各自縮圖位置。框不合理或類別不對的項目直接丟掉。 */
export async function analyzeOrderScreenshot(buffer: Buffer, mimeType: string): Promise<OrderAnalysis> {
  const result = await generateJson<OrderAnalysis>(
    SYSTEM_PROMPT,
    [imagePart(buffer.toString('base64'), mimeType)],
    RESPONSE_SCHEMA
  );
  const items = (result.items ?? [])
    .filter((item) => CLOSET_CATEGORIES.includes(item.category) && isValidBox(item.box))
    .slice(0, MAX_ITEMS);
  return { orderId: result.orderId?.trim() || null, items };
}
