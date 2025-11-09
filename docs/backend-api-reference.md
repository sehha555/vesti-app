# Backend API Reference

**版本:** 1.0
**日期:** 2025-11-09

本文件提供後端所有 API 端點的技術參考。

## 1. API 路由結構

```
apps/web/app/api/
├── daily-outfits/
│   └── route.ts (GET)
├── outfits/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       └── route.ts (GET, PUT, DELETE)
├── reco/
│   ├── basket-mixmatch/
│   │   ├── route.ts (POST)
│   │   └── save/
│   │       └── route.ts (POST)
│   ├── closet-gap-fill/
│   │   └── route.ts (POST)
│   └── daily-outfits/
│       └── save/
│           └── route.ts (POST)
├── test-cloudinary/
│   └── route.ts (GET)
└── wardrobe/
    ├── items/
    │   ├── route.ts (GET, POST, PUT, DELETE)
    │   └── [id]/
    │       └── route.ts (GET, PUT, DELETE)
    └── upload/
        └── route.ts (POST)
```

---

## 2. API 端點詳解

### Wardrobe (衣櫥)

#### **API: `/api/wardrobe/items`**
- **路徑**: `/api/wardrobe/items`
- **方法**: `GET`, `POST`, `PUT`, `DELETE`
- **功能**: 管理使用者的衣櫥物品。
- **相依服務**: Supabase Client
- **資料庫操作**:
  - `GET`: `SELECT * FROM clothing_items WHERE user_id = ?`
  - `POST`: `INSERT INTO clothing_items ...`
  - `PUT`: `UPDATE clothing_items SET ... WHERE id = ?`
  - `DELETE`: `DELETE FROM clothing_items WHERE id = ?`
- **詳細說明**:
  - `GET`: 根據 `userId` 查詢參數，獲取該使用者的所有衣物。
  - `POST`: 接收衣物物件 `WardrobeItem`，將其新增至資料庫。
  - `PUT`: 接收包含 `id` 和更新欄位的物件，更新指定的衣物。
  - `DELETE`: 根據 `id` 查詢參數，刪除指定的衣物。

---

#### **API: `/api/wardrobe/items/[id]`**
- **路徑**: `/api/wardrobe/items/[id]`
- **方法**: `GET`, `PUT`, `DELETE`
- **功能**: 操作單一的衣櫥物品。
- **相依服務**: Supabase Client
- **資料庫操作**: 同上，但基於路徑中的 `id`。
- **詳細說明**: 此路由的功能與 `/api/wardrobe/items` 類似，主要區別在於它從路徑 (`params`) 而非查詢參數中獲取 `id`。

---

#### **API: `/api/wardrobe/upload`**
- **路徑**: `/api/wardrobe/upload`
- **方法**: `POST`
- **功能**: 上傳衣物圖片，可選去背，並將衣物元資料存入資料庫。
- **請求格式**: `multipart/form-data`
  - `file`: 圖片檔案
  - `userId`: 使用者 ID
  - `name`: 衣物名稱
  - `type`: 衣物類型
  - `...` (其他 `WardrobeItem` 相關欄位)
- **回應格式**: 包含 Cloudinary URL 和已存入資料庫的 `WardrobeItem` 物件。
- **相依服務**:
  - Supabase Client
- **外部 API**:
  - **Cloudinary**: 用於儲存和處理圖片。
  - **remove.bg**: 用於去除圖片背景。
- **錯誤處理**:
  - 400: 缺少檔案或必要欄位。
  - 500: 伺服器設定不完整或上傳失敗。

---

### Outfits (搭配)

#### **API: `/api/outfits`**
- **路徑**: `/api/outfits`
- **方法**: `GET`, `POST`
- **功能**: 管理使用者的穿搭組合。
- **相依服務**: `shared-outfit-store` (In-memory store)
- **詳細說明**:
  - `GET`: 根據 `userId`, `tag`, `season` 等查詢參數獲取搭配列表。
  - `POST`: 建立一個新的搭配。

---

#### **API: `/api/outfits/[id]`**
- **路徑**: `/api/outfits/[id]`
- **方法**: `GET`, `PUT`, `DELETE`
- **功能**: 操作單一的穿搭組合。
- **相依服務**: `shared-outfit-store` (In-memory store)
- **詳細說明**: 根據路徑中的 `id` 查詢、更新或刪除一個搭配。

---

### Recommendations (推薦)

#### **API: `/api/daily-outfits`**
- **路徑**: `/api/daily-outfits`
- **方法**: `GET`
- **功能**: 根據使用者位置、天氣和場合，生成每日穿搭推薦。
- **請求參數**:
  - `userId: string`
  - `latitude: number`
  - `longitude: number`
  - `occasion: string`
- **相依服務**:
  - `DailyOutfitsService`
  - `WardrobeService`
  - `WeatherService`
- **外部 API**:
  - OpenWeatherMap API (透過 `WeatherService`)
- **錯誤處理**:
  - 400: 缺少必要參數。
  - 500: 服務內部錯誤。

---

#### **API: `/api/reco/basket-mixmatch`**
- **路徑**: `/api/reco/basket-mixmatch`
- **方法**: `POST`
- **功能**: (Mock) 為購物籃中的商品提供搭配建議。
- **詳細說明**: 目前返回固定的假資料。

---

#### **API: `/api/reco/closet-gap-fill`**
- **路徑**: `/api/reco/closet-gap-fill`
- **方法**: `POST`
- **功能**: (Mock) 分析使用者衣櫥，並推薦可填補空缺的單品。
- **詳細說明**: 目前返回固定的假資料。

---

### Testing (測試)

#### **API: `/api/test-cloudinary`**
- **路徑**: `/api/test-cloudinary`
- **方法**: `GET`
- **功能**: 測試與 Cloudinary API 的連線是否正常。
- **外部 API**: Cloudinary
