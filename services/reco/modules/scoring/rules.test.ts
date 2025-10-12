
import { Style } from '@/packages/types/src/wardrobe';
import { scoreOccasion, scoreCompatibility } from '../../modules/scoring/rules';
import { WardrobeItem } from '@/packages/types/src/wardrobe';


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

  it('should return a compatibility score between 0 and 1', () => {
    const score = scoreCompatibility();
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});
