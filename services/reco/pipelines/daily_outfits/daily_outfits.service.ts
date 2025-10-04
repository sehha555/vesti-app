
import { Injectable } from '@nestjs/common';
import { WardrobeItem, Style } from '@/packages/types/src/wardrobe';
import { DailyOutfitRequest, DailyOutfitRecommendation, DailyOutfitResponse } from '@/packages/types/src/daily';
import { ItemsService } from '../../../wardrobe/modules/items/items.service';
import { WeatherService } from '../../../weather/weather.service';
import { weatherFitFilter, scoreOccasion, scoreCompatibility } from '../../modules/scoring/rules';
import { generateOutfitCombinations } from '../../modules/retrieval/simple';

@Injectable()
export class DailyOutfitsService {
  private readonly itemsService = new ItemsService();
  private readonly weatherService = new WeatherService();

  async generate(request: DailyOutfitRequest): Promise<DailyOutfitResponse> {
    const { userId, latitude, longitude, occasion } = request;

    const wardrobe = await this.itemsService.findAll(userId);
    const weather = await this.weatherService.getSummary(latitude, longitude);

    const weatherFilteredItems = weatherFitFilter(wardrobe, weather);

    const combinations = generateOutfitCombinations(weatherFilteredItems);

    const recommendations: DailyOutfitRecommendation[] = combinations.map(outfit => {
      const weatherFit = 1; // Placeholder for actual weather fit score
      const occasionMatch = scoreOccasion(outfit.top, occasion);
      const compatibility = scoreCompatibility();
      const total = weatherFit + occasionMatch + compatibility;

      return {
        outfit,
        reasons: ['Good for current weather', 'Matches your style'],
        scores: {
          weatherFit,
          occasionMatch,
          compatibility,
          total,
        },
      };
    });

    recommendations.sort((a, b) => b.scores.total - a.scores.total);

    return { recommendations: recommendations.slice(0, 5) };
  }
}
