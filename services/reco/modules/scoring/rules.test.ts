
import { Style } from '@/packages/types/src/wardrobe';
import { scoreOccasion, scoreCompatibility } from '../../modules/scoring/rules';
import { WardrobeItem } from '@/packages/types/src/wardrobe';
import { OutfitCombination } from '@/packages/types/src/basket';


// Unit tests for scoring equivalence
describe('scoring rules', () => {
  const items: WardrobeItem[] = [
    { id: '1', name: 'Winter Coat', type: 'outerwear', style: Style.CASUAL, customTags: ['winter', 'warm', 'waterproof'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date(), userId: 'test' },
    { id: '2', name: 'Summer Dress', type: 'top', style: Style.CASUAL, customTags: ['summer', 'light'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date(), userId: 'test' },
  ];

  it('should return the same score for the same occasion', () => {
    const score1 = scoreOccasion(items[0], 'casual');
    const score2 = scoreOccasion(items[0], 'casual');
    expect(score1).toEqual(score2);
  });

  it('should return a compatibility score between 0 and 100', () => {
    const testTop: WardrobeItem = { id: '1', userId: 'test', name: 'T-shirt', type: 'top', style: Style.CASUAL, imageUrl: 'test.jpg', colors: ['white'], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date() };
    const testBottom: WardrobeItem = { id: '2', userId: 'test', name: 'Jeans', type: 'bottom', style: Style.CASUAL, imageUrl: 'test.jpg', colors: ['blue'], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date() };
    const testShoes: WardrobeItem = { id: '3', userId: 'test', name: 'Sneakers', type: 'shoes', style: Style.CASUAL, imageUrl: 'test.jpg', colors: ['white'], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date() };

    const testOutfit: OutfitCombination = {
      top: testTop,
      bottom: testBottom,
      shoes: testShoes
    };
    const score = scoreCompatibility(testOutfit);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});
