import { z } from 'zod';

// Safety limits
export const MAX_BODY_SIZE = 65536; // 64KB
export const MAX_OUTFIT_COUNT = 10;
export const MIN_OUTFIT_COUNT = 1;

/**
 * Valid body types for outfit recommendations
 */
export const BodyTypeEnum = z.enum([
  'apple',      // 蘋果型 (中間寬)
  'pear',       // 梨型 (下半身寬)
  'hourglass',  // 沙漏型 (腰細)
  'rectangle',  // 矩形 (直筒)
  'inverted',   // 倒三角型 (肩寬)
]);

/**
 * Valid occasions for outfit recommendations
 */
export const OccasionEnum = z.enum([
  '上班',
  '約會',
  '休閒',
  '運動',
  '正式場合',
  '派對',
  '旅行',
  '居家',
  'work',
  'date',
  'casual',
  'sports',
  'formal',
  'party',
  'travel',
  'home',
]);

/**
 * Schema for daily outfit request (strict mode)
 */
export const DailyOutfitRequestSchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date 格式必須為 YYYY-MM-DD'),
    location: z
      .string()
      .min(1, 'location 不可為空')
      .max(100, 'location 長度不可超過 100 字元'),
    occasion: OccasionEnum,
    bodyType: BodyTypeEnum.optional(),
    outfitCount: z
      .number()
      .int('outfitCount 必須為整數')
      .min(MIN_OUTFIT_COUNT, `outfitCount 最少 ${MIN_OUTFIT_COUNT}`)
      .max(MAX_OUTFIT_COUNT, `outfitCount 最多 ${MAX_OUTFIT_COUNT}`)
      .default(3),
  })
  .strict();

/**
 * Schema for a wardrobe item in the outfit
 */
export const OutfitItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  type: z.string(),
});

/**
 * Schema for outfit reasons (explainability)
 */
export const OutfitReasonsSchema = z.object({
  weatherMatched: z.boolean(),
  occasionMatched: z.boolean(),
  bodyTypeOptimized: z.boolean().optional(),
  colorHarmony: z.number().min(0).max(1).optional(),
  styleConsistency: z.number().min(0).max(1).optional(),
});

/**
 * Schema for a single generated outfit
 */
export const GeneratedOutfitSchema = z.object({
  id: z.string(),
  items: z.object({
    top: OutfitItemSchema.optional(),
    bottom: OutfitItemSchema.optional(),
    outerwear: OutfitItemSchema.optional(),
    shoes: OutfitItemSchema.optional(),
    accessory: OutfitItemSchema.optional(),
  }),
  score: z.number().min(0).max(1),
  reasons: OutfitReasonsSchema,
});

/**
 * Schema for suggested purchase items (when wardrobe is lacking)
 */
export const SuggestedPurchaseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  imageUrl: z.string(),
  price: z.number().optional(),
  reason: z.string(), // Why this item is suggested
});

/**
 * Schema for weather info in response
 */
export const WeatherInfoSchema = z.object({
  temperature: z.number(),
  feelsLike: z.number(),
  condition: z.string(),
  humidity: z.number(),
  locationName: z.string().optional(),
});

/**
 * Schema for the daily outfit response
 */
export const DailyOutfitResponseSchema = z.object({
  ok: z.boolean(),
  date: z.string(),
  weather: WeatherInfoSchema,
  outfits: z.array(GeneratedOutfitSchema),
  suggestedPurchases: z.array(SuggestedPurchaseSchema).optional(),
  message: z.string().optional(),
});

// Type exports
export type BodyType = z.infer<typeof BodyTypeEnum>;
export type Occasion = z.infer<typeof OccasionEnum>;
export type DailyOutfitRequest = z.infer<typeof DailyOutfitRequestSchema>;
export type OutfitItem = z.infer<typeof OutfitItemSchema>;
export type OutfitReasons = z.infer<typeof OutfitReasonsSchema>;
export type GeneratedOutfit = z.infer<typeof GeneratedOutfitSchema>;
export type SuggestedPurchase = z.infer<typeof SuggestedPurchaseSchema>;
export type WeatherInfo = z.infer<typeof WeatherInfoSchema>;
export type DailyOutfitResponse = z.infer<typeof DailyOutfitResponseSchema>;
