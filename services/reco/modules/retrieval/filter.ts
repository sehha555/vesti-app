import { CatalogItem } from '@/packages/types/src/gap';

export const filterBySeason = (items: CatalogItem[], season: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season'): CatalogItem[] => {
  if (!season) return items;
  return items.filter(item => item.season === season || item.season === 'all-season');
};

export const filterByPrice = (items: CatalogItem[], minPrice?: number, maxPrice?: number): CatalogItem[] => {
  return items.filter(item => {
    if (minPrice !== undefined && item.price < minPrice) {
      return false;
    }
    if (maxPrice !== undefined && item.price > maxPrice) {
      return false;
    }
    return true;
  });
};

export const filterByOccasion = (items: CatalogItem[], occasion: string): CatalogItem[] => {
  return items.filter(item => item.style === occasion);
};
