/**
 * Weather Service Index (stub)
 * Real implementation is in /services/weather/index.ts
 */

export interface WeatherInfo {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  locationName: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getWeather(coords: { lat: number; lon: number }): Promise<WeatherInfo> {
  try {
    // This is a stub - in production, call actual weather API
    // For now, return default weather
    return {
      temperature: 20,
      feelsLike: 18,
      condition: 'clear',
      humidity: 60,
      locationName: 'Taiwan',
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    throw new Error('Failed to fetch weather');
  }
}
