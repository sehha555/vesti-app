import { WardrobeItem } from '@/packages/types/src/wardrobe';
import { WeatherSummary } from '@/packages/types/src/weather';

// Placeholder for a keyword extraction service
const keywordCache = new Map<string, string[]>();

export const weatherFitFilter = (items: WardrobeItem[], weather: WeatherSummary): WardrobeItem[] => {
  const filtered = items.filter(item => {
    // This is a very simplistic filter. A real implementation would be more nuanced.
    const keywords = keywordCache.get(item.id) || [];
    if (weather.temperature < 10 && (keywords.includes('winter') || keywords.includes('warm'))) {
      return true;
    }
    if (weather.temperature > 20 && (keywords.includes('summer') || keywords.includes('light'))) {
      return true;
    }
    if (weather.condition === 'rainy' && keywords.includes('waterproof')) {
      return true;
    }
    return false;
  });

  return filtered.length > 0 ? filtered : items;
};

export const scoreOccasion = (item: WardrobeItem, occasion: string): number => {
  return item.style === occasion ? 1 : 0;
};

import { OutfitCombination } from '@/packages/types/src/basket';
import { Style } from '@/packages/types/src/wardrobe';

// Helper functions for scoreCompatibility

/**
 * Scores the color harmony of an outfit. (Max 30 points)
 * - Bonus for using 3 or fewer colors.
 * - Bonus for using versatile neutral colors (black, white, gray).
 * - Bonus if top and bottom share a color.
 */
const scoreColorHarmony = (outfit: OutfitCombination): number => {
    let score = 0;
    const items = [outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear].filter(Boolean) as WardrobeItem[];
    if (items.length === 0) return 0;

    const allColors = items.flatMap(item => item.colors || []);
    const uniqueColors = [...new Set(allColors)];
    const universalColors = ['black', 'white', 'gray'];

    // Rule: Not more than 3 main colors (+10)
    if (uniqueColors.length <= 3) {
        score += 10;
    }

    // Rule: Black, white, gray are versatile
    const universalColorCount = uniqueColors.filter(c => universalColors.includes(c.toLowerCase())).length;
    if (universalColorCount > 0) {
        score += 15; // Significant bonus for using neutral colors
    }

    // Rule: Top and bottom color coordination
    const topColors = new Set(outfit.top.colors || []);
    const bottomColors = new Set(outfit.bottom.colors || []);
    const intersection = new Set([...topColors].filter(c => bottomColors.has(c)));
    if (intersection.size > 0) {
        score += 15;
    }

    // Scale score to be out of 30
    return Math.min((score / 40) * 30, 30);
};

/**
 * Scores the style consistency of an outfit. (Max 25 points)
 * - Full points for a single style.
 * - Partial points for harmonious mix-and-match.
 */
