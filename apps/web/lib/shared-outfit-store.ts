import { randomUUID } from 'crypto';
import type { Outfit, CreateOutfitDto, UpdateOutfitDto, OutfitSeason } from '../../../packages/types/src/outfit';

/**
 * In-memory storage for outfits, using a Map for efficient lookups.
 */
export const inMemoryOutfits = new Map<string, Outfit>();

// --- Core CRUD Functions ---

/**
 * Creates a new outfit and stores it in memory.
 * @param userId - The ID of the user creating the outfit.
 * @param dto - The data transfer object containing outfit details.
 * @returns The newly created outfit.
 * @throws An error if itemIds is empty.
 */
export function createOutfit(userId: string, dto: CreateOutfitDto): Outfit {
  if (!dto.itemIds || dto.itemIds.length === 0) {
    throw new Error('An outfit must contain at least one item.');
  }

  const newOutfit: Outfit = {
    ...dto,
    id: randomUUID(),
    userId,
    source: 'user', // Default source
    createdAt: new Date(),
  };

  inMemoryOutfits.set(newOutfit.id, newOutfit);
  return newOutfit;
}

/**
 * Retrieves all outfits for a specific user, sorted by creation date (newest first).
 * @param userId - The ID of the user.
 * @returns An array of outfits.
 */
export function getAllOutfits(userId: string): Outfit[] {
  return Array.from(inMemoryOutfits.values())
    .filter((outfit) => outfit.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

/**
 * Retrieves a single outfit by its ID, verifying user ownership.
 * @param userId - The ID of the user.
 * @param outfitId - The ID of the outfit to retrieve.
 * @returns The outfit object, or null if not found or user does not match.
 */
export function getOutfitById(userId: string, outfitId: string): Outfit | null {
  const outfit = inMemoryOutfits.get(outfitId);
  if (!outfit || outfit.userId !== userId) {
    return null;
  }
  return outfit;
}

/**
 * Updates an existing outfit.
 * @param userId - The ID of the user.
 * @param outfitId - The ID of the outfit to update.
 * @param updates - An object with the fields to update.
 * @returns The updated outfit, or null if not found.
 */
export function updateOutfit(userId: string, outfitId: string, updates: UpdateOutfitDto): Outfit | null {
  const existingOutfit = getOutfitById(userId, outfitId);
  if (!existingOutfit) {
    return null;
  }

  const updatedOutfit: Outfit = {
    ...existingOutfit,
    ...updates,
    updatedAt: new Date(),
  };

  inMemoryOutfits.set(outfitId, updatedOutfit);
  return updatedOutfit;
}

/**
 * Deletes an outfit.
 * @param userId - The ID of the user.
 * @param outfitId - The ID of the outfit to delete.
 * @returns True if deletion was successful, false otherwise.
 */
export function deleteOutfit(userId: string, outfitId: string): boolean {
  if (!getOutfitById(userId, outfitId)) {
    return false; // Ensures user owns the outfit before deleting
  }
  return inMemoryOutfits.delete(outfitId);
}

// --- Advanced Query Functions ---

/**
 * Finds outfits for a user that are associated with a specific tag.
 * @param userId - The ID of the user.
 * @param tag - The tag to filter by.
 * @returns An array of matching outfits.
 */
export function getOutfitsByTag(userId: string, tag: string): Outfit[] {
  if (!tag) return [];
  const userOutfits = getAllOutfits(userId);
  return userOutfits.filter((outfit) => outfit.tags?.includes(tag));
}

/**
 * Finds outfits for a user that are suitable for a specific season.
 * @param userId - The ID of the user.
 * @param season - The season to filter by.
 * @returns An array of matching outfits.
 */
export function getOutfitsBySeason(userId: string, season: OutfitSeason): Outfit[] {
  if (!season) return [];
  const userOutfits = getAllOutfits(userId);
  return userOutfits.filter((outfit) => outfit.season === season);
}

/**
 * Finds outfits for a user that are suitable for a specific occasion.
 * @param userId - The ID of the user.
 * @param occasion - The occasion to filter by.
 * @returns An array of matching outfits.
 */
export function getOutfitsByOccasion(userId: string, occasion: string): Outfit[] {
  if (!occasion) return [];
  const userOutfits = getAllOutfits(userId);
  return userOutfits.filter((outfit) => outfit.occasion === occasion);
}
