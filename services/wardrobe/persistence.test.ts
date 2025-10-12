import * as fs from 'fs/promises';
import path from 'path';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { WardrobePersistence } from './persistence';
import { WardrobeItem } from '../../packages/types/src/wardrobe';

// Mock the fs/promises module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  readFile: vi.fn(),
}));

const TEST_DATA_DIR = path.join(process.cwd(), 'data');
const TEST_FILE_PATH = path.join(TEST_DATA_DIR, 'wardrobe-items.json');

describe('WardrobePersistence', () => {
  let persistence: WardrobePersistence;

  beforeEach(() => {
    persistence = new WardrobePersistence();
    vi.resetAllMocks(); // Reset mocks before each test
  });

  const mockItems: WardrobeItem[] = [
    { id: '1', userId: 'user1', name: 'T-shirt', type: 'top', imageUrl: '', colors: ['red'], season: 'summer', purchased: false, createdAt: new Date(), source: 'upload' },
    { id: '2', userId: 'user1', name: 'Jeans', type: 'bottom', imageUrl: '', colors: ['blue'], season: 'all-season', purchased: true, createdAt: new Date(), source: 'upload' },
  ];

  describe('saveItems', () => {
    it('should create directory and write items to a file', async () => {
      const itemsToSave = mockItems;
      const expectedJson = JSON.stringify(itemsToSave, null, 2);

      await persistence.saveItems(itemsToSave);

      expect(fs.mkdir).toHaveBeenCalledWith(TEST_DATA_DIR, { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(TEST_FILE_PATH, expectedJson, 'utf-8');
    });

    it('should throw a clear error on write failure', async () => {
      const writeError = new Error('Disk full');
      (fs.writeFile as Mock).mockRejectedValue(writeError);

      await expect(persistence.saveItems(mockItems)).rejects.toThrow('Failed to save wardrobe items to file.');
    });
  });

  describe('loadItems', () => {
    it('should load and parse items from a file', async () => {
      const fileContent = JSON.stringify(mockItems);
      (fs.readFile as Mock).mockResolvedValue(fileContent);

      const loadedItems = await persistence.loadItems();

      expect(fs.readFile).toHaveBeenCalledWith(TEST_FILE_PATH, 'utf-8');
      // Dates will be strings after JSON parsing, so we compare a simplified version
      // We need to ensure that the source field is also present in the loaded items
      expect(JSON.stringify(loadedItems)).toEqual(JSON.stringify(mockItems));
    });

    it('should return an empty array if the file does not exist', async () => {
      const notFoundError = new Error('File not found');
      (notFoundError as any).code = 'ENOENT';
      (fs.readFile as Mock).mockRejectedValue(notFoundError);

      const loadedItems = await persistence.loadItems();

      expect(loadedItems).toEqual([]);
    });

    it('should return an empty array if the file is empty', async () => {
        (fs.readFile as Mock).mockResolvedValue('');
  
        const loadedItems = await persistence.loadItems();
  
        expect(loadedItems).toEqual([]);
      });

    it('should throw a clear error on read failure (other than ENOENT)', async () => {
      const readError = new Error('Permission denied');
      (fs.readFile as Mock).mockRejectedValue(readError);

      await expect(persistence.loadItems()).rejects.toThrow('Failed to load wardrobe items from file.');
    });
  });
});
