# OpenWeatherMap Cache 機制驗證指南

## 快取機制說明

OpenWeatherService 使用以下策略：

1. **區域模糊化**：將經緯度四捨五入到小數點後 1 位
   - 例如：`(25.0330, 121.5654)` → Cache Key: `"25.0:121.6"`
   - 相當於約 10x10km 的網格

2. **快取有效期**：3 小時（10800000 毫秒）

3. **記憶體快取**：使用 Map 物件存儲於 Module Level

## 如何驗證 Cache 是否生效

### 方法 1：查看 Console Log

當你多次呼叫 `/api/daily-outfits?userId=xxx&latitude=25.03&longitude=121.56` 時，觀察 Server Console：

**第一次呼叫（Cache Miss）：**
```
🌍 Fetching OWM API for: 25.0:121.6 (lat=25.03, lon=121.56)
✅ Weather data cached: 25.0:121.6
[DailyOutfitsService] Weather fetched: 28.5°C (晴朗)
```

**第二次呼叫（Cache Hit）：**
```
🎯 Weather Cache Hit: 25.0:121.6
[DailyOutfitsService] Weather fetched: 28.5°C (晴朗)
```

**關鍵差異**：
- ✅ Cache Hit 時不會看到「Fetching OWM API」
- ✅ 直接回傳快取資料，速度更快

### 方法 2：使用 Postman 或 curl 測試

```bash
# 第一次請求（會呼叫 API）
curl "http://localhost:3000/api/daily-outfits?userId=YOUR_UUID&latitude=25.03&longitude=121.56"

# 立即第二次請求（應該命中快取）
curl "http://localhost:3000/api/daily-outfits?userId=YOUR_UUID&latitude=25.03&longitude=121.56"

# 使用稍微不同的經緯度，但在同一網格內（應該仍命中快取）
curl "http://localhost:3000/api/daily-outfits?userId=YOUR_UUID&latitude=25.04&longitude=121.59"

# 使用不同網格的經緯度（會產生新的 API 呼叫）
curl "http://localhost:3000/api/daily-outfits?userId=YOUR_UUID&latitude=24.5&longitude=120.8"
```

### 方法 3：查看 Cache 統計

在 Server Console 中執行（需要加入測試端點）：

```typescript
import { OpenWeatherService } from '@/services/weather/open-weather.service';

// 查看當前快取狀態
const stats = OpenWeatherService.getCacheStats();
console.log('Cache Size:', stats.size);
console.log('Cache Keys:', stats.keys);

// 輸出範例：
// Cache Size: 3
// Cache Keys: ['25.0:121.6', '24.5:120.8', '23.5:120.3']
```

## 測試場景

### ✅ 場景 1：相同網格內的請求
```
Request 1: lat=25.03, lon=121.56  → Cache Key: 25.0:121.6 (MISS)
Request 2: lat=25.04, lon=121.59  → Cache Key: 25.0:121.6 (HIT) ✅
Request 3: lat=25.01, lon=121.54  → Cache Key: 25.0:121.5 (MISS)
```

### ✅ 場景 2：快取過期測試
```
Request at T+0:     lat=25.0, lon=121.5 → MISS (呼叫 API)
Request at T+1hr:   lat=25.0, lon=121.5 → HIT  (快取有效)
Request at T+3.5hr: lat=25.0, lon=121.5 → MISS (快取過期，重新呼叫 API)
```

### ✅ 場景 3：API 失敗回退
```
1. 移除或破壞 OPENWEATHER_API_KEY
2. 呼叫 API
3. 應該看到：
   ❌ Failed to fetch weather from OWM API
   🔄 Using default weather (22°C, Sunny)
```

## 效能指標

在正常運作下：

- **Cache Hit Rate**：預期 > 70%（同一使用者在短時間內重複查詢）
- **API 呼叫量**：每個 10km² 網格每 3 小時最多 1 次
- **回應時間**：
  - Cache Hit: < 10ms
  - Cache Miss: 200-500ms（取決於 OWM API）

## 清除快取（測試用）

如果需要重置快取進行測試：

```typescript
import { OpenWeatherService } from '@/services/weather/open-weather.service';

OpenWeatherService.clearCache();
console.log('🗑️  Weather cache cleared');
```

或重新啟動 Server 也會清除記憶體快取。
