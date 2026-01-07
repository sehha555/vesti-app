/**
 * Weather Service Index
 * Re-exports the real implementation from /services/weather/
 */

// Re-export everything from the real weather service
export { getWeather, weatherService } from '../../../../../services/weather';
export type { Location } from '../../../../../services/weather';
