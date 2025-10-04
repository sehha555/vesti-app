
import { Injectable } from '@nestjs/common';
import { WardrobeItem, Style } from '@/packages/types/src/wardrobe';
import { VQA_OUTFIT_KEYWORDS_PROMPT } from '@/packages/prompts/src/vqa-prompts';

@Injectable()
export class ItemsService {
  private async getVqaTags(imageUrl: string): Promise<string[]> {
    // In a real implementation, this would call a VQA service.
    // For this example, we'll just return some dummy tags.
    console.log(VQA_OUTFIT_KEYWORDS_PROMPT(imageUrl));
    return ['dummy-tag', 'generated-tag'];
  }

  async create(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt' | 'tags'>): Promise<WardrobeItem> {
    // This is a placeholder. In a real implementation, this would save to a database.
    const tags = await this.getVqaTags(item.imageUrl);

    const newItem: WardrobeItem = {
      id: Math.random().toString(36).substring(2),
      ...item,
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newItem;
  }

  async findAll(userId: string): Promise<WardrobeItem[]> {
    // Placeholder for fetching all items for a user
    return [
      { id: '1', userId, name: 'T-Shirt', category: 'top', style: Style.CASUAL, tags: ['white'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'summer', occasionSuitability: ['casual'] },
      { id: '2', userId, name: 'Jeans', category: 'bottom', style: Style.CASUAL, tags: ['blue'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'all-season', occasionSuitability: ['casual'] },
      { id: '3', userId, name: 'Sneakers', category: 'shoes', style: Style.CASUAL, tags: ['white'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'all-season', occasionSuitability: ['casual'] },
      { id: '4', userId, name: 'Jacket', category: 'outerwear', style: Style.CASUAL, tags: ['black'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'autumn', occasionSuitability: ['casual'] },
      { id: '5', userId, name: 'Dress Shirt', category: 'top', style: Style.FORMAL, tags: ['blue'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'all-season', occasionSuitability: ['work', 'formal'] },
      { id: '6', userId, name: 'Slacks', category: 'bottom', style: Style.FORMAL, tags: ['grey'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'all-season', occasionSuitability: ['work', 'formal'] },
      { id: '7', userId, name: 'Dress Shoes', category: 'shoes', style: Style.FORMAL, tags: ['black'], imageUrl: '', createdAt: new Date(), updatedAt: new Date(), seasonality: 'all-season', occasionSuitability: ['work', 'formal'] },
    ];
  }
}
