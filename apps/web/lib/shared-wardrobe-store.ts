import { randomUUID } from 'crypto';
import type { WardrobeItem, CreateWardrobeItemDto } from '../../../packages/types/src/wardrobe';

// In-memory storage for wardrobe items
export const inMemoryWardrobeItems = new Map<string, WardrobeItem>();

/**
 * DTO for updating a wardrobe item. Makes all properties optional except for id and userId.
 */
export type UpdateWardrobeItemDto = Partial<Omit<WardrobeItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Helper function to create a new item (optional, but good for consistency)
export function createWardrobeItem(userId: string, dto: CreateWardrobeItemDto): WardrobeItem {
  const id = randomUUID();
  const newItem: WardrobeItem = {
    id,
    userId,
    createdAt: new Date(),
    ...dto,
    colors: dto.colors || [],  // 🔥 如果 undefined 則使用空陣列
  };
  inMemoryWardrobeItems.set(id, newItem);
  return newItem;
}

/**
 * Updates an existing wardrobe item.
 * @param userId - The ID of the user who owns the item.
 * @param itemId - The ID of the item to update.
 * @param updatedData - An object containing the fields to update.
 * @returns The updated wardrobe item, or null if the item doesn't exist or doesn't belong to the user.
 */
export function updateItem(userId: string, itemId: string, updatedData: UpdateWardrobeItemDto): WardrobeItem | null {
  const existingItem = inMemoryWardrobeItems.get(itemId);

  if (!existingItem || existingItem.userId !== userId) {
    return null; // Item not found or user mismatch
  }

  const updatedItem: WardrobeItem = {
    ...existingItem,
    ...updatedData,
    id: existingItem.id, // Ensure ID is not changed
    userId: existingItem.userId, // Ensure userId is not changed
    updatedAt: new Date(), // Add/update the timestamp
  };

  inMemoryWardrobeItems.set(itemId, updatedItem);
  return updatedItem;
}

/**
 * Retrieves items for a user, filtered by a specific season.
 * Also includes items marked as 'all-season'.
 * @param userId - The ID of the user.
 * @param season - The season to filter by (e.g., 'summer', 'winter'). If omitted, all items for the user are returned.
 * @returns An array of wardrobe items matching the criteria.
 */
export function getItemsBySeason(userId: string, season?: 'spring' | 'summer' | 'autumn' | 'winter'): WardrobeItem[] {
  const userItems = Array.from(inMemoryWardrobeItems.values()).filter(
    (item) => item.userId === userId
  );

  if (!season) {
    return userItems; // No season specified, return all user's items
  }

  return userItems.filter(
    (item) => item.season === season || item.season === 'all-season'
  );
}

// --- Tag Management Functions ---

/**
 * Retrieves items for a user that include a specific tag.
 * @param userId - The ID of the user.
 * @param tag - The tag to filter by.
 * @returns An array of wardrobe items that have the specified tag.
 */
export function getItemsByTag(userId: string, tag: string): WardrobeItem[] {
  if (!tag) return [];
  const userItems = Array.from(inMemoryWardrobeItems.values()).filter(
    (item) => item.userId === userId
  );
  return userItems.filter((item) => item.customTags?.includes(tag));
}

/**
 * Retrieves all unique tags used by a specific user.
 * @param userId - The ID of the user.
 * @returns An array of unique tags.
 */
export function getUserTags(userId: string): string[] {
  const userItems = Array.from(inMemoryWardrobeItems.values()).filter(
    (item) => item.userId === userId
  );
  const allTags = userItems.flatMap((item) => item.customTags || []);
  return [...new Set(allTags)];
}

/**
 * Adds a tag to a specific wardrobe item.
 * @param userId - The ID of the user who owns the item.
 * @param itemId - The ID of the item to add the tag to.
 * @param tag - The tag to add.
 * @returns The updated wardrobe item, or null if not found.
 */
export function addTagToItem(userId: string, itemId: string, tag: string): WardrobeItem | null {
  const item = inMemoryWardrobeItems.get(itemId);
  if (!item || item.userId !== userId) return null;

  const customTags = item.customTags || [];
  if (customTags.includes(tag)) {
    return item; // Tag already exists, no changes needed
  }

  const updatedItem: WardrobeItem = {
    ...item,
    customTags: [...customTags, tag],
    updatedAt: new Date(),
  };

  inMemoryWardrobeItems.set(itemId, updatedItem);
  return updatedItem;
}

/**
 * Removes a tag from a specific wardrobe item.
 * @param userId - The ID of the user who owns the item.
 * @param itemId - The ID of the item to remove the tag from.
 * @param tag - The tag to remove.
 * @returns The updated wardrobe item, or null if not found.
 */
export function removeTagFromItem(userId: string, itemId: string, tag: string): WardrobeItem | null {
  const item = inMemoryWardrobeItems.get(itemId);
  if (!item || item.userId !== userId) return null;

  if (!item.customTags || !item.customTags.includes(tag)) {
    return item; // Tag doesn't exist, no changes needed
  }

  const updatedItem: WardrobeItem = {
    ...item,
    customTags: item.customTags.filter((t) => t !== tag),
    updatedAt: new Date(),
  };

  inMemoryWardrobeItems.set(itemId, updatedItem);
  return updatedItem;
}