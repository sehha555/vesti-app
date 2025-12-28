import { z } from 'zod';

// Safety limits to prevent DoS
export const MAX_OUTFITS = 200;
export const MAX_TAGS_PER_OUTFIT = 50;
export const MAX_PREFERRED_TAGS = 50;
export const MAX_BLACKLIST_TAGS = 50;
export const MAX_BODY_SIZE = 65536; // 64KB

/**
 * Schema for a single outfit in the ranking request (strict mode)
 */
export const RankableOutfitSchema = z
  .object({
    id: z.string().min(1, 'id 不可為空'),
    score: z
      .number()
      .min(0, 'score 必須 >= 0')
      .max(1, 'score 必須 <= 1'),
    tags: z
      .array(z.string())
      .max(MAX_TAGS_PER_OUTFIT, `tags 數量不可超過 ${MAX_TAGS_PER_OUTFIT}`)
      .default([]),
  })
  .strict();

/**
 * Schema for user preferences (strict mode)
 */
export const UserPreferencesSchema = z
  .object({
    preferredTags: z
      .array(z.string())
      .max(MAX_PREFERRED_TAGS, `preferredTags 數量不可超過 ${MAX_PREFERRED_TAGS}`)
      .default([]),
    blacklistTags: z
      .array(z.string())
      .max(MAX_BLACKLIST_TAGS, `blacklistTags 數量不可超過 ${MAX_BLACKLIST_TAGS}`)
      .default([]),
  })
  .strict();

/**
 * Schema for the ranking request body (strict mode - rejects unknown fields)
 */
export const RankRequestSchema = z
  .object({
    outfits: z
      .array(RankableOutfitSchema)
      .min(1, 'outfits 至少需要一筆資料')
      .max(MAX_OUTFITS, `outfits 數量不可超過 ${MAX_OUTFITS}`),
    userPrefs: UserPreferencesSchema.optional(),
  })
  .strict();

/**
 * Schema for explainable reasons in the response
 */
export const ReasonsSchema = z.object({
  preferredMatched: z.array(z.string()),
  blacklistMatched: z.array(z.string()),
});

/**
 * Schema for a ranked outfit in the response (with explainable reasons)
 */
export const RankedOutfitSchema = z.object({
  id: z.string(),
  score: z.number(),
  tags: z.array(z.string()),
  finalScore: z.number().min(0).max(1),
  adjustments: z.object({
    preferenceBoost: z.number(),
    blacklistPenalty: z.number(),
  }),
  reasons: ReasonsSchema.optional(),
});

/**
 * Schema for the ranking response
 */
export const RankResponseSchema = z.array(RankedOutfitSchema);

// Type exports
export type RankableOutfitInput = z.infer<typeof RankableOutfitSchema>;
export type UserPreferencesInput = z.infer<typeof UserPreferencesSchema>;
export type RankRequest = z.infer<typeof RankRequestSchema>;
export type Reasons = z.infer<typeof ReasonsSchema>;
export type RankedOutfitOutput = z.infer<typeof RankedOutfitSchema>;
export type RankResponse = z.infer<typeof RankResponseSchema>;
