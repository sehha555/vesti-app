import { getCandidates, generateOutfitCombinations } from './simple';
import { WardrobeItem, Style } from '@/packages/types/src/wardrobe';

describe('simple retrieval', () => {
  it('should return a list of candidate items', async () => {
    const candidates = await getCandidates([], []);
    expect(candidates).toBeDefined();
    expect(Array.isArray(candidates)).toBe(true);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('should not return items that are in the basket', async () => {
    const candidates = await getCandidates([], ['1']);
    const ids = candidates.map(c => c.id);
    expect(ids).not.toContain('1');
  });

  it('should generate outfit combinations', () => {
    const items: WardrobeItem[] = [
      { id: '1', name: 'T-Shirt', category: 'top', style: Style.CASUAL, tags: [], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), userId: '1' },
      { id: '2', name: 'Jeans', category: 'bottom', style: Style.CASUAL, tags: [], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), userId: '1' },
      { id: '3', name: 'Sneakers', category: 'shoes', style: Style.CASUAL, tags: [], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), userId: '1' },
    ];
    const combinations = generateOutfitCombinations(items);
    expect(combinations).toHaveLength(1);
    expect(combinations[0].top.id).toBe('1');
    expect(combinations[0].bottom.id).toBe('2');
    expect(combinations[0].shoes.id).toBe('3');
  });
});
