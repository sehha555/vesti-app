import { WardrobeItem } from './wardrobe';

export interface BasketMixmatchRequest {
  userId: string;
  basket: string[]; // list of item IDs
  page?: number; // for pagination, 1-indexed
  pageSize?: number; // for pagination
}

export interface BasketMixmatchResponse {
  recommendations: BasketMixmatchRecommendation[];
  totalRecommendations?: number; // Optional: total count before pagination
}

export interface BasketMixmatchRecommendation {
  outfit: {
    top: WardrobeItem;
    bottom: WardrobeItem;
    shoes: WardrobeItem;
    outerwear?: WardrobeItem;
  };
  reasons: string[];
  scores: {
    compatibility: number;
    rules: Record<string, number>;
    total: number;
  };
}

export type OutfitCombination = {
  top: WardrobeItem;
  bottom: WardrobeItem;
  shoes: WardrobeItem;
  outerwear?: WardrobeItem;
};
