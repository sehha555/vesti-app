import { randomUUID } from 'crypto';

// Simplified types for WardrobeItem and CreateWardrobeItemDto
export interface WardrobeItem {
  id: string;
  userId: string;
  name: string; // Example property
  createdAt: Date;
  // Add other properties as needed for your application
}

export interface CreateWardrobeItemDto {
  name: string; // Example property
  // Add other properties that can be created
}

// In-memory storage for wardrobe items
export const inMemoryWardrobeItems = new Map<string, WardrobeItem>();

// Helper function to create a new item (optional, but good for consistency)
export function createWardrobeItem(userId: string, dto: CreateWardrobeItemDto): WardrobeItem {
  const id = randomUUID();
  const newItem: WardrobeItem = {
    id,
    userId,
    name: dto.name,
    createdAt: new Date(),
  };
  inMemoryWardrobeItems.set(id, newItem);
  return newItem;
}
