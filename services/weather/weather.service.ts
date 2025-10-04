
import { Injectable } from '@nestjs/common';
import { WeatherSummary } from '@/packages/types/src/weather';

@Injectable()
export class WeatherService {
  async getSummary(latitude: number, longitude: number): Promise<WeatherSummary> {
    // In a real implementation, this would call an external weather API
    // For now, return a dummy summary based on location (e.g., always sunny for certain coords)
    return {
      temperature: 25,
      condition: 'sunny',
      windSpeed: 10,
    };
  }
}
