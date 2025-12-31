/**
 * Weather Types (stub)
 */

export interface Location {
  lat: number;
  lon: number;
}

export interface WeatherInfo {
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  locationName: string;
}
