# Backend Services and Architecture

**版本:** 1.0
**日期:** 2025-11-09

本文件旨在說明後端服務的架構、核心模組、資料流和外部整合。

## 1. 服務模組結構

```
services/
├── api-gateway/
├── auth/
├── cart-payments/
├── catalog/
├── notifications/
├── reco/                          # 推薦系統核心
│   ├── modules/
│   │   ├── retrieval/           # 檢索模組 (e.g., generateOutfitCombinations)
│   │   └── scoring/             # 評分模組 (e.g., scoreCompatibility)
│   └── pipelines/
│       └── daily_outfits/
│           └── daily_outfits.service.ts
├── tryon/
├── wardrobe/                      # 衣櫥管理核心
│   ├── items.service.ts
│   └── persistence.ts
└── weather/                       # 天氣服務
    ├── weather.service.ts
    └── weather.types.ts
```

---

## 2. 核心服務詳解

### `WardrobeService`
- **路徑**: `services/wardrobe/items.service.ts`
- **目的**: 作為衣櫥物品的中央倉儲 (Repository)，處理所有衣物的 CRUD (建立、讀取、更新、刪除) 操作。
- **設計模式**: 單例 (Singleton)，透過 `wardrobeServicePromise` 導出，確保整個應用程式共享同一個服務實例。
- **關鍵方法**:
  - `initialize()`: 從持久層 (`WardrobePersistence`) 載入資料來初始化服務。
  - `createItem(userId, dto)`: 建立一個新的衣物項目。
  - `getItems(userId)`: 獲取指定使用者的所有衣物。
  - `getItem(itemId)`: 根據 ID 獲取單一衣物。
  - `deleteItem(itemId)`: 刪除一個衣物。
- **資料流**: API 路由 (如 `/api/wardrobe/items`) 呼叫 `WardrobeService` 的方法。服務在記憶體中更新 `Map` 物件，然後呼叫 `WardrobePersistence` 將變更寫入後端儲存 (在此專案中為 JSON 檔案或資料庫)。

---

### `DailyOutfitsService`
- **路徑**: `services/reco/pipelines/daily_outfits/daily_outfits.service.ts`
- **目的**: 負責生成每日穿搭推薦的核心業務邏輯。
- **關鍵方法**:
  - `generateDailyOutfits(userId, location, occasion)`: 這是主要的進入點，執行完整的推薦生成流程。
- **依賴**:
  - `WardrobeService`: 用於獲取使用者的完整衣物清單。
  - `WeatherService` (透過 `getWeather` 函式傳入): 用於獲取指定地點的即時天氣。
- **資料流**:
  1. 從 `WardrobeService` 獲取所有衣物。
  2. 呼叫 `getWeather` 獲取天氣資訊。
  3. 使用 `weatherFitFilter` 根據天氣過濾不適合的衣物。
  4. 使用 `generateOutfitCombinations` 生成所有可能的穿搭組合。
  5. 使用 `scoreCompatibility` 根據天氣、場合等因素為每個組合評分。
  6. 排序並選出分數最高且沒有重複單品的幾個組合作為最終推薦。

---

### `WeatherService`
- **路徑**: `services/weather/weather.service.ts`
- **目的**: 提供即時天氣資訊，並包含快取和重試機制。
- **關鍵方法**:
  - `getCurrentWeather(location)`: 根據經緯度獲取天氣。
- **外部 API**: **OpenWeatherMap**
- **資料流**:
  1. 接收一個地點 (經緯度)。
  2. 檢查 `NodeCache` 中是否有該地點的快取資料。
  3. 若無快取，使用 `axios` 呼叫 OpenWeatherMap API。
  4. 使用 `p-retry` 處理 API 呼叫失敗時的自動重試。
  5. 將獲取的資料存入快取並返回。
  6. 如果 API 金鑰未設定或最終失敗，則返回一個預設的晴天天氣資料。

---

## 3. 資料庫結構 (Data Model)

主要的資料模型是 `WardrobeItem`，其結構定義了 `clothing_items` 資料庫表（由 Supabase 管理）的欄位。

- **定義路徑**: `packages/types/src/wardrobe.ts`
- **`WardrobeItem` 核心欄位**:
  - `id: string` (Primary Key)
  - `userId: string` (Foreign Key to users)
  - `name: string`
  - `type: ClothingType` ('top', 'bottom', 'shoes', etc.)
  - `imageUrl: string` (通常是去背後的圖片 URL)
  - `originalImageUrl: string` (原始圖片 URL)
  - `colors: string[]`
  - `season: Season`
  - `style: Style`
  - `occasions: Occasion[]`
  - `source: ClothingSource` ('upload' or 'shop')
  - `createdAt: Date`

---

## 4. 外部服務整合

- **Supabase**:
  - **用途**: 作為主要的後端資料庫 (PostgreSQL)。
  - **整合方式**: 透過 `@supabase/supabase-js` 客戶端在 API 路由中直接進行資料庫操作。

- **Cloudinary**:
  - **用途**: 圖片儲存、管理和即時轉換 (CDN)。
  - **整合方式**: 在 `/api/wardrobe/upload` 路由中使用 `cloudinary` SDK 進行圖片上傳。

- **remove.bg**:
  - **用途**: 提供圖片背景去除功能。
  - **整合方式**: 在 `/api/wardrobe/upload` 路由中，上傳原圖到 Cloudinary 後，呼叫 `remove-bg` API 處理圖片 URL，並將去背後的圖片再次上傳。

- **OpenWeatherMap**:
  - **用途**: 提供全球即時天氣資料。
  - **整合方式**: 在 `WeatherService` 中透過 REST API 呼叫。
