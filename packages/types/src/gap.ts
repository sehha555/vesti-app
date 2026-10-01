import { Style, WardrobeItem, ClothingType, Season } from './wardrobe';
import { OutfitCombination } from './basket';

export interface CatalogItem {
  id: string;
  name: string;
  type: ClothingType;
  style: Style;
  imageUrl: string;
  price: number;
  season?: Season;
  category?: string;
  seasonality?: string;
  /** 品牌 / 零售商商品頁（導購外連） */
  productUrl?: string;
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
