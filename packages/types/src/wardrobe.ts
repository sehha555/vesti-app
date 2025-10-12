export enum Hue {
  RED = 'red',
  ORANGE = 'orange',
  YELLOW = 'yellow',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
  PINK = 'pink',
  BROWN = 'brown',
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
}

export enum Brightness {
  DARK = 'dark',
  MEDIUM = 'medium',
  LIGHT = 'light',
}

export enum Chroma {
  NEUTRAL = 'neutral',
  PASTEL = 'pastel',
  VIBRANT = 'vibrant',
}

export enum Pattern {
  SOLID = 'solid',
  STRIPES = 'stripes',
  CHECKS = 'checks',
  DOTS = 'dots',
  FLORAL = 'floral',
  GRAPHIC = 'graphic',
  ANIMAL = 'animal',
}

export enum Material {
  COTTON = 'cotton',
  DENIM = 'denim',
  WOOL = 'wool',
  LEATHER = 'leather',
  SYNTHETIC = 'synthetic',
}

export enum Style {
  CASUAL = 'casual',
  FORMAL = 'formal',
  SPORTY = 'sporty',
  BOHO = 'boho',
  VINTAGE = 'vintage',
  MINIMALIST = 'minimalist',
}

export enum AgeRange {
  YOUTH = 'youth',
  YOUNG_ADULT = 'young_adult',
  ADULT = 'adult',
  SENIOR = 'senior',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  UNISEX = 'unisex',
}

export enum Occasion {
    WORK = 'work',
    DATE = 'date',
    CASUAL = 'casual',
    SPORTS = 'sports',
    FORMAL_EVENT = 'formal-event',
    PARTY = 'party',
    TRAVEL = 'travel',
    HOME = 'home',
    DAILY = 'daily',
}

export type ClothingType = 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';
export type Season = 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season';
export type ClothingSource = 'shop' | 'upload';

export interface ImageFeatures {
  dominantColors: string[];
  style?: Style;
  pattern?: Pattern;
  material?: Material;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  type: ClothingType;
  imageUrl: string;
  /** URL of the original, unprocessed image */
  originalImageUrl?: string;

  // AI-identified attributes
  colors: string[];
  season: Season;
  /** AI-identified style */
  style?: Style;
  /** AI-identified material */
  material?: Material;
  /** AI-identified pattern */
  pattern?: Pattern;

  // Occasions for the item
  /** Array of suitable occasions for the item */
  occasions?: Occasion[];

  // Source tracking
  /** Where the item came from (e.g., purchased from a shop or uploaded by user) */
  source: ClothingSource;
  /** The ID of the product if it came from a shop */
  shopProductId?: string;

  // Personal categorization
  /** User-defined tags for custom categorization */
  customTags?: string[];
  purchased: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
}

// DTO for creating a new wardrobe item
export type CreateWardrobeItemDto = Omit<Partial<WardrobeItem>, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  name: string;
  type: ClothingType;
  imageUrl: string;
  colors: string[]; // Explicitly make colors required
  source?: ClothingSource; // Optional here, will be defaulted to 'upload' in the backend
};

export type UpdateWardrobeItemDto = Partial<CreateWardrobeItemDto> & {
  id: string;
};