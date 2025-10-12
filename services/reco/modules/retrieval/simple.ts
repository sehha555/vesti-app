import { OutfitCombination } from '@/packages/types/src/basket';
import { Style, WardrobeItem } from '@/packages/types/src/wardrobe';

const dummyWardrobe: WardrobeItem[] = [
  { id: '1', userId: '1', name: 'T-Shirt', type: 'top', style: Style.CASUAL, customTags: [], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId: '1', name: 'Jeans', type: 'bottom', style: Style.CASUAL, customTags: [], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', userId: '1', name: 'Sneakers', type: 'shoes', style: Style.CASUAL, customTags: [], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', userId: '1', name: 'Jacket', type: 'outerwear', style: Style.CASUAL, customTags: [], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '5', userId: '1', name: 'Summer Dress', type: 'top', style: Style.CASUAL, customTags: ['summer', 'light'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '6', userId: '1', name: 'Work Shirt', type: 'top', style: Style.FORMAL, customTags: [], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '7', userId: '1', name: 'Rain Boots', type: 'shoes', style: Style.CASUAL, customTags: ['waterproof'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '8', userId: '1', name: 'sandals', type: 'shoes', style: Style.CASUAL, customTags: ['summer'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '9', userId: '1', name: 'shorts', type: 'bottom', style: Style.CASUAL, customTags: ['summer'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
  { id: '10', userId: '1', name: 'blouse', type: 'top', style: Style.FORMAL, customTags: ['work'], imageUrl: '', colors: [], season: 'all-season', source: 'upload', purchased: false, createdAt: new Date(), updatedAt: new Date() },
];

export const getCandidates = async (itemIds: string[], basket: string[]): Promise<WardrobeItem[]> => {
  // In a real implementation, this would fetch items from a database
  // and find candidates based on the input items.
  // For now, we'll just return all items except the ones in the basket.
  return dummyWardrobe.filter(item => !basket.includes(item.id));
};


export const generateOutfitCombinations = (items: WardrobeItem[]): OutfitCombination[] => {
  const combinations: OutfitCombination[] = [];
  const itemsByType = items.reduce((acc, item) => {
    acc[item.type] = acc[item.type] || [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  const tops = itemsByType['top'] || [];
  const bottoms = itemsByType['bottom'] || [];
  const shoes = itemsByType['shoes'] || [];
  const outerwear = itemsByType['outerwear'] || [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      for (const shoe of shoes) {
        // Add with outerwear if available
        if (outerwear.length > 0) {
          for (const outer of outerwear) {
            combinations.push({ top, bottom, shoes: shoe, outerwear: outer });
          }
        }
        // Add without outerwear
        combinations.push({ top, bottom, shoes: shoe });
      }
    }
  }

  return combinations;
};
