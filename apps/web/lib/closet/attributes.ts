import { z } from 'zod';
import { CLOSET_CATEGORIES } from './categories';

// AI 辨識出的衣物屬性，存在 closet_items.attributes（jsonb）。改形狀時把 VERSION 加一，舊資料可以重新辨識。
export const ATTRIBUTES_VERSION = 1;

export const PATTERNS = ['solid', 'stripe', 'check', 'print', 'denim', 'other'] as const;
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

const PATTERN_LABELS: Record<(typeof PATTERNS)[number], string> = {
  solid: '素面',
  stripe: '條紋',
  check: '格紋',
  print: '印花',
  denim: '丹寧',
  other: '其他',
};

const Level = z.number().int().min(1).max(5);

export const ItemAttributesSchema = z.object({
  version: z.literal(ATTRIBUTES_VERSION),
  // 辨識不出來時模型回 uncategorized
  category: z.enum(CLOSET_CATEGORIES),
  subcategory: z.string().trim().max(30),
  name: z.string().trim().min(1).max(30),
  colors: z.array(z.string().trim().min(1).max(20)).min(1).max(3),
  pattern: z.enum(PATTERNS),
  /** 1 = 很透氣（背心、短褲）… 5 = 很保暖（羽絨外套） */
  warmth: Level,
  /** 1 = 很休閒（運動服、拖鞋）… 5 = 很正式（西裝、皮鞋） */
  formality: Level,
  styles: z.array(z.string().trim().min(1).max(20)).max(4),
  seasons: z.array(z.enum(SEASONS)).max(4),
});

export type ItemAttributes = z.infer<typeof ItemAttributesSchema>;

/** DB 讀出來的 jsonb 可能是舊版或壞掉的，不合格就當作沒辨識 */
export function parseAttributes(value: unknown): ItemAttributes | null {
  const parsed = ItemAttributesSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** 給推薦 prompt 用的一行文字 */
export function describeAttributes(a: ItemAttributes): string {
  return [
    a.subcategory && `細類: ${a.subcategory}`,
    `顏色: ${a.colors.join('/')}`,
    `花紋: ${PATTERN_LABELS[a.pattern]}`,
    `保暖 ${a.warmth}/5`,
    `正式 ${a.formality}/5`,
    a.styles.length > 0 && `風格: ${a.styles.join('、')}`,
  ]
    .filter(Boolean)
    .join('｜');
}
