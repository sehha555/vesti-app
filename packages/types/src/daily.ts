import { WardrobeItem } from './wardrobe';
import { WeatherSummary } from './weather';

export interface DailyOutfitRequest {
  userId: string;
  latitude: number;
  longitude: number;
  occasion: string; // e.g., 'casual', 'formal', 'work'
}

export interface DailyOutfitResponse {
  recommendations: DailyOutfitRecommendation[];
}

export interface DailyOutfitRecommendation {
  outfit: {
    top: WardrobeItem;
    bottom: WardrobeItem;
    shoes: WardrobeItem;
    outerwear?: WardrobeItem;
  };
  reasons: string[]; // e.g., "Good for current weather", "Matches your style"
  scores: {
    weatherFit: number;
    occasionMatch: number;
    compatibility: number;
    total: number;
  };
}
