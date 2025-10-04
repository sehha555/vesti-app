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

export const scoreCompatibility = (): number => {
  // Placeholder for color harmony, style consistency, and material seasonality
  return Math.random();
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