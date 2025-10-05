import axios from 'axios';
import pRetry from 'p-retry';
import NodeCache from 'node-cache';
import { Weather, Location } from './weather.types';

// 從環境變數讀取快取 TTL
const cacheTtl = process.env.WEATHER_CACHE_TTL ? parseInt(process.env.WEATHER_CACHE_TTL, 10) : 1800;

// 初始化快取
const weatherCache = new NodeCache({ stdTTL: cacheTtl });

/**
 * 取得預設天氣資訊
 * @returns {Weather} 預設天氣物件
 */
const getDefaultWeather = (): Weather => ({
  temperature: 25,
  feelsLike: 25,
  humidity: 60,
  condition: 'clear',
  precipitation: 0,
  rainVolume: 0,
  windSpeed: 1,
  timestamp: new Date(),
});

/**
 * 根據經緯度取得目前天氣資訊
 * @param {Location} location - 包含經緯度的物件
 * @returns {Promise<Weather>} 天氣資訊物件
 */
export const getCurrentWeather = async (location: Location): Promise<Weather> => {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    console.error('WEATHER_API_KEY is not set. Returning default weather.');
    return getDefaultWeather();
  }

  if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
    console.warn('Invalid location provided. Returning default weather.');
    return getDefaultWeather();
  }

  const { lat, lon } = location;
  const cacheKey = `weather:${lat}:${lon}`;

  // 嘗試從快取中取得天氣資訊
  const cachedWeather = weatherCache.get<Weather>(cacheKey);
  if (cachedWeather) {
    return cachedWeather;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  const fetchWeather = async () => {
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data;

    const weather: Weather = {
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      condition: data.weather[0].main.toLowerCase(),
      precipitation: data.pop || 0,
      rainVolume: data.rain ? data.rain['1h'] : 0,
      windSpeed: data.wind.speed,
      timestamp: new Date(data.dt * 1000),
    };

    // 將天氣資訊存入快取
    weatherCache.set(cacheKey, weather);
    return weather;
  };

  try {
    // 使用 p-retry 進行重試
    return await pRetry(fetchWeather, { retries: 3 });
  } catch (error) {
    console.error('Failed to fetch weather data after multiple retries:', error);
    return getDefaultWeather();
  }
};