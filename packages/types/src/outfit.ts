
import { WardrobeItem } from './wardrobe';

export interface DailyOutfit {
  date: Date;
  outfit: {
    top: WardrobeItem;
    bottom: WardrobeItem;
    outerwear?: WardrobeItem;
    shoes: WardrobeItem;
    accessory?: WardrobeItem;
  };
}
