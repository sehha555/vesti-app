
export interface WeatherSummary {
  temperature: number; // in Celsius
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  windSpeed: number; // in km/h
  // Add more fields as needed for detailed recommendations
}
