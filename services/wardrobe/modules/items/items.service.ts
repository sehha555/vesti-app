
import { Injectable } from '@nestjs/common';
import { WardrobeItem, Style, Occasion, CreateWardrobeItemDto } from '@/packages/types/src/wardrobe';
import { VQA_OUTFIT_KEYWORDS_PROMPT } from '@/packages/prompts/src/vqa-prompts';

@Injectable()
export class ItemsService {
  private async getVqaTags(imageUrl: string): Promise<string[]> {
    // In a real implementation, this would call a VQA service.
    // For this example, we'll just return some dummy tags.
    console.log(VQA_OUTFIT_KEYWORDS_PROMPT(imageUrl));
    return ['dummy-tag', 'generated-tag'];
  }

  async create(userId: string, dto: CreateWardrobeItemDto): Promise<WardrobeItem> {
    // This is a placeholder. In a real implementation, this would save to a database.
    const customTags = await this.getVqaTags(dto.imageUrl);

    const newItem: WardrobeItem = {
      id: Math.random().toString(36).substring(2),
      userId: userId,
      name: dto.name,
      type: dto.type,
      imageUrl: dto.imageUrl,
      colors: dto.colors || [],
      season: dto.season || 'all-season',
      source: dto.source || 'upload',
      purchased: dto.purchased ?? false,
      createdAt: new Date(),
      style: dto.style,
      material: dto.material,
      pattern: dto.pattern,
      occasions: dto.occasions,
      customTags: customTags,
      originalImageUrl: dto.originalImageUrl,
    };
    return newItem;
  }

  async findAll(userId: string): Promise<WardrobeItem[]> {
    // Placeholder for fetching all items for a user
    return [
      { id: '1', userId, name: 'T-Shirt', type: 'top', style: Style.CASUAL, customTags: ['white'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'summer', occasions: [Occasion.CASUAL], source: 'upload', purchased: false },
      { id: '2', userId, name: 'Jeans', type: 'bottom', style: Style.CASUAL, customTags: ['blue'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'all-season', occasions: [Occasion.CASUAL], source: 'upload', purchased: false },
      { id: '3', userId, name: 'Sneakers', type: 'shoes', style: Style.CASUAL, customTags: ['white'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'all-season', occasions: [Occasion.CASUAL], source: 'upload', purchased: false },
      { id: '4', userId, name: 'Jacket', type: 'outerwear', style: Style.CASUAL, customTags: ['black'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'autumn', occasions: [Occasion.CASUAL], source: 'upload', purchased: false },
      { id: '5', userId, name: 'Dress Shirt', type: 'top', style: Style.FORMAL, customTags: ['blue'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'all-season', occasions: [Occasion.WORK, Occasion.FORMAL_EVENT], source: 'upload', purchased: false },
      { id: '6', userId, name: 'Slacks', type: 'bottom', style: Style.FORMAL, customTags: ['grey'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'all-season', occasions: [Occasion.WORK, Occasion.FORMAL_EVENT], source: 'upload', purchased: false },
      { id: '7', userId, name: 'Dress Shoes', type: 'shoes', style: Style.FORMAL, customTags: ['black'], imageUrl: '', colors: [], createdAt: new Date(), updatedAt: new Date(), season: 'all-season', occasions: [Occasion.WORK, Occasion.FORMAL_EVENT], source: 'upload', purchased: false },
    ];
  }
}
