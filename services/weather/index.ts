/**
 * @fileoverview Weather Service Manager
 * 提供天氣資料查詢、快取管理、體感溫度計算
 */

import { getCurrentWeather } from './weather.service';
import { getLocationName } from './geo.service';
import { Weather } from './weather.types';
import type { Location } from './weather.types';
import type { WeatherSummary } from '../../packages/types/src/weather';

// 導出 Location 型別
export type { Location } from './weather.types';

/** 快取項目結構 */
interface CacheEntry {
  weather: WeatherSummary;
  timestamp: number;
}

/** 天氣條件對應表 */
const CONDITION_MAP: Record<string, WeatherSummary['condition']> = {
  clear: 'sunny',
  rain: 'rainy',
  clouds: 'cloudy',
  snow: 'snowy',
  drizzle: 'rainy',
};

/**
 * 天氣服務管理器
 * - 系統級快取 (30分鐘，同地區共享)
 * - 體感溫度計算
 * - 天氣資料轉換
 */
class WeatherServiceManager {
  // 靜態快取 (模組級，所有請求共享)
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 分鐘
  private static cache = new Map<string, CacheEntry>();

  // ============================================
  // 快取管理
  // ============================================

  /** 生成快取鍵 (座標精度 2 位小數，約 1km 範圍共享) */
  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(2)},${lon.toFixed(2)}`;
  }

  /** 檢查快取是否有效 */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < WeatherServiceManager.CACHE_DURATION;
  }

  /** 格式化快取年齡 */
  private formatCacheAge(timestamp: number): string {
    const ageMs = Date.now() - timestamp;
    const minutes = Math.floor(ageMs / 60000);
    const seconds = Math.floor((ageMs % 60000) / 1000);
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  }

  // ============================================
  // 資料處理
  // ============================================

  /**
   * 計算水氣壓 (hPa)
   * Magnus 公式: e = (humidity/100) × 6.105 × exp(17.27 × temp / (237.7 + temp))
   */
  private calculateVaporPressure(temperature: number, humidity: number): number {
    return (humidity / 100) * 6.105 * Math.exp((17.27 * temperature) / (237.7 + temperature));
  }

  /**
   * 計算體感溫度
   * 公式: (1.04 × 溫度) + (0.2 × 水氣壓) - (0.65 × 風速) - 2.7
   */
  private calculateFeelsLike(temperature: number, humidity: number, windSpeed: number): number {
    const vaporPressure = this.calculateVaporPressure(temperature, humidity);
    const feelsLike = 1.04 * temperature + 0.2 * vaporPressure - 0.65 * windSpeed - 2.7;
    return Math.round(feelsLike * 10) / 10;
  }

  /** 將 Weather 轉換為 WeatherSummary */
  private weatherToSummary(weather: Weather): Omit<WeatherSummary, 'locationName'> {
    const condition = CONDITION_MAP[weather.condition] || 'cloudy';
    const windSpeedKmh = Math.round(weather.windSpeed * 3.6 * 10) / 10;
    const feelsLike = this.calculateFeelsLike(weather.temperature, weather.humidity, weather.windSpeed);

    return {
      temperature: weather.temperature,
      feelsLike,
      humidity: weather.humidity,
      condition,
      windSpeed: windSpeedKmh,
    };
  }

  // ============================================
  // 公開方法
  // ============================================

  /**
   * 取得天氣資訊
   * - 使用系統級快取 (30分鐘)
   * - 並行獲取天氣和地區名稱
   * - 自動計算體感溫度
   */
  public async getWeather(location: Location): Promise<WeatherSummary> {
    const cacheKey = this.getCacheKey(location.lat, location.lon);

    // 1. 檢查快取
    const cached = WeatherServiceManager.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log(`[Cache] Hit: ${cacheKey} (${this.formatCacheAge(cached.timestamp)})`);
      return cached.weather;
    }

    // 2. 快取過期，刪除舊資料
    if (cached) {
      console.log(`[Cache] Expired: ${cacheKey}`);
      WeatherServiceManager.cache.delete(cacheKey);
    }

    // 3. 呼叫 API
    console.log(`[API] Fetching weather: ${cacheKey}`);

    const [weather, locationName] = await Promise.all([
      getCurrentWeather(location),
      getLocationName(location),
    ]);

    // 4. 組合結果
    const result: WeatherSummary = {
      ...this.weatherToSummary(weather),
      locationName,
    };

    // 5. 存入快取
    WeatherServiceManager.cache.set(cacheKey, {
      weather: result,
      timestamp: Date.now(),
    });
    console.log(`[Cache] Saved: ${cacheKey}`);

    return result;
  }
}

// Singleton 實例
export const weatherService = new WeatherServiceManager();

// 相容性導出 (保持現有 API 不變)
export const getWeather = (location: Location): Promise<WeatherSummary> => {
  return weatherService.getWeather(location);
};
