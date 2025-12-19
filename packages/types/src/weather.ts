
export interface WeatherSummary {
  temperature: number; // in Celsius
  feelsLike: number; // 體感溫度 in Celsius
  humidity: number; // 濕度 (0-100%)
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
  windSpeed: number; // in km/h
  locationName?: string; // 地區名稱 (反向地理編碼)
}
