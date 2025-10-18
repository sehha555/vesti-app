
/**
 * @fileoverview This file contains the weather service implementation.
 * Currently, it uses mock data for weather information.
 * It is intended to be replaced with a real weather API implementation in the future.
 */

import { WeatherSummary } from '../../packages/types/src/weather';

/**
 * Represents the geographic location.
 */
export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Generates a random number within a specified range.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns A random number between min and max.
 */
const getRandom = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Fetches weather information for a given location.
 * 
 * This is currently a mock implementation that generates weather data based on latitude.
 * TODO: Replace this with a call to a real weather API like OpenWeatherMap.
 * 
 * @param location - The latitude and longitude for which to get the weather.
 * @returns A promise that resolves to a standard WeatherSummary object.
 */
export const getWeather = async (location: Location): Promise<WeatherSummary> => {
  const { latitude } = location;
  const absLat = Math.abs(latitude);

  let temperature: number;

  // Simulate temperature based on latitude bands
  if (absLat <= 23) { // Tropical
    temperature = getRandom(25, 32);
  } else if (absLat <= 35) { // Subtropical
    temperature = getRandom(18, 28);
  } else if (absLat <= 50) { // Temperate
    temperature = getRandom(10, 20);
  } else { // Frigid/Polar
    temperature = getRandom(-5, 10);
  }

  const conditions: Array<'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy'> = 
     ['sunny', 'cloudy', 'rainy', 'snowy', 'windy'];
  let condition = conditions[Math.floor(Math.random() * conditions.length)];

  // It shouldn't be snowy in hot weather or rainy in freezing weather
  if (temperature > 15 && condition === 'snowy') {
      condition = 'rainy';
  }
  if (temperature < 0 && condition === 'rainy') {
      condition = 'snowy';
  }

  const windSpeed = getRandom(0, 10);

  // Return a mock WeatherSummary object compliant with the standard type
  return {
    temperature: Math.round(temperature),
    condition,
    windSpeed: Math.round(windSpeed),
  };
};
