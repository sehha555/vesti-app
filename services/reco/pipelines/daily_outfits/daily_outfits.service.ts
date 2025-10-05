import { Injectable } from '@nestjs/common';
import { WardrobeItem, Style } from '@/packages/types/src/wardrobe';
import { DailyOutfitRequest, DailyOutfitRecommendation, DailyOutfitResponse } from '@/packages/types/src/daily';
import { ItemsService } from '../../../wardrobe/modules/items/items.service';
import { getCurrentWeather } from '../../../weather/weather.service';
import { weatherFitFilter, scoreOccasion, scoreCompatibility } from '../../modules/scoring/rules';
import { generateOutfitCombinations } from '../../modules/retrieval/simple';
import { Weather } from '../../../weather/weather.types';
import { WeatherSummary } from '@/packages/types/src/weather';

@Injectable()
export class DailyOutfitsService {
  private readonly itemsService = new ItemsService();

  private toWeatherSummary(weather: Weather): WeatherSummary {
    const conditionMap: { [key: string]: WeatherSummary['condition'] } = {
      clear: 'sunny',
      clouds: 'cloudy',
      rain: 'rainy',
      drizzle: 'rainy',
      snow: 'snowy',
    };

    return {
      temperature: weather.temperature,
      condition: conditionMap[weather.condition] || 'sunny',
      windSpeed: weather.windSpeed,
    };
  }

  async generate(request: DailyOutfitRequest): Promise<DailyOutfitResponse> {
    const { userId, latitude, longitude, occasion } = request;

    const wardrobe = await this.itemsService.findAll(userId);
    const weather = await getCurrentWeather({ lat: latitude, lon: longitude });
    const weatherSummary = this.toWeatherSummary(weather);

    const weatherFilteredItems = weatherFitFilter(wardrobe, weatherSummary);

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