const scoreStyleConsistency = (outfit: OutfitCombination): number => {
    const items = [outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear].filter(Boolean) as WardrobeItem[];
    const styles = items.map(item => item.style).filter(Boolean) as Style[];
    if (styles.length === 0) return 0;
    
    const uniqueStyles = [...new Set(styles)];

    if (uniqueStyles.length === 1) {
        return 25; // All same style
    }

    const styleCounts = styles.reduce((acc, style) => {
        acc[style] = (acc[style] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    if (Object.values(styleCounts).some(count => count >= 2)) {
        // Check for harmonious mix-and-match for pairs
        if (uniqueStyles.length === 2) {
            const [s1, s2] = uniqueStyles;
            if ((s1 === Style.CASUAL && s2 === Style.SPORTY) || (s2 === Style.CASUAL && s1 === Style.SPORTY)) return 10;
            if ((s1 === Style.FORMAL && s2 === Style.MINIMALIST) || (s2 === Style.FORMAL && s1 === Style.MINIMALIST)) return 10;
        }
        return 15; // At least 2 items have the same style
    }

    return 0; // Clashing styles
};

/**
 * Scores how well an outfit fits a given occasion. (Max 20 points)
 */
const scoreOccasionFit = (outfit: OutfitCombination, occasion?: string): number => {
    if (!occasion) return 10; // Neutral score if no occasion is specified

    const items = [outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear].filter(Boolean) as WardrobeItem[];
    if (items.length === 0) return 0;

    const styles = items.map(item => item.style).filter(Boolean) as Style[];
    let fitCount = 0;

    styles.forEach(style => {
        const occasionLower = occasion.toLowerCase();
        if (occasionLower === 'casual' && (style === Style.CASUAL || style === Style.SPORTY)) fitCount++;
        else if (occasionLower === 'formal' && (style === Style.FORMAL || style === Style.MINIMALIST)) fitCount++;
        else if (occasionLower === 'party' && (style === Style.BOHO || style === Style.VINTAGE)) fitCount++;
        else if (occasionLower === style) fitCount++;
    });

    const fitRatio = fitCount / items.length;
    if (fitRatio >= 0.75) return 20; // Fully fits
    if (fitRatio >= 0.5) return 10;  // Partially fits
    return 0; // Doesn't fit
};

/**
 * Scores how well an outfit fits the current weather. (Max 15 points)
 */
const scoreSeasonFit = (outfit: OutfitCombination, weather?: WeatherSummary): number => {
    if (!weather) return 8; // Neutral score if no weather data

    const items = [outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear].filter(Boolean) as WardrobeItem[];
    if (items.length === 0) return 0;

    const temp = weather.temperature;
    let fitCount = 0;

    items.forEach(item => {
        const season = item.season;
        if (season === 'all-season') fitCount++;
        else if (temp > 22 && (season === 'summer' || season === 'spring')) fitCount++;
        else if (temp >= 15 && temp <= 22 && (season === 'spring' || season === 'autumn')) fitCount++;
        else if (temp < 15 && (season === 'winter' || season === 'autumn')) fitCount++;
    });

    const fitRatio = fitCount / items.length;
    if (fitRatio >= 0.75) return 15; // All items fit
    if (fitRatio >= 0.5) return 10; // Partially fits
    return 5; // Does not fit well
};

/**
 * Adds bonus points based on user preferences. (Max 10 points)
 */
const scoreUserPreference = (outfit: OutfitCombination, userPreferences?: string[]): number => {
    if (!userPreferences || userPreferences.length === 0) return 0;

    const items = [outfit.top, outfit.bottom, outfit.shoes, outfit.outerwear].filter(Boolean) as WardrobeItem[];
    let preferenceHits = 0;

    items.forEach(item => {
        let hit = false;
        if (item.style && userPreferences.includes(item.style)) {
            preferenceHits++;
            hit = true;
        }
        if (!hit && item.customTags) {
            for (const tag of item.customTags) {
                if (userPreferences.includes(tag)) {
                    preferenceHits++;
                    break; // Count once per item
                }
            }
        }
    });

    return Math.min(preferenceHits * 5, 10);
};

/**
 * Calculates a compatibility score for a given outfit based on multiple fashion-centric rules.
 * The final score is a weighted sum of different dimensions, normalized to 0-100.
 * 
 * @param outfit The outfit combination to score.
 * @param occasion Optional: The target occasion (e.g., 'work', 'casual').
 * @param weather Optional: The current weather summary.
 * @param userPreferences Optional: An array of user's preferred styles or tags.
 * @returns A compatibility score from 0 to 100.
 */
export const scoreCompatibility = (
  outfit: OutfitCombination,
  occasion?: string,
  weather?: WeatherSummary,
  userPreferences?: string[]
): number => {
    // Each dimension is scored according to the weights defined in the requirements.
    const colorScore = scoreColorHarmony(outfit);         // 30%
    const styleScore = scoreStyleConsistency(outfit);       // 25%
    const occasionScore = scoreOccasionFit(outfit, occasion); // 20%
    const seasonScore = scoreSeasonFit(outfit, weather);     // 15%
    const preferenceScore = scoreUserPreference(outfit, userPreferences); // 10%

    const totalScore = colorScore + styleScore + occasionScore + seasonScore + preferenceScore;

    return Math.round(Math.min(totalScore, 100));
};

import { UserEvent } from '@/packages/types/src/reco';

// Feature flag to enable/disable preference scoring
export const PREFERENCE_SCORING_ENABLED = true;
export const PREFERENCE_MAX_BOOST = 0.3; // 最多加 30%
export const PREFERENCE_DECAY_DAYS = 7; // 7 天內的事件有效

interface UserPreference {
  styles: Map<string, number>;
  colors: Map<string, number>;
  categories: Map<string, number>;
}

/**
 * Extract user preferences from event history
 */
export const extractPreferences = (events: UserEvent[]): UserPreference => {
  const pref: UserPreference = {
    styles: new Map(),
    colors: new Map(),
    categories: new Map(),
  };

  const now = Date.now();
  const cutoffTime = now - PREFERENCE_DECAY_DAYS * 24 * 60 * 60 * 1000;

  events.forEach(event => {
    const eventTime = new Date(event.timestamp).getTime();
    if (eventTime < cutoffTime) return; // 過濾舊事件

    // 計算時間衰減權重 (1.0 for today, 0.5 for 7 days ago)
    const age = (now - eventTime) / (PREFERENCE_DECAY_DAYS * 24 * 60 * 60 * 1000);
    const weight = Math.max(0, 1 - age);

    // 根據事件類型給予不同權重
    let eventWeight = 1;
    if (event.eventType === 'SAVED_OUTFIT') eventWeight = 3;
    if (event.eventType === 'ADD_TO_CART') eventWeight = 2;
    if (event.eventType === 'LIKED_ITEM') eventWeight = 1.5;

    const finalWeight = weight * eventWeight;

    // 提取偏好特徵（假設 payload 包含 style, color, category）
    const { style, color, category } = event.payload as any;
    if (style) pref.styles.set(style, (pref.styles.get(style) || 0) + finalWeight);
    if (color) pref.colors.set(color, (pref.colors.get(color) || 0) + finalWeight);
    if (category) pref.categories.set(category, (pref.categories.get(category) || 0) + finalWeight);
  });

  return pref;
};

/**
 * Apply preference boost to item score
 */
export const applyPreferenceBoost = (
  baseScore: number,
  item: WardrobeItem,
  userPreferences: UserPreference
): number => {
  if (!PREFERENCE_SCORING_ENABLED) return baseScore;

  let boost = 0;

  // Style match boost
  if (item.style && userPreferences.styles.has(item.style)) {
    boost += userPreferences.styles.get(item.style)! * 0.1;
  }

  // 確保 boost 不超過上限
  boost = Math.min(boost, PREFERENCE_MAX_BOOST);

  return baseScore * (1 + boost);
};