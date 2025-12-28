/**
 * Outfit ranking module for Vesti recommendation engine.
 * Ranks outfits based on base scores and user preferences.
 */

export interface RankableOutfit {
  id: string;
  score: number;
  tags: string[];
}

export interface UserPreferences {
  preferredTags: string[];
  blacklistTags: string[];
}

export interface Reasons {
  preferredMatched: string[];
  blacklistMatched: string[];
}

export interface RankedOutfit extends RankableOutfit {
  finalScore: number;
  adjustments: {
    preferenceBoost: number;
    blacklistPenalty: number;
  };
  reasons?: Reasons;
}

// Configuration constants
export const PREFERENCE_BOOST_PER_TAG = 0.1;
export const BLACKLIST_PENALTY = 0.8; // Multiplier (reduces score by 80%)

/**
 * Calculates the preference boost for an outfit based on matching tags.
 * Each matching preferred tag adds a boost to the score.
 * Returns both the boost value and the matched tags for explainability.
 */
export const calculatePreferenceBoost = (
  outfit: RankableOutfit,
  preferredTags: string[]
): { boost: number; matchedTags: string[] } => {
  if (!preferredTags || preferredTags.length === 0) return { boost: 0, matchedTags: [] };
  if (!outfit.tags || outfit.tags.length === 0) return { boost: 0, matchedTags: [] };

  const matchedTags = outfit.tags.filter(tag => preferredTags.includes(tag));

  return {
    boost: matchedTags.length * PREFERENCE_BOOST_PER_TAG,
    matchedTags,
  };
};

/**
 * Gets blacklisted tags that match the outfit.
 * Returns the list of matched blacklist tags for explainability.
 */
export const getBlacklistMatches = (
  outfit: RankableOutfit,
  blacklistTags: string[]
): string[] => {
  if (!blacklistTags || blacklistTags.length === 0) return [];
  if (!outfit.tags || outfit.tags.length === 0) return [];

  return outfit.tags.filter(tag => blacklistTags.includes(tag));
};

/**
 * Checks if an outfit contains any blacklisted tags.
 */
export const hasBlacklistedTag = (
  outfit: RankableOutfit,
  blacklistTags: string[]
): boolean => {
  return getBlacklistMatches(outfit, blacklistTags).length > 0;
};

/**
 * Calculates the final score for an outfit considering user preferences.
 * Includes explainable reasons for the score adjustments.
 */
export const calculateFinalScore = (
  outfit: RankableOutfit,
  userPrefs?: UserPreferences
): {
  finalScore: number;
  preferenceBoost: number;
  blacklistPenalty: number;
  reasons: Reasons;
} => {
  let finalScore = outfit.score;
  let preferenceBoost = 0;
  let blacklistPenalty = 0;
  let preferredMatched: string[] = [];
  let blacklistMatched: string[] = [];

  if (userPrefs) {
    // Apply preference boost
    const prefResult = calculatePreferenceBoost(outfit, userPrefs.preferredTags);
    preferenceBoost = prefResult.boost;
    preferredMatched = prefResult.matchedTags;
    finalScore += preferenceBoost;

    // Apply blacklist penalty
    blacklistMatched = getBlacklistMatches(outfit, userPrefs.blacklistTags);
    if (blacklistMatched.length > 0) {
      blacklistPenalty = finalScore * BLACKLIST_PENALTY;
      finalScore *= (1 - BLACKLIST_PENALTY);
    }
  }

  // Always clamp score between 0 and 1
  finalScore = Math.max(0, Math.min(1, finalScore));

  return {
    finalScore,
    preferenceBoost,
    blacklistPenalty,
    reasons: { preferredMatched, blacklistMatched },
  };
};

/**
 * Ranks outfits based on their base scores and user preferences.
 *
 * @param outfits - Array of outfits with id, score, and tags
 * @param userPrefs - User preferences with preferred and blacklisted tags
 * @returns Sorted array of outfits (highest score first) with ranking metadata and explainable reasons
 */
export const rankOutfits = (
  outfits: RankableOutfit[],
  userPrefs?: UserPreferences
): RankedOutfit[] => {
  if (!outfits || outfits.length === 0) {
    return [];
  }

  const rankedOutfits: RankedOutfit[] = outfits.map(outfit => {
    const { finalScore, preferenceBoost, blacklistPenalty, reasons } = calculateFinalScore(
      outfit,
      userPrefs
    );

    return {
      ...outfit,
      finalScore,
      adjustments: {
        preferenceBoost,
        blacklistPenalty,
      },
      reasons,
    };
  });

  // Sort by finalScore in descending order (highest first)
  rankedOutfits.sort((a, b) => b.finalScore - a.finalScore);

  return rankedOutfits;
};
