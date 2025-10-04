import { Injectable } from '@nestjs/common';
import { CatalogItem } from '@/packages/types/src/gap';
import { Style } from '@/packages/types/src/wardrobe';

export interface CatalogFilter {
  category?: string;
  style?: Style;
  minPrice?: number;
  maxPrice?: number;
  season?: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season';
}

@Injectable()
export class CatalogService {
  private readonly dummyCatalog: CatalogItem[] = [
    { id: '101', name: 'Classic White Sneakers', category: 'shoes', style: Style.CASUAL, imageUrl: '', price: 80, seasonality: 'all-season' },
    { id: '102', name: 'Black Leather Loafers', category: 'shoes', style: Style.FORMAL, imageUrl: '', price: 120, seasonality: 'all-season' },
    { id: '103', name: 'Blue Denim Jacket', category: 'outerwear', style: Style.CASUAL, imageUrl: '', price: 90, seasonality: 'autumn' },
    { id: '104', name: 'Khaki Shorts', category: 'bottom', style: Style.CASUAL, imageUrl: '', price: 40, seasonality: 'summer' },
    { id: '105', name: 'Wool Scarf', category: 'accessory', style: Style.CASUAL, imageUrl: '', price: 30, seasonality: 'winter' },
    { id: '106', name: 'Summer Sandals', category: 'shoes', style: Style.CASUAL, imageUrl: '', price: 50, seasonality: 'summer' },
  ];

  async search(filter: CatalogFilter): Promise<CatalogItem[]> {
    return this.dummyCatalog.filter(item => {
      if (filter.category && item.category !== filter.category) {
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
      if (filter.season && item.seasonality !== filter.season && item.seasonality !== 'all-season') {
        return false;
      }
      return true;
    });
  }
}
