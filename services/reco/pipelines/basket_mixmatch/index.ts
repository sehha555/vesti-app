import { Injectable } from '@nestjs/common';
import { BasketMixmatchResponse, BasketMixmatchRecommendation, OutfitCombination } from '@/packages/types/src/basket';
import { getCandidates, generateOutfitCombinations } from '../../modules/retrieval/simple';
import { scoreCompatibility, scoreOccasion } from '../../modules/scoring/rules';
import { LRUCache } from '../../modules/retrieval/lruCache';
import { WardrobeItem } from '@/packages/types/src/wardrobe';

const candidateCache = new LRUCache<string, WardrobeItem[]>(100); // 快取 100 個候選結果

@Injectable()
export class BasketMixmatchService {
  async generate(userId: string, basket: string[], page: number = 1, pageSize: number = 5): Promise<BasketMixmatchResponse> {
    const cacheKey = `candidates-${userId}-${basket.sort().join('-')}`;
    let candidates = candidateCache.get(cacheKey);

    if (!candidates) {
      candidates = await getCandidates(basket, basket);
      candidateCache.put(cacheKey, candidates);
    }
    
    const allCombinations = generateOutfitCombinations(candidates);

    // 去重：基於商品組合的唯一性
    const uniqueCombinations = new Map<string, OutfitCombination>();
    for (const combo of allCombinations) {
      const key = [combo.top.id, combo.bottom.id, combo.shoes.id, combo.outerwear?.id].filter(Boolean).sort().join('-');
      if (!uniqueCombinations.has(key)) {
        uniqueCombinations.set(key, combo);
      }
    }

    const combinations = Array.from(uniqueCombinations.values());

    const recommendations: BasketMixmatchRecommendation[] = combinations.map(outfit => {
      const compatibility = scoreCompatibility();
      const occasion = scoreOccasion(outfit.top, 'casual');
      const rules = { occasion };
      const total = compatibility + occasion;

      return {
        outfit,
        reasons: ['This is a great outfit for a casual day'],
        scores: {
          compatibility,
          rules,
          total,
        },
      };
    });

    recommendations.sort((a, b) => b.scores.total - a.scores.total);

    // 分頁邏輯
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecommendations = recommendations.slice(startIndex, endIndex);

    return {
      recommendations: paginatedRecommendations,
      totalRecommendations: recommendations.length,
    };
  }
}
