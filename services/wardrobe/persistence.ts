import * as fs from 'fs/promises';
import path from 'path';
import { WardrobeItem } from '../../packages/types/src/wardrobe';

const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_FILE_NAME = 'wardrobe-items.json';

/**
 * Manages persistence of wardrobe items to a JSON file.
 */
export class WardrobePersistence {
  private filePath: string;
  private dataDir: string;

  constructor(filePath?: string) {
    if (filePath) {
      this.filePath = filePath;
      this.dataDir = path.dirname(filePath);
    } else {
      this.dataDir = DEFAULT_DATA_DIR;
      this.filePath = path.join(this.dataDir, DEFAULT_FILE_NAME);
    }
  }

  /**
   * Saves an array of wardrobe items to the JSON file.
   * It creates the data directory if it doesn't exist.
   * @param {WardrobeItem[]} items - The array of items to save.
   */
  async saveItems(items: WardrobeItem[]): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(items, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error saving wardrobe items:', error);
      throw new Error('Failed to save wardrobe items to file.');
    }
  }

  /**
   * Loads wardrobe items from the JSON file.
   * If the file doesn't exist, it returns an empty array.
   * @returns {Promise<WardrobeItem[]>} A promise that resolves to the array of items.
   */
  async loadItems(): Promise<WardrobeItem[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      // JSON.parse can't handle empty string
      if (data) {
        return JSON.parse(data) as WardrobeItem[];
      }
      return [];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, which is a valid state for the first run.
        return [];
      }
      console.error('Error loading wardrobe items:', error);
      throw new Error('Failed to load wardrobe items from file.');
    }
  }
}
