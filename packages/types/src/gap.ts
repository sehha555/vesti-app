import { Style, WardrobeItem } from './wardrobe';
import { OutfitCombination } from './basket';

export interface CatalogItem {
  id: string;
  name: string;
  category: 'top' | 'bottom' | 'shoes' | 'outerwear' | 'accessory';
  style: Style;
  imageUrl: string;
  price: number;
  seasonality?: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season';
}

export interface GapFillRequest {
  userId: string;
  occasion: string;
  minPrice?: number;
  maxPrice?: number;
  season?: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season';
}

export interface GapFillResponse {
  recommendations: GapSuggestion[];
}

export interface GapSuggestion {
  item: CatalogItem;
  reason: string;
  score: number;
  unlockCount: number;
  examplePairings: OutfitCombination[];
}
