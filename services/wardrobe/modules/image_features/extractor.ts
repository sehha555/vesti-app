
import { ImageFeatures, Hue, Brightness, Chroma, Pattern, Style, Material, AgeRange, Gender, Occasion } from '@/packages/types/src/wardrobe';
import { getFromCache, setInCache } from './cache';

export interface VlmProvider {
  extractFeatures(imageUrl: string): Promise<Record<string, string>>;
}

export class HttpVlmProvider implements VlmProvider {
  constructor(private endpoint: string) {}

  async extractFeatures(imageUrl: string): Promise<Record<string, string>> {
    // This is a placeholder for a real HTTP call to a VLM provider.
    console.log(`Calling VLM at ${this.endpoint} for image: ${imageUrl}`);
    // The raw response would be a string that needs parsing.
    // Example raw response based on the prompt:
    const rawResponse = `
      Q1: blue
      Q2: medium
      Q3: neutral
      Q4: solid
      Q5: casual
      Q6: denim
      Q7: young_adult
      Q8: unisex
      Q9: daily
    `;
    const lines = rawResponse.trim().split('\n');
    const rawAnswers: Record<string, string> = {};
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length === 2) {
        rawAnswers[parts[0].trim()] = parts[1].trim();
      }
    });
    return rawAnswers;
  }
}

export const normalize = (rawAnswers: Record<string, string>): ImageFeatures => {
  return {
    hue: rawAnswers['Q1'] as Hue,
    brightness: rawAnswers['Q2'] as Brightness,
    chroma: rawAnswers['Q3'] as Chroma,
    pattern: rawAnswers['Q4'] as Pattern,
    style: rawAnswers['Q5'] as Style,
    material: rawAnswers['Q6'] as Material,
    age_range: rawAnswers['Q7'] as AgeRange,
    gender: rawAnswers['Q8'] as Gender,
    occasion: rawAnswers['Q9'] as Occasion,
  };
};

export const createExtractor = (provider: VlmProvider, retries = 3) => {
  return {
    extractKeywords: async (imageUrl: string): Promise<ImageFeatures> => {
      const cached = getFromCache(imageUrl);
      if (cached) {
        return cached;
      }

      for (let i = 0; i < retries; i++) {
        try {
          const rawAnswers = await provider.extractFeatures(imageUrl);
          const features = normalize(rawAnswers);
          setInCache(imageUrl, features);
          return features;
        } catch (error) {
          console.error(`Attempt ${i + 1} failed for ${imageUrl}`, error);
          if (i === retries - 1) {
            throw new Error('Failed to extract features after multiple retries');
          }
        }
      }
      throw new Error('Extractor failed unexpectedly.');
    },
  };
};
