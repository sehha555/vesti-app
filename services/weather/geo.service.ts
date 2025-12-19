import axios from 'axios';
import type { Location } from './weather.types';
import { getTaiwanDistrict, isInTaiwan } from './taiwan-district.service';

/**
 * 根據經緯度取得地區名稱
 * 優先使用本地台灣行政區資料，Fallback 到 OpenWeather API
 * @param location - 包含 lat 和 lon 的位置物件
 * @returns 地區名稱 (如「新北市中和區」)
 */
export async function getLocationName(location: Location): Promise<string> {
  if (!location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
    console.warn('Invalid location provided for geo lookup.');
    return '未知地區';
  }

  // 優先檢查是否在台灣範圍，使用本地資料匹配
  if (isInTaiwan(location.lat, location.lon)) {
    const taiwanDistrict = getTaiwanDistrict(location.lat, location.lon);
    if (taiwanDistrict) {
      return taiwanDistrict;
    }
  }

  // Fallback: 使用 OpenWeather API
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('OPENWEATHER_API_KEY is not set. Returning default location name.');
    return '未知地區';
  }

  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${location.lat}&lon=${location.lon}&limit=1&appid=${apiKey}`;
    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data[0];

    if (!data) {
      return '未知地區';
    }

    // 優先使用中文名稱
    return data.local_names?.zh || data.name || '未知地區';
  } catch (error) {
    console.error('Failed to get location name:', error);
    return '未知地區';
  }
}
