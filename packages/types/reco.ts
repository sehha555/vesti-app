
import { z } from 'zod';

export const DailyOutfitRequestSchema = z.object({
  userId: z.string(),
  lat: z.number(),
  lon: z.number(),
  occasion: z.enum(['casual', 'work', 'evening', 'sport']),
});

export type DailyOutfitRequest = z.infer<typeof DailyOutfitRequestSchema>;

export const OutfitRecommendationSchema = z.object({
  outfit: z.object({
    top: z.any(),
    bottom: z.any(),
    outerwear: z.any().optional(),
    shoes: z.any(),
    accessory: z.any().optional(),
  }),
  reasons: z.array(z.string()),
  scores: z.object({
    weatherFit: z.number(),
    occasionMatch: z.number(),
    compatibility: z.number(),
    total: z.number(),
  }),
});

export const DailyOutfitResponseSchema = z.object({
  recommendations: z.array(OutfitRecommendationSchema).length(2),
});

export type DailyOutfitResponse = z.infer<typeof DailyOutfitResponseSchema>;
