import { describe, it, expect } from 'vitest';
import {
  rankOutfits,
  calculatePreferenceBoost,
  hasBlacklistedTag,
  calculateFinalScore,
  RankableOutfit,
  UserPreferences,
  PREFERENCE_BOOST_PER_TAG,
  BLACKLIST_PENALTY,
} from './rankOutfits';

// Fixed seed for deterministic tests (if random logic is added later)
const FIXED_SEED = 12345;

// Test data factories
const createOutfit = (overrides: Partial<RankableOutfit> = {}): RankableOutfit => ({
  id: `outfit-${Math.random().toString(36).slice(2, 8)}`,
  score: 0.5,
  tags: [],
  ...overrides,
});

const createUserPrefs = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  preferredTags: [],
  blacklistTags: [],
  ...overrides,
});

describe('rankOutfits', () => {
  describe('Happy Path', () => {
    it('should return outfits sorted by score in descending order', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.3 }),
        createOutfit({ id: 'o2', score: 0.9 }),
        createOutfit({ id: 'o3', score: 0.6 }),
      ];

      const result = rankOutfits(outfits);

      expect(result[0].id).toBe('o2');
      expect(result[1].id).toBe('o3');
      expect(result[2].id).toBe('o1');
    });

    it('should boost outfits with preferred tags above others', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.5, tags: ['casual'] }),
        createOutfit({ id: 'o2', score: 0.5, tags: ['minimal', 'work'] }),
      ];
      const userPrefs = createUserPrefs({ preferredTags: ['minimal'] });

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].id).toBe('o2');
      expect(result[0].finalScore).toBeGreaterThan(result[1].finalScore);
    });

    it('should penalize outfits with blacklisted tags', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.9, tags: ['sport'] }),
        createOutfit({ id: 'o2', score: 0.4, tags: ['work'] }),
      ];
      const userPrefs = createUserPrefs({ blacklistTags: ['sport'] });

      const result = rankOutfits(outfits, userPrefs);

      // o1 has higher base score but should be penalized due to blacklist
      expect(result[0].id).toBe('o2');
      expect(result[1].adjustments.blacklistPenalty).toBeGreaterThan(0);
    });

    it('should match example from specification: o1 ranks first with minimal tag', () => {
      // Example from spec:
      // outfits = [{ id: "o1", score: 0.9, tags: ["minimal", "work"] },
      //            { id: "o2", score: 0.4, tags: ["sport"] }]
      // userPrefs = { preferredTags: ["minimal"], blacklistTags: ["sport"] }
      const outfits: RankableOutfit[] = [
        { id: 'o1', score: 0.9, tags: ['minimal', 'work'] },
        { id: 'o2', score: 0.4, tags: ['sport'] },
      ];
      const userPrefs: UserPreferences = {
        preferredTags: ['minimal'],
        blacklistTags: ['sport'],
      };

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].id).toBe('o1');
    });

    it('should return finalScore between 0 and 1', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.95, tags: ['minimal', 'work', 'casual'] }),
      ];
      const userPrefs = createUserPrefs({ preferredTags: ['minimal', 'work', 'casual'] });

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].finalScore).toBeGreaterThanOrEqual(0);
      expect(result[0].finalScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Boundary Values', () => {
    it('should handle empty outfits array', () => {
      const result = rankOutfits([]);

      expect(result).toEqual([]);
    });

    it('should handle single outfit', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.7 }),
      ];

      const result = rankOutfits(outfits);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('o1');
    });

    it('should handle outfit with empty tags array', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.5, tags: [] }),
      ];
      const userPrefs = createUserPrefs({ preferredTags: ['minimal'] });

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].finalScore).toBe(0.5); // No boost applied
      expect(result[0].adjustments.preferenceBoost).toBe(0);
    });

    it('should handle userPrefs with empty preferredTags', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.5, tags: ['minimal'] }),
      ];
      const userPrefs = createUserPrefs({ preferredTags: [], blacklistTags: [] });

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].adjustments.preferenceBoost).toBe(0);
    });

    it('should handle undefined userPrefs', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.7 }),
      ];

      const result = rankOutfits(outfits, undefined);

      expect(result[0].finalScore).toBe(0.7);
    });

    it('should handle score of 0', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0 }),
      ];

      const result = rankOutfits(outfits);

      expect(result[0].finalScore).toBe(0);
    });

    it('should handle score of 1', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 1, tags: ['minimal'] }),
      ];
      const userPrefs = createUserPrefs({ preferredTags: ['minimal'] });

      const result = rankOutfits(outfits, userPrefs);

      // Score should be clamped to 1
      expect(result[0].finalScore).toBeLessThanOrEqual(1);
    });

    it('should handle outfits with identical scores', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.5 }),
        createOutfit({ id: 'o2', score: 0.5 }),
        createOutfit({ id: 'o3', score: 0.5 }),
      ];

      const result = rankOutfits(outfits);

      expect(result).toHaveLength(3);
      // All should have the same finalScore
      expect(result[0].finalScore).toBe(result[1].finalScore);
      expect(result[1].finalScore).toBe(result[2].finalScore);
    });
  });

  describe('Error Inputs', () => {
    it('should handle outfit with undefined tags gracefully', () => {
      const outfits: RankableOutfit[] = [
        { id: 'o1', score: 0.5, tags: undefined as any },
      ];
      const userPrefs = createUserPrefs({ preferredTags: ['minimal'] });

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].adjustments.preferenceBoost).toBe(0);
    });

    it('should handle negative score by clamping to 0', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: -0.5 }),
      ];

      const result = rankOutfits(outfits);

      expect(result[0].finalScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle score greater than 1 by clamping', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 1.5 }),
      ];

      const result = rankOutfits(outfits);

      expect(result[0].finalScore).toBeLessThanOrEqual(1);
    });

    it('should handle non-matching tags in userPrefs', () => {
      const outfits: RankableOutfit[] = [
        createOutfit({ id: 'o1', score: 0.5, tags: ['work', 'formal'] }),
      ];
      const userPrefs = createUserPrefs({
        preferredTags: ['nonexistent', 'imaginary'],
        blacklistTags: ['alsononexistent'],
      });

      const result = rankOutfits(outfits, userPrefs);

      expect(result[0].adjustments.preferenceBoost).toBe(0);
      expect(result[0].adjustments.blacklistPenalty).toBe(0);
    });
  });
});

