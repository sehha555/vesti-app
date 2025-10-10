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
    ...dto,
    id,
    userId,
    createdAt: new Date(),
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