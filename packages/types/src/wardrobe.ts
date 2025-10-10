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
  DAILY = 'daily',
  WORK = 'work',
  EVENING = 'evening',
  SPORT = 'sport',
  PARTY = 'party',
}

export interface ImageFeatures {
  hue: Hue;
  brightness: Brightness;
  chroma: Chroma;
  pattern: Pattern;
  style: Style;
  material: Material;
  age_range: AgeRange;
  gender: Gender;
  occasion: Occasion;
}

// 根據需求更新的 WardrobeItem 介面
export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  type: 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';
  imageUrl: string;
  colors: string[];
  season: 'summer' | 'winter' | 'spring' | 'autumn' | 'all-season';
  purchased: boolean;
  /** User-defined tags for custom categorization */
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
}

// 用於創建新衣物的 DTO (Data Transfer Object)
export type CreateWardrobeItemDto = Omit<WardrobeItem, 'id' | 'createdAt'>;