import taiwanDistricts from './data/taiwan_districts_coords.json';

interface District {
  city: string;
  district: string;
  lat: number;
  lon: number;
}

// 注意: 快取已移至 services/weather/index.ts 的系統級快取

/**
 * 計算兩點之間的距離 (Haversine formula)
 * @returns 距離 (公里)
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半徑 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 根據座標找到最近的台灣行政區
 * @param lat - 緯度
 * @param lon - 經度
 * @returns 完整地區名稱 (如「新北市中和區」) 或 null
 */
export function getTaiwanDistrict(lat: number, lon: number): string | null {
  const districts = taiwanDistricts as District[];

  let nearest: District | null = null;
  let minDistance = Infinity;

  for (const district of districts) {
    const distance = getDistance(lat, lon, district.lat, district.lon);
    if (distance < minDistance) {
      minDistance = distance;
      nearest = district;
    }
  }

  // 如果最近的區域超過 50 公里，可能不在台灣
  if (nearest && minDistance < 50) {
    const result = `${nearest.city} ${nearest.district}`;
    console.log(`🇹🇼 [Taiwan] 匹配到: ${result} (距離: ${minDistance.toFixed(2)} km)`);
    return result;
  }

  return null;
}

/**
 * 檢查座標是否在台灣範圍內 (粗略判斷)
 */
export function isInTaiwan(lat: number, lon: number): boolean {
  // 台灣本島 + 離島的粗略範圍
  return lat >= 21.5 && lat <= 26.5 && lon >= 118 && lon <= 122.5;
}
