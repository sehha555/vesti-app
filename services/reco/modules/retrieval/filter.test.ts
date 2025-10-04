import { filterByPrice, filterBySeason } from './filter';
import { CatalogItem } from '@/packages/types/src/gap';
import { Style } from '@/packages/types/src/wardrobe';

describe('filter retrieval', () => {
  const items: CatalogItem[] = [
    { id: '1', name: 'T-Shirt', category: 'top', style: Style.CASUAL, imageUrl: '', price: 10, seasonality: 'summer' },
    { id: '2', name: 'Jeans', category: 'bottom', style: Style.CASUAL, imageUrl: '', price: 50, seasonality: 'all-season' },
    { id: '3', name: 'Sneakers', category: 'shoes', style: Style.CASUAL, imageUrl: '', price: 80, seasonality: 'all-season' },
    { id: '4', name: 'Wool Coat', category: 'outerwear', style: Style.FORMAL, imageUrl: '', price: 150, seasonality: 'winter' },
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
