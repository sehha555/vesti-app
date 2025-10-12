
import { normalize } from './extractor';
import { Hue, Brightness, Chroma, Pattern, Style, Material, AgeRange, Gender, Occasion } from '@/packages/types/src/wardrobe';

describe('normalization', () => {
  it('should correctly normalize raw string answers to enums', () => {
    const rawAnswers = {
      'Q1': 'blue',
      'Q2': 'medium',
      'Q3': 'neutral',
      'Q4': 'solid',
      'Q5': 'casual',
      'Q6': 'denim',
      'Q7': 'young_adult',
      'Q8': 'unisex',
      'Q9': 'daily',
    };

    const expectedFeatures = {
      dominantColors: ['blue'],
      pattern: Pattern.SOLID,
      style: Style.CASUAL,
      material: Material.DENIM,
    };

    const normalized = normalize(rawAnswers as any);
    expect(normalized).toEqual(expectedFeatures);
  });

  it('should handle unexpected values by passing them through', () => {
    const rawAnswers = {
      'Q1': 'chartreuse', // not in enum
      'Q5': 'funky', // not in enum
    };
    const normalized = normalize(rawAnswers as any);
    expect(normalized.dominantColors).toEqual(['chartreuse']);
    expect(normalized.style).toBe('funky');
  });
});