describe('calculatePreferenceBoost', () => {
  it('should return correct boost and matched tags for matching tags', () => {
    const outfit = createOutfit({ tags: ['minimal', 'work', 'casual'] });
    const preferredTags = ['minimal', 'casual'];

    const result = calculatePreferenceBoost(outfit, preferredTags);

    expect(result.boost).toBe(2 * PREFERENCE_BOOST_PER_TAG);
    expect(result.matchedTags).toContain('minimal');
    expect(result.matchedTags).toContain('casual');
    expect(result.matchedTags).toHaveLength(2);
  });

  it('should return 0 boost and empty matchedTags for no matching tags', () => {
    const outfit = createOutfit({ tags: ['sport'] });
    const preferredTags = ['minimal', 'work'];

    const result = calculatePreferenceBoost(outfit, preferredTags);

    expect(result.boost).toBe(0);
    expect(result.matchedTags).toEqual([]);
  });

  it('should return 0 boost and empty matchedTags for empty preferredTags', () => {
    const outfit = createOutfit({ tags: ['minimal'] });

    const result = calculatePreferenceBoost(outfit, []);

    expect(result.boost).toBe(0);
    expect(result.matchedTags).toEqual([]);
  });
});

describe('hasBlacklistedTag', () => {
  it('should return true if outfit has blacklisted tag', () => {
    const outfit = createOutfit({ tags: ['sport', 'casual'] });
    const blacklistTags = ['sport'];

    const result = hasBlacklistedTag(outfit, blacklistTags);

    expect(result).toBe(true);
  });

  it('should return false if outfit has no blacklisted tags', () => {
    const outfit = createOutfit({ tags: ['minimal', 'work'] });
    const blacklistTags = ['sport'];

    const result = hasBlacklistedTag(outfit, blacklistTags);

    expect(result).toBe(false);
  });

  it('should return false for empty blacklistTags', () => {
    const outfit = createOutfit({ tags: ['sport'] });

    const result = hasBlacklistedTag(outfit, []);

    expect(result).toBe(false);
  });
});

describe('calculateFinalScore', () => {
  it('should apply both boost and penalty correctly', () => {
    const outfit = createOutfit({ score: 0.5, tags: ['minimal', 'sport'] });
    const userPrefs = createUserPrefs({
      preferredTags: ['minimal'],
      blacklistTags: ['sport'],
    });

    const result = calculateFinalScore(outfit, userPrefs);

    // Boost is applied, then penalty
    expect(result.preferenceBoost).toBe(PREFERENCE_BOOST_PER_TAG);
    expect(result.blacklistPenalty).toBeGreaterThan(0);
    expect(result.finalScore).toBeLessThan(0.5 + PREFERENCE_BOOST_PER_TAG);
  });

  it('should return base score when no userPrefs provided', () => {
    const outfit = createOutfit({ score: 0.7 });

    const result = calculateFinalScore(outfit, undefined);

    expect(result.finalScore).toBe(0.7);
    expect(result.preferenceBoost).toBe(0);
    expect(result.blacklistPenalty).toBe(0);
  });
});
