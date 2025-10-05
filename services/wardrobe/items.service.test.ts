import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import * as fs from 'fs/promises';
import path from 'path';
import { WardrobeService } from './items.service';
import { CreateWardrobeItemDto, WardrobeItem } from '../../packages/types/src/wardrobe';
import { WardrobePersistence } from './persistence';

const TEST_DATA_DIR = path.join(__dirname, 'test-data');
const TEST_FILE_PATH = path.join(TEST_DATA_DIR, 'test-wardrobe-items.json');

describe('WardrobeService (Integration with Persistence)', () => {
  let service: WardrobeService;
  const userId = 'user-123';

  beforeEach(async () => {
    // 確保測試資料目錄存在
    await fs.mkdir(TEST_DATA_DIR, { recursive: true });
    // 清空測試檔案，確保每次測試都是乾淨的狀態
    await fs.writeFile(TEST_FILE_PATH, '[]', 'utf-8');

    // 使用真實的 WardrobePersistence 實例，並指定測試檔案路徑
    const persistence = new WardrobePersistence(TEST_FILE_PATH);
    service = new WardrobeService(persistence);
    await service.initialize();
  });

  afterAll(async () => {
    // 測試結束後刪除測試檔案和目錄
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  });

  it('should create an item and persist', async () => {
    const newItemDto: Omit<CreateWardrobeItemDto, 'userId'> = { name: 'Blue T-shirt', type: 'top', imageUrl: '', colors: [], season: 'summer', purchased: false };
    
    const createdItem = await service.createItem(userId, newItemDto);

    expect(createdItem.name).toBe('Blue T-shirt');
    // 驗證檔案內容是否包含新建立的項目
    const fileContent = await fs.readFile(TEST_FILE_PATH, 'utf-8');
    const itemsInFile = JSON.parse(fileContent);
    
    // 將 createdItem 的 createdAt 轉換為 ISO 字串格式進行比較
    const expectedItemInFile = { ...createdItem, createdAt: createdItem.createdAt.toISOString() };
    expect(itemsInFile).toEqual([expectedItemInFile]);
  });

  it('should delete an item and persist', async () => {
    // Setup: create an item first
    const createDto: Omit<CreateWardrobeItemDto, 'userId'> = { name: 'Delete Me', type: 'top', imageUrl: '', colors: [], season: 'summer', purchased: false };
    const createdItem = await service.createItem(userId, createDto);
    
    // Now, delete the item
    const wasDeleted = await service.deleteItem(createdItem.id);

    expect(wasDeleted).toBe(true);
    expect(service.getItem(createdItem.id)).toBeUndefined();
    // 驗證檔案內容是否為空
    const fileContent = await fs.readFile(TEST_FILE_PATH, 'utf-8');
    const itemsInFile = JSON.parse(fileContent);
    expect(itemsInFile).toEqual([]);
  });

  it('should initialize with data from persistence', async () => {
    const initialItems: WardrobeItem[] = [
        { id: 'loaded-1', userId: 'user-123', name: 'Loaded T-shirt', type: 'top', imageUrl: '', colors: ['red'], season: 'summer', purchased: false, createdAt: new Date() },
    ];
    // 將 initialItems 中的 createdAt 轉換為 ISO 字串格式，以便寫入檔案
    const itemsToWrite = initialItems.map(item => ({ ...item, createdAt: item.createdAt.toISOString() }));

    // 直接寫入初始資料到測試檔案
    await fs.writeFile(TEST_FILE_PATH, JSON.stringify(itemsToWrite, null, 2), 'utf-8');

    // 重新初始化服務以載入資料
    const persistence = new WardrobePersistence(TEST_FILE_PATH);
    const newService = new WardrobeService(persistence);
    await newService.initialize();

    const items = newService.getItems('user-123');
    expect(items.length).toBe(1);
    // 驗證從服務中取得的項目，其 createdAt 應該是 Date 物件
    expect(items[0].name).toBe('Loaded T-shirt');
    expect(items[0].createdAt).toBeInstanceOf(Date);
    expect(items[0].createdAt.toISOString()).toEqual(initialItems[0].createdAt.toISOString());
  });

  // Keep a simple synchronous test to ensure basic functionality isn't broken
  it('should return undefined for a non-existent item ID', () => {
    const foundItem = service.getItem('non-existent-id');
    expect(foundItem).toBeUndefined();
  });

  it('should get items for a user', async () => {
    // This test requires a more complex setup if we test the mocks rigorously,
    // but for now, let's ensure the get logic works after create.
    await service.createItem(userId, { name: 'Item 1', type: 'top', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    await service.createItem(userId, { name: 'Item 2', type: 'bottom', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    await service.createItem('another-user', { name: 'Item 3', type: 'shoes', imageUrl: '', colors: [], season: 'all-season', purchased: false });

    const items = service.getItems(userId);
    expect(items.length).toBe(2);
    expect(items[0].name).toBe('Item 1');
    expect(items[1].name).toBe('Item 2');
  });
});