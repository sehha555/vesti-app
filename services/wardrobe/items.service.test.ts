import { WardrobeService } from './items.service';
import { CreateWardrobeItemDto } from '../../packages/types/src/wardrobe';

describe('WardrobeService', () => {
  let service: WardrobeService;
  const userId = 'user-123';

  beforeEach(() => {
    service = new WardrobeService();
    service.clearAll(); // 確保每個測試案例開始前都是乾淨的狀態
  });

  it('should create an item', () => {
    const newItemDto: Omit<CreateWardrobeItemDto, 'userId'> = {
      name: 'Blue T-shirt',
      type: 'top',
      imageUrl: 'http://example.com/t-shirt.jpg',
      colors: ['blue', 'white'],
      season: 'summer',
      purchased: true,
    };

    const createdItem = service.createItem(userId, newItemDto);

    expect(createdItem.id).toBeDefined();
    expect(createdItem.userId).toBe(userId);
    expect(createdItem.name).toBe('Blue T-shirt');
    expect(createdItem.createdAt).toBeInstanceOf(Date);
  });

  it('should get items for a user', () => {
    service.createItem(userId, { name: 'Item 1', type: 'top', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    service.createItem(userId, { name: 'Item 2', type: 'bottom', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    service.createItem('another-user', { name: 'Item 3', type: 'shoes', imageUrl: '', colors: [], season: 'all-season', purchased: false });

    const items = service.getItems(userId);
    expect(items.length).toBe(2);
    expect(items[0].name).toBe('Item 1');
    expect(items[1].name).toBe('Item 2');
  });

  it('should get a single item by ID', () => {
    const newItem = service.createItem(userId, { name: 'Find Me', type: 'accessory', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    const foundItem = service.getItem(newItem.id);

    expect(foundItem).toBeDefined();
    expect(foundItem?.id).toBe(newItem.id);
    expect(foundItem?.name).toBe('Find Me');
  });

  it('should return undefined for a non-existent item ID', () => {
    const foundItem = service.getItem('non-existent-id');
    expect(foundItem).toBeUndefined();
  });

  it('should delete an item', () => {
    const newItem = service.createItem(userId, { name: 'Delete Me', type: 'top', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    
    const wasDeleted = service.deleteItem(newItem.id);
    expect(wasDeleted).toBe(true);

    const foundItem = service.getItem(newItem.id);
    expect(foundItem).toBeUndefined();
  });

  it('should return false when trying to delete a non-existent item', () => {
    const wasDeleted = service.deleteItem('non-existent-id');
    expect(wasDeleted).toBe(false);
  });

  it('should clear all items', () => {
    service.createItem(userId, { name: 'Item 1', type: 'top', imageUrl: '', colors: [], season: 'all-season', purchased: false });
    service.createItem('another-user', { name: 'Item 2', type: 'bottom', imageUrl: '', colors: [], season: 'all-season', purchased: false });

    service.clearAll();
    const items = service.getItems(userId);
    const anotherUserItems = service.getItems('another-user');

    expect(items.length).toBe(0);
    expect(anotherUserItems.length).toBe(0);
  });
});