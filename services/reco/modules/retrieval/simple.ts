import { OutfitCombination } from '@/packages/types/src/basket';
import { Style, WardrobeItem } from '@/packages/types/src/wardrobe';

const dummyWardrobe: WardrobeItem[] = [
  { id: '1', userId: '1', name: 'T-Shirt', category: 'top', style: Style.CASUAL, tags: ['white'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '2', userId: '1', name: 'Jeans', category: 'bottom', style: Style.CASUAL, tags: ['blue'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '3', userId: '1', name: 'Sneakers', category: 'shoes', style: Style.CASUAL, tags: ['white'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '4', userId: '1', name: 'Jacket', category: 'outerwear', style: Style.CASUAL, tags: ['black'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '5', userId: '1', name: 'Summer Dress', category: 'top', style: Style.CASUAL, tags: ['summer', 'light'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '6', userId: '1', name: 'Work Shirt', category: 'top', style: Style.FORMAL, tags: [], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '7', userId: '1', name: 'Rain Boots', category: 'shoes', style: Style.CASUAL, tags: ['waterproof'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '8', userId: '1', name: 'sandals', category: 'shoes', style: Style.CASUAL, tags: ['summer'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '9', userId: '1', name: 'shorts', category: 'bottom', style: Style.CASUAL, tags: ['summer'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
  { id: '10', userId: '1', name: 'blouse', category: 'top', style: Style.FORMAL, tags: ['work'], imageUrl: '', createdAt: new Date(), updatedAt: new Date() },
];

export const getCandidates = async (itemIds: string[], basket: string[]): Promise<WardrobeItem[]> => {
  // In a real implementation, this would fetch items from a database
  // and find candidates based on the input items.
  // For now, we'll just return all items except the ones in the basket.
  return dummyWardrobe.filter(item => !basket.includes(item.id));
};


export const generateOutfitCombinations = (items: WardrobeItem[]): OutfitCombination[] => {
  const combinations: OutfitCombination[] = [];
  const itemsByCategory = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, WardrobeItem[]>);

  const tops = itemsByCategory['top'] || [];
  const bottoms = itemsByCategory['bottom'] || [];
  const shoes = itemsByCategory['shoes'] || [];
  const outerwear = itemsByCategory['outerwear'] || [];

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
