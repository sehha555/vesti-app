import { Injectable } from '@nestjs/common';
import { GapFillResponse, GapSuggestion, CatalogItem } from '@/packages/types/src/gap';
import { WardrobeItem, Style } from '@/packages/types/src/wardrobe';
import { CatalogService, CatalogFilter } from '../../../catalog';
import { generateOutfitCombinations } from '../../modules/retrieval/simple';
import { LRUCache } from '../../modules/retrieval/lruCache';

// Placeholder for fetching user's wardrobe
const getWardrobe = async (userId: string): Promise<WardrobeItem[]> => [
  { id: '1', userId, name: 'T-Shirt', category: 'top', style: Style.CASUAL, tags: ['white'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId, name: 'Jeans', category: 'bottom', style: Style.CASUAL, tags: ['blue'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
];

const catalogSearchCache = new LRUCache<string, CatalogItem[]>(100); // 快取 100 個目錄搜尋結果

@Injectable()
export class ClosetGapFillService {
  private readonly catalogService = new CatalogService();

  async generate(userId: string, occasion: Style, minPrice?: number, maxPrice?: number, season?: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season'): Promise<GapFillResponse> {
    const wardrobe = await getWardrobe(userId);
    const wardrobeByOccasion = wardrobe.filter(item => item.style === occasion);

    const requiredCategories = ['top', 'bottom', 'shoes'];
    const missingCategories = requiredCategories.filter(category => 
      !wardrobeByOccasion.some(item => item.category === category)
    );

    if (missingCategories.length === 0) {
      return { recommendations: [] };
    }

    const recommendations: GapSuggestion[] = [];

    for (const category of missingCategories) {
      const filter: CatalogFilter = { style: occasion, category, minPrice, maxPrice, season };
      const cacheKey = `catalog-search-${JSON.stringify(filter)}`;
      let candidates = catalogSearchCache.get(cacheKey);

      if (!candidates) {
        candidates = await this.catalogService.search(filter);
        catalogSearchCache.put(cacheKey, candidates);
      }
      
      if (!candidates) { // 處理快取返回 undefined 的情況
        continue;
      }

      const categoryRecommendations = candidates.map((candidate: CatalogItem) => {
        // 將 CatalogItem 轉換為 WardrobeItem，明確選擇屬性
        const candidateAsWardrobeItem: WardrobeItem = {
          id: candidate.id,
          userId: userId, // 假設推薦的商品屬於當前使用者
          name: candidate.name,
          category: candidate.category,
          style: candidate.style,
          tags: [], // 佔位符
          imageUrl: candidate.imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
          seasonality: candidate.seasonality,
        };
        const newWardrobe = [...wardrobe, candidateAsWardrobeItem];
        const combinations = generateOutfitCombinations(newWardrobe);
        const unlockCount = combinations.length - generateOutfitCombinations(wardrobe).length;

        return {
          item: candidate,
          reason: `You need a ${candidate.category} for your ${occasion} outfits.`,
          score: unlockCount, // Use unlockCount as a score
          unlockCount,
          examplePairings: combinations.slice(0, 3),
        };
      });
      recommendations.push(...categoryRecommendations);
    }

    recommendations.sort((a: GapSuggestion, b: GapSuggestion) => b.score - a.score);

    return { recommendations: recommendations.slice(0, 5) };
  }
}
