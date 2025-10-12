import crypto from 'crypto';
import { WardrobeItem, CreateWardrobeItemDto, Season, ClothingSource } from '../../packages/types/src/wardrobe';
import { WardrobePersistence } './persistence';

/**
 * WardrobeService 負責管理虛擬衣櫃中的衣物。
 * It uses an in-memory Map for fast access and a persistence layer to save data.
 */
export class WardrobeService {
  private items: Map<string, WardrobeItem> = new Map();
  private persistence: WardrobePersistence;

  /**
   * @param persistence - An instance of WardrobePersistence for data storage.
   */
  constructor(persistence: WardrobePersistence) {
    this.persistence = persistence;
  }

  /**
   * Initializes the service by loading items from the persistence layer.
   */
  async initialize(): Promise<void> {
    const loadedItems = await this.persistence.loadItems();
    this.items = new Map(loadedItems.map(item => {
      if (typeof item.createdAt === 'string') {
        item.createdAt = new Date(item.createdAt);
      }
      return [item.id, item];
    }));
  }

  /**
   * Persists the current state of the items map to the storage.
   */
  private async persist(): Promise<void> {
    await this.persistence.saveItems(Array.from(this.items.values()));
  }

  /**
   * 新增一件衣物到使用者的衣櫃並保存。
   * @param userId - 使用者 ID
   * @param dto - 建立衣物的資料傳輸物件
   * @returns {Promise<WardrobeItem>} 新建立的衣物物件
   */
  async createItem(userId: string, dto: Omit<CreateWardrobeItemDto, 'userId'>): Promise<WardrobeItem> {
    const id = crypto.randomUUID();
    const newItem: WardrobeItem = {
      id,
      userId,
      name: dto.name,
      type: dto.type,
      imageUrl: dto.imageUrl,
      colors: dto.colors || [],
      season: (dto.season || 'all-season') as Season,
      source: (dto.source || 'upload') as ClothingSource,
      purchased: dto.purchased ?? false,
      createdAt: new Date(),
      style: dto.style,
      material: dto.material,
      pattern: dto.pattern,
      occasions: dto.occasions,
      customTags: dto.customTags,
      originalImageUrl: dto.originalImageUrl,
    };
    this.items.set(id, newItem);
    await this.persist();
    return newItem;
  }

  /**
   * 查詢指定使用者 ID 的所有衣物。
   * @param userId - 使用者 ID
   * @returns {WardrobeItem[]} 該使用者的所有衣物陣列
   */
  getItems(userId: string): WardrobeItem[] {
    return Array.from(this.items.values()).filter(item => item.userId === userId);
  }

  /**
   * 根據衣物 ID 查詢單一衣物。
   * @param itemId - 衣物 ID
   * @returns {WardrobeItem | undefined} 找到的衣物物件，或 undefined
   */
  getItem(itemId: string): WardrobeItem | undefined {
    return this.items.get(itemId);
  }

  /**
   * 根據衣物 ID 刪除一件衣物並保存。
   * @param itemId - 要刪除的衣物 ID
   * @returns {Promise<boolean>} 如果成功刪除則返回 true，否則返回 false
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const result = this.items.delete(itemId);
    if (result) {
      await this.persist();
    }
    return result;
  }

  /**
   * 清空所有衣物資料（主要用於測試）。
   */
  async clearAll(): Promise<void> {
    this.items.clear();
    await this.persist();
  }
}

// Singleton factory to handle async initialization
async function createWardrobeService(): Promise<WardrobeService> {
  const persistence = new WardrobePersistence();
  const service = new WardrobeService(persistence);
  await service.initialize();
  return service;
}

// Export a promise that resolves to the initialized service instance
export const wardrobeServicePromise = createWardrobeService();