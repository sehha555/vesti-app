
/**
 * @fileoverview This file contains the type definitions for the weather service.
 * @packageDocumentation
 */

/**
 * Represents the weather conditions at a specific location and time.
 *
 * @property {number} temperature - The temperature in Celsius.
 * @property {number} feelsLike - The perceived temperature in Celsius.
 * @property {number} humidity - The relative humidity as a percentage (0-100).
 * @property {'clear' | 'rain' | 'clouds' | 'snow' | 'drizzle'} condition - The general weather condition.
 * @property {number} precipitation - The probability of precipitation as a percentage (0-100).
 * @property {number} rainVolume - The volume of rain in millimeters per hour (mm/h).
 * @property {number} windSpeed - The wind speed in meters per second (m/s).
 * @property {Date} timestamp - The time at which the weather data was recorded.
 */
export interface Weather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  condition: 'clear' | 'rain' | 'clouds' | 'snow' | 'drizzle';
  precipitation: number;
  rainVolume: number;
  windSpeed: number;
  timestamp: Date;
}

/**
 * Represents the location for which weather information is requested.
 *
 * @property {number} lat - The latitude of the location.
 * @property {number} lon - The longitude of the location.
 */
export interface Location {
  lat: number;
  lon: number;
}
