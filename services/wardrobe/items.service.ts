import crypto from 'crypto';
import { WardrobeItem, CreateWardrobeItemDto } from '../../packages/types/src/wardrobe';

/**
 * WardrobeService 負責管理虛擬衣櫃中的衣物。
 * 使用一個簡單的 in-memory Map 來儲存資料。
 */
export class WardrobeService {
  private items: Map<string, WardrobeItem> = new Map();

  /**
   * 新增一件衣物到使用者的衣櫃。
   * @param userId - 使用者 ID
   * @param dto - 建立衣物的資料傳輸物件
   * @returns {WardrobeItem} 新建立的衣物物件
   */
  createItem(userId: string, dto: Omit<CreateWardrobeItemDto, 'userId'>): WardrobeItem {
    const id = crypto.randomUUID();
    const newItem: WardrobeItem = {
      id,
      userId,
      ...dto,
      purchased: dto.purchased ?? false,
      createdAt: new Date(),
    };
    this.items.set(id, newItem);
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
   * 根據衣物 ID 刪除一件衣物。
   * @param itemId - 要刪除的衣物 ID
   * @returns {boolean} 如果成功刪除則返回 true，否則返回 false
   */
  deleteItem(itemId: string): boolean {
    return this.items.delete(itemId);
  }

  /**
   * 清空所有衣物資料（主要用於測試）。
   */
  clearAll(): void {
    this.items.clear();
  }
}

// 匯出一個單例 (singleton) 實例，方便在不同地方共用
export const wardrobeService = new WardrobeService();