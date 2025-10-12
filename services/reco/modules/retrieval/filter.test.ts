import { filterByPrice, filterBySeason } from './filter';
import { CatalogItem } from '@/packages/types/src/gap';
import { Style, ClothingType } from '@/packages/types/src/wardrobe';

describe('filter retrieval', () => {
  const items: CatalogItem[] = [
    { id: '1', name: 'T-Shirt', type: 'top' as ClothingType, style: Style.CASUAL, imageUrl: '', price: 10, season: 'summer' },
    { id: '2', name: 'Jeans', type: 'bottom' as ClothingType, style: Style.CASUAL, imageUrl: '', price: 50, season: 'all-season' },
    { id: '3', name: 'Sneakers', type: 'shoes' as ClothingType, style: Style.CASUAL, imageUrl: '', price: 80, season: 'all-season' },
    { id: '4', name: 'Wool Coat', type: 'outerwear' as ClothingType, style: Style.FORMAL, imageUrl: '', price: 150, season: 'winter' },
  ];

  it('should filter items by max price', () => {
    const filtered = filterByPrice(items, undefined, 40);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter items by min price', () => {
    const filtered = filterByPrice(items, 60, undefined);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('3');
  });

  it('should filter items by price range', () => {
    const filtered = filterByPrice(items, 40, 100);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe('2');
    expect(filtered[1].id).toBe('3');
  });

  it('should filter items by season', () => {
    const filtered = filterBySeason(items, 'summer');
    expect(filtered).toHaveLength(3);
    expect(filtered[0].id).toBe('1');
  });

  it('should return all-season items for any season filter', () => {
    const filtered = filterBySeason(items, 'winter');
    expect(filtered).toHaveLength(3);
  });
});
