import { Injectable } from '@nestjs/common';
import { Style, ClothingType, Season } from '@/packages/types/src/wardrobe';
import type { CatalogItem } from '@/packages/types/src/gap'; // Add this import

export interface CatalogFilter {
  type?: ClothingType;
  style?: Style;
  minPrice?: number;
  maxPrice?: number;
  season?: Season;
}

@Injectable()
export class CatalogService {
  private readonly dummyCatalog: CatalogItem[] = [
    { id: '101', name: 'Classic White Sneakers', type: 'shoes', style: Style.CASUAL, imageUrl: '', price: 80, season: 'all-season' },
    { id: '102', name: 'Black Leather Loafers', type: 'shoes', style: Style.FORMAL, imageUrl: '', price: 120, season: 'all-season' },
    { id: '103', name: 'Blue Denim Jacket', type: 'outerwear', style: Style.CASUAL, imageUrl: '', price: 90, season: 'autumn' },
    { id: '104', name: 'Khaki Shorts', type: 'bottom', style: Style.CASUAL, imageUrl: '', price: 40, season: 'summer' },
    { id: '105', name: 'Wool Scarf', type: 'accessory', style: Style.CASUAL, imageUrl: '', price: 30, season: 'winter' },
    { id: '106', name: 'Summer Sandals', type: 'shoes', style: Style.CASUAL, imageUrl: '', price: 50, season: 'summer' },
  ];

  async search(filter: CatalogFilter): Promise<CatalogItem[]> {
    return this.dummyCatalog.filter(item => {
      if (filter.type && item.type !== filter.type) {
        return false;
      }
      if (filter.style && item.style !== filter.style) {
        return false;
      }
      if (filter.minPrice !== undefined && item.price < filter.minPrice) {
        return false;
      }
      if (filter.maxPrice !== undefined && item.price > filter.maxPrice) {
        return false;
      }
      if (filter.season && item.season !== filter.season && item.season !== 'all-season') {
        return false;
      }
      return true;
    });
  }
}
