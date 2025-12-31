/**
 * Ranking Service (stub)
 * Real implementation is in /services/reco
 */

export interface RankableOutfit {
  id: string;
  score?: number;
  items?: Record<string, unknown>;
}

export interface UserPreferences {
  preferredTags?: string[];
  blacklistTags?: string[];
}

export async function rankOutfits(
  outfits: RankableOutfit[],
  preferences: UserPreferences
): Promise<RankableOutfit[]> {
  // Stub implementation - return outfits as-is
  return outfits;
}

export const RankOutfitsService = {
  rank: rankOutfits,
};
