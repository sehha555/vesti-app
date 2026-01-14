/**
 * Represents the layer/position of an item within an outfit.
 * Used to determine rendering order and visual hierarchy.
 */
export type OutfitItemLayer = 'top' | 'bottom' | 'outer' | 'accessory' | 'feet';

/**
 * Represents an individual item within an outfit.
 */
export interface OutfitItem {
  /**
   * Unique identifier for the outfit item entry.
   */
  id: string;

  /**
   * ID of the closet item (user-owned wardrobe item).
   * Note: Only closet_item_id is supported (catalog items not yet implemented).
   */
  closetItemId: string;

  /**
   * Order of this item within the outfit (1-indexed).
   * Used to determine visual stacking and render order.
   * @example 1 for top layer, 2 for middle, 3 for bottom
   */
  position: number;

  /**
   * Layer/category of this item (top, bottom, outer, accessory, feet).
   */
  layer: OutfitItemLayer;
}

/**
 * Main interface for an outfit, representing a collection of wardrobe items.
 * Outfits are now persisted to Supabase DB (table: public.outfits).
 */
export interface Outfit {
  /**
   * Unique identifier for the outfit (UUID, server-generated).
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  id: string;

  /**
   * Title/name of the outfit.
   * @example "週末約會穿搭"
   */
  title: string;

  /**
   * Optional notes or description for the outfit.
   * @example "輕鬆休閒風格，適合戶外活動。"
   */
  notes?: string | null;

  /**
   * Array of items that comprise this outfit.
   * Each item includes closetItemId, position, and layer information.
   * Must contain at least one item.
   */
  items: OutfitItem[];

  /**
   * The timestamp when the outfit was created (ISO string from server).
   */
  createdAt: string;

  /**
   * The timestamp when the outfit was last updated (ISO string from server).
   */
  updatedAt: string;

  /**
   * @deprecated userId is no longer returned in API responses.
   * User ID is enforced via RLS policies (server-side only).
   */
  userId?: never;
}

/**
 * Data Transfer Object for creating a new outfit.
 * Used in POST /api/outfits request body.
 * Note: userId is NOT included; it's extracted from server session.
 */
export interface CreateOutfitRequest {
  /**
   * Title/name of the outfit.
   */
  title: string;

  /**
   * Optional notes or description.
   */
  notes?: string;

  /**
   * Array of items to include in the outfit.
   * Each item must have closetItemId, position, and layer.
   * Min 1 item required.
   */
  items: Array<{
    closetItemId: string;
    position: number;
    layer: OutfitItemLayer;
  }>;
}

/**
 * Data Transfer Object for updating an existing outfit.
 * All fields are optional.
 */
export type UpdateOutfitDto = Partial<Omit<Outfit, 'id' | 'createdAt' | 'updatedAt'>>;