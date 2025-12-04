/**
 * OpenWeatherMap Weather Service with Geo-based Caching
 *
 * 策略：Lazy Loading with Geo-Caching
 * - 將經緯度模糊化到小數點後 1 位（約 10x10km 網格）作為 Cache Key
 * - 快取有效期為 3 小時
 * - 快取過期或不存在時才呼叫 OWM API
 */

/**
 * 天氣資訊介面（擴充版）
 */
export interface WeatherInfo {
  temp_c: number;         // 溫度（攝氏）
  condition: string;      // 天氣狀況主分類（Clear, Rain, Clouds 等）
  description: string;    // 詳細描述（晴朗、多雲、小雨等）
  iconUrl: string;        // 天氣圖示 URL
  humidity: number;       // 濕度百分比
  feels_like: number;     // 體感溫度
  locationName: string;   // 城市名稱
}

/**
 * Cache 項目結構
 */
interface CacheEntry {
  data: WeatherInfo;
  timestamp: number;
}

/**
 * OpenWeatherMap API Response 型別定義
 */
interface OWMResponse {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
}

/**
 * OpenWeatherMap Service
 *
 * 使用記憶體快取與區域模糊化策略，減少 API 呼叫次數
 */
export class OpenWeatherService {
  // 快取有效期：3 小時
  private static readonly CACHE_DURATION = 3 * 60 * 60 * 1000

  // 記憶體快取（Module-level，在 Node.js 環境下跨請求共用）
  private static cache = new Map<string, CacheEntry>();

  // API Key（從環境變數讀取）
  private apiKey: string;

  constructor() {
    const key = process.env.OPENWEATHER_API_KEY;
    if (!key) {
      console.warn('OPENWEATHER_API_KEY not found in environment variables');
    }
    this.apiKey = key || '';
  }

  /**
   * 取得天氣資訊（主要入口方法）
   *
   * @param lat - 緯度
   * @param lon - 經度
   * @returns 天氣資訊
   */
  async getWeather(lat: number, lon: number): Promise<WeatherInfo> {
    // 步驟 1: 計算 Cache Key（模糊化到小數點後 1 位）
    const cacheKey = this.getCacheKey(lat, lon);

    // 步驟 2: 檢查 Cache 是否存在且未過期
    const cached = OpenWeatherService.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log(`Weather Cache Hit: ${cacheKey}`);
      return cached.data;
    }

    // 步驟 3: Cache 無效或不存在，呼叫 OWM API
    console.log(`Fetching OWM API for: ${cacheKey} (lat=${lat}, lon=${lon})`);

    try {
      const weatherData = await this.fetchFromAPI(lat, lon);

      // 步驟 4: 轉換資料並寫入 Cache
      const cacheEntry: CacheEntry = {
        data: weatherData,
        timestamp: Date.now(),
      };
      OpenWeatherService.cache.set(cacheKey, cacheEntry);

      console.log(`Weather data cached: ${cacheKey}`);

      // 步驟 5: 回傳結果
      return weatherData;
    } catch (error) {
      console.error(`Failed to fetch weather from OWM API:`, error);

      // 錯誤處理：回傳安全預設值
      return this.getDefaultWeather();
    }
  }

  /**
   * 計算 Cache Key（經緯度模糊化到小數點後 1 位）
   *
   * 例如：(25.0330, 121.5654) -> "25.0:121.6"
   */
  private getCacheKey(lat: number, lon: number): string {
    return `${lat.toFixed(1)}:${lon.toFixed(1)}`;
  }

  /**
   * 檢查 Cache 是否仍然有效
   */
  private isCacheValid(entry: CacheEntry): boolean {
    const age = Date.now() - entry.timestamp;
    return age < OpenWeatherService.CACHE_DURATION;
  }

  /**
   * 從 OpenWeatherMap API 取得天氣資料
   */
  private async fetchFromAPI(lat: number, lon: number): Promise<WeatherInfo> {
    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY is not configured');
    }

    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('lat', lat.toString());
    url.searchParams.set('lon', lon.toString());
    url.searchParams.set('units', 'metric');
    url.searchParams.set('appid', this.apiKey);
    url.searchParams.set('lang', 'zh_tw'); // 繁體中文

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // 10 秒超時
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`OWM API Error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OWMResponse;

    // 轉換為 WeatherInfo 格式
    return this.transformResponse(data);
  }

  /**
   * 轉換 OWM API Response 為 WeatherInfo
   */
  private transformResponse(data: OWMResponse): WeatherInfo {
     console.log('OWM raw name:', data.name);
    const mainWeather = data.weather[0];

    return {
      temp_c: Math.round(data.main.temp * 10) / 10, // 保留一位小數
      condition: mainWeather.main, // "Clear", "Rain", "Clouds" 等
      description: mainWeather.description, // "晴朗", "小雨", "多雲" 等
      iconUrl: `https://openweathermap.org/img/wn/${mainWeather.icon}@2x.png`,
      humidity: data.main.humidity,
      feels_like: Math.round(data.main.feels_like * 10) / 10,
      locationName: this.translateCityName(data.name),
    };
  }

  /**
   * 將 OpenWeatherMap 回傳的地名翻譯為台灣行政區中文名稱
   *
   * 使用手寫對照表進行比對
   *
   * @param name - API 回傳的地名（如 "Xianqibu", "Banqiao"）
   * @returns 中文行政區名稱（如 "新北市 信義區", "新北市 板橋區"）
   */
  private translateCityName(name: string): string {
    const cityMap: Record<string, string> = {
      Taipei: '台北市',
      'Taipei City': '台北市',
      Xianeibu: '新北市 信義區',
      'Xinyi District': '新北市 信義區',
      Banqiao: '新北市 板橋區',
      'Banqiao District': '新北市 板橋區',
      Zhonghe: '新北市 中和區',
      Yonghe: '新北市 永和區',
      Taichung: '台中市',
      Kaohsiung: '高雄市',
      Tainan: '台南市',
    };

    return cityMap[name] || name;
  }

  /**
   * 取得預設天氣（當 API 呼叫失敗時使用）
   */
  private getDefaultWeather(): WeatherInfo {
    console.log('🔄 Using default weather (22°C, Sunny)');
    return {
      temp_c: 22,
      condition: 'Clear',
      description: '晴朗',
      iconUrl: 'https://openweathermap.org/img/wn/01d@2x.png',
      humidity: 60,
      feels_like: 22,
      locationName: 'Unknown',
    };
  }

  /**
   * 清除快取（用於測試或手動重置）
   */
  static clearCache(): void {
    OpenWeatherService.cache.clear();
    console.log('🗑️  Weather cache cleared');
  }

  /**
   * 取得快取統計資訊（用於監控）
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: OpenWeatherService.cache.size,
      keys: Array.from(OpenWeatherService.cache.keys()),
    };
  }
}

/**
 * 建立 OpenWeatherService 單例（Singleton）
 */
let weatherServiceInstance: OpenWeatherService | null = null;

export function getOpenWeatherService(): OpenWeatherService {
  if (!weatherServiceInstance) {
    weatherServiceInstance = new OpenWeatherService();
  }
  return weatherServiceInstance;
}
