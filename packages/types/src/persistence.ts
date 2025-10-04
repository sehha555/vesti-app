import { DailyOutfitRecommendation } from './daily';
import { BasketMixmatchRecommendation } from './basket';
import { GapSuggestion } from './gap';

export interface SaveDailyOutfitRequest {
  userId: string;
  recommendations: DailyOutfitRecommendation[];
  timestamp: Date;
}

export interface SaveBasketMixmatchRequest {
  userId: string;
  recommendations: BasketMixmatchRecommendation[];
  timestamp: Date;
}

export interface SaveGapFillRequest {
  userId: string;
  recommendations: GapSuggestion[];
  timestamp: Date;
}

export interface SaveRecommendationResponse {
  success: boolean;
  message?: string;
  savedId?: string; // 例如，儲存的批次 ID
}
