
import { ImageFeatures } from '@/packages/types/src/wardrobe';

const cache = new Map<string, ImageFeatures>();

export const getFromCache = (imageUrl: string): ImageFeatures | undefined => {
  return cache.get(imageUrl);
};

export const setInCache = (imageUrl: string, features: ImageFeatures) => {
  cache.set(imageUrl, features);
};
