/**
 * Geocoding Service
 * 地區名稱轉座標服務
 * 優先使用本地台灣資料，Fallback 到 OpenWeather Geocoding API
 */

import axios from 'axios';
import taiwanDistricts from './data/taiwan_districts_coords.json';
import type { Location } from './weather.types';

interface TaiwanDistrict {
  city: string;
  district: string;
  lat: number;
  lon: number;
}

// 台灣主要城市中心座標 (簡化匹配)
const TAIWAN_CITY_CENTER: Record<string, Location> = {
  '台北': { lat: 25.0330, lon: 121.5654 },
  '臺北': { lat: 25.0330, lon: 121.5654 },
  '台北市': { lat: 25.0330, lon: 121.5654 },
  '臺北市': { lat: 25.0330, lon: 121.5654 },
  '新北': { lat: 25.0120, lon: 121.4658 },
  '新北市': { lat: 25.0120, lon: 121.4658 },
  '基隆': { lat: 25.1276, lon: 121.7392 },
  '基隆市': { lat: 25.1276, lon: 121.7392 },
  '桃園': { lat: 24.9936, lon: 121.3010 },
  '桃園市': { lat: 24.9936, lon: 121.3010 },
  '新竹': { lat: 24.8015, lon: 120.9718 },
  '新竹市': { lat: 24.8015, lon: 120.9718 },
  '新竹縣': { lat: 24.8390, lon: 121.0177 },
  '苗栗': { lat: 24.5602, lon: 120.8214 },
  '苗栗縣': { lat: 24.5602, lon: 120.8214 },
  '台中': { lat: 24.1477, lon: 120.6736 },
  '臺中': { lat: 24.1477, lon: 120.6736 },
  '台中市': { lat: 24.1477, lon: 120.6736 },
  '臺中市': { lat: 24.1477, lon: 120.6736 },
  '彰化': { lat: 24.0752, lon: 120.5419 },
  '彰化縣': { lat: 24.0752, lon: 120.5419 },
  '南投': { lat: 23.9610, lon: 120.9718 },
  '南投縣': { lat: 23.9610, lon: 120.9718 },
  '雲林': { lat: 23.7092, lon: 120.4313 },
  '雲林縣': { lat: 23.7092, lon: 120.4313 },
  '嘉義': { lat: 23.4800, lon: 120.4491 },
  '嘉義市': { lat: 23.4800, lon: 120.4491 },
  '嘉義縣': { lat: 23.4518, lon: 120.2555 },
  '台南': { lat: 22.9998, lon: 120.2270 },
  '臺南': { lat: 22.9998, lon: 120.2270 },
  '台南市': { lat: 22.9998, lon: 120.2270 },
  '臺南市': { lat: 22.9998, lon: 120.2270 },
  '高雄': { lat: 22.6273, lon: 120.3014 },
  '高雄市': { lat: 22.6273, lon: 120.3014 },
  '屏東': { lat: 22.6821, lon: 120.4867 },
  '屏東縣': { lat: 22.6821, lon: 120.4867 },
  '宜蘭': { lat: 24.7570, lon: 121.7533 },
  '宜蘭縣': { lat: 24.7570, lon: 121.7533 },
  '花蓮': { lat: 23.9910, lon: 121.6011 },
  '花蓮縣': { lat: 23.9910, lon: 121.6011 },
  '台東': { lat: 22.7583, lon: 121.1444 },
  '臺東': { lat: 22.7583, lon: 121.1444 },
  '台東縣': { lat: 22.7583, lon: 121.1444 },
  '臺東縣': { lat: 22.7583, lon: 121.1444 },
  '澎湖': { lat: 23.5711, lon: 119.5793 },
  '澎湖縣': { lat: 23.5711, lon: 119.5793 },
  '金門': { lat: 24.4493, lon: 118.3767 },
  '金門縣': { lat: 24.4493, lon: 118.3767 },
  '連江': { lat: 26.1506, lon: 119.9500 },
  '連江縣': { lat: 26.1506, lon: 119.9500 },
  '馬祖': { lat: 26.1506, lon: 119.9500 },
};

/**
 * 從台灣行政區資料中查找匹配的座標
 * 支援城市名、區域名或完整地址
 */
function findTaiwanLocation(locationName: string): Location | null {
  // 1. 直接匹配城市中心
  if (TAIWAN_CITY_CENTER[locationName]) {
    return TAIWAN_CITY_CENTER[locationName];
  }

  // 2. 在行政區資料中查找
  const districts = taiwanDistricts as TaiwanDistrict[];

  // 完整匹配: "臺北市中正區" 或 "臺北市 中正區"
  const normalizedName = locationName.replace(/\s+/g, '');
  const fullMatch = districts.find(d =>
    normalizedName === `${d.city}${d.district}` ||
    normalizedName === d.district
  );

  if (fullMatch) {
    return { lat: fullMatch.lat, lon: fullMatch.lon };
  }

  // 3. 部分匹配城市名
  for (const [key, location] of Object.entries(TAIWAN_CITY_CENTER)) {
    if (locationName.includes(key) || key.includes(locationName)) {
      return location;
    }
  }

  return null;
}

/**
 * 使用 OpenWeather Geocoding API 查詢座標
 */
async function geocodeWithOpenWeather(locationName: string): Promise<Location | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    console.warn('[Geocoding] OPENWEATHER_API_KEY is not set');
    return null;
  }

  try {
    const encodedName = encodeURIComponent(locationName);
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedName}&limit=1&appid=${apiKey}`;

    const response = await axios.get(url, { timeout: 5000 });
    const data = response.data[0];

    if (!data) {
      return null;
    }

    return { lat: data.lat, lon: data.lon };
  } catch (error) {
    console.error('[Geocoding] OpenWeather API error:', error instanceof Error ? error.message : 'Unknown');
    return null;
  }
}

/**
 * 將地區名稱轉換為座標
 * 優先使用本地台灣資料，Fallback 到 OpenWeather API
 *
 * @param locationName - 地區名稱 (如 "台北", "臺北市中正區", "Tokyo")
 * @returns Location 座標或 null
 */
export async function geocodeLocation(locationName: string): Promise<Location | null> {
  if (!locationName || locationName.trim() === '') {
    console.warn('[Geocoding] Empty location name provided');
    return null;
  }

  const trimmedName = locationName.trim();

  // 1. 優先嘗試本地台灣資料
  const taiwanLocation = findTaiwanLocation(trimmedName);
  if (taiwanLocation) {
    console.log(`[Geocoding] Taiwan local match: ${trimmedName} -> (${taiwanLocation.lat}, ${taiwanLocation.lon})`);
    return taiwanLocation;
  }

  // 2. Fallback 到 OpenWeather API
  console.log(`[Geocoding] Fallback to OpenWeather API for: ${trimmedName}`);
  return await geocodeWithOpenWeather(trimmedName);
}

/**
 * 預設座標 (台北市中心)
 */
export const DEFAULT_LOCATION: Location = { lat: 25.0330, lon: 121.5654 };
