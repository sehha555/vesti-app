// 衣櫃類別：匯入、上傳、編輯、推薦都用同一組值
export const CLOSET_CATEGORIES = ['top', 'outerwear', 'bottom', 'shoes', 'accessory', 'uncategorized'] as const;

export type ClosetCategory = (typeof CLOSET_CATEGORIES)[number];

export const CLOSET_CATEGORY_LABELS: Record<ClosetCategory, string> = {
  top: '上身',
  outerwear: '外套',
  bottom: '下身',
  shoes: '鞋子',
  accessory: '配件',
  uncategorized: '未分類',
};
