import { z } from 'zod';

// 穿搭相關 API（今日計畫、收藏、回饋事件）共用的驗證規則

/** 使用者當地日期，由前端算好送來（台灣早上 8 點前 UTC 還是昨天） */
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const WeatherSchema = z.record(z.string(), z.unknown());

/** 白板上的一格：哪個部位放哪件衣服（item.id 是 closet_items.id） */
export const LayoutSlotSchema = z.object({
  slotKey: z.string().min(1).max(50),
  item: z.object({
    id: z.string().max(100).optional(),
    name: z.string().max(200).optional(),
    imageUrl: z.string().max(2000).optional(),
  }),
  priority: z.number().int(),
});

export type LayoutSlotInput = z.infer<typeof LayoutSlotSchema>;
