import { WardrobeItem } from '@/packages/types/src/wardrobe';
import { WardrobeService } from '@/services/wardrobe/items.service';
import { HybridDailyOutfitEngine, DailyOutfit, HybridMode } from './hybrid-engine';
import { WeatherInfo } from '@/services/weather/open-weather.service';

/**
 * 天氣服務介面
 */
export interface IWeatherService {
  getWeather(lat: number, lon: number): Promise<WeatherInfo>;
}

/**
 * OpenWeatherMap Service Adapter
 *
 * 將 OpenWeatherService 適配到 IWeatherService 介面
 */
export class OpenWeatherServiceAdapter implements IWeatherService {
  constructor(private openWeatherService: any) {}

  async getWeather(lat: number, lon: number): Promise<WeatherInfo> {
    return this.openWeatherService.getWeather(lat, lon);
  }
}

/**
 * 每日穿搭服務輸入
 */
export interface GetDailyOutfitsInput {
  userId: string;
  latitude?: number;
  longitude?: number;
  occasion?: string;
  mode?: HybridMode;
}

/**
 * 每日穿搭服務
 *
 * 負責整合 WardrobeService、WeatherService 與 HybridDailyOutfitEngine，
 * 提供完整的每日穿搭推薦流程
 */
export class DailyOutfitsService {
  constructor(
    private wardrobeService: WardrobeService,
    private weatherService: IWeatherService,
    private hybridEngine: HybridDailyOutfitEngine
  ) {}

  /**
   * 取得每日穿搭推薦
   *
   * @param input - 輸入參數
   * @returns 推薦的穿搭列表與天氣資訊
   */
  async getDailyOutfits(input: GetDailyOutfitsInput): Promise<{ weather: WeatherInfo; outfits: DailyOutfit[] }> {
    const { userId, latitude, longitude, occasion = 'casual', mode = 'rule-only' } = input;

    try {
      // 步驟 1: 從 Wardrobe DB 讀取使用者的衣物
      console.log(`[DailyOutfitsService] Fetching wardrobe items for user: ${userId}`);
      const items: WardrobeItem[] = this.wardrobeService.getItems(userId);

      if (!items || items.length === 0) {
        console.warn(`[DailyOutfitsService] No wardrobe items found for user: ${userId}`);
        return [];
      }

      console.log(`[DailyOutfitsService] Found ${items.length} wardrobe items`);

      // 步驟 2: 取得天氣資訊
      let weather: WeatherInfo;
      if (latitude !== undefined && longitude !== undefined) {
        try {
          weather = await this.weatherService.getWeather(latitude, longitude);
          console.log(`[DailyOutfitsService] Weather fetched: ${weather.temp_c}°C (${weather.description})`);
        } catch (error) {
          console.error('[DailyOutfitsService] Failed to fetch weather, using default', error);
          weather = this.getDefaultWeather();
        }
      } else {
        console.log('[DailyOutfitsService] No location provided, using default weather');
        weather = this.getDefaultWeather();
      }

      // 步驟 3: 使用 Hybrid Engine 生成推薦
      console.log(`[DailyOutfitsService] Generating recommendations (mode: ${mode}, occasion: ${occasion})`);
      const outfits = await this.hybridEngine.generateRecommendations({
        items,
        weather,
        occasion,
        mode,
      });

      console.log(`[DailyOutfitsService] Generated ${outfits.length} outfit recommendations`);

      // 回傳天氣資訊與穿搭推薦
      return {
        weather,
        outfits,
      };
    } catch (error) {
      console.error('[DailyOutfitsService] Error generating daily outfits:', error);
      throw error;
    }
  }

  /**
   * 預設天氣（當無法取得真實天氣時使用）
   */
  private getDefaultWeather(): WeatherInfo {
    return {
      temp_c: 22,
      condition: 'Clear',
      description: '晴朗',
      iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
      humidity: 60,
      feels_like: 22,
      locationName: 'Default',
    };
  }
}

/**
 * 建立 DailyOutfitsService 實例（Singleton）
 */
let serviceInstance: DailyOutfitsService | null = null;

export async function getDailyOutfitsService(): Promise<DailyOutfitsService> {
  if (serviceInstance) {
    return serviceInstance;
  }

  // 初始化依賴
  const { wardrobeServicePromise } = await import('@/services/wardrobe/items.service');
  const wardrobeService = await wardrobeServicePromise;

  // 使用真實的 OpenWeatherService
  const { getOpenWeatherService } = await import('@/services/weather/open-weather.service');
  const openWeatherService = getOpenWeatherService();
  const weatherService = new OpenWeatherServiceAdapter(openWeatherService);

  const hybridEngine = new HybridDailyOutfitEngine();

  serviceInstance = new DailyOutfitsService(wardrobeService, weatherService, hybridEngine);
  return serviceInstance;
}
