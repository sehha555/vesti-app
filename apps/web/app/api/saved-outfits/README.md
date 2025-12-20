# Saved Outfits API

完整的穿搭儲存與讀取 API 文件

## 🎯 功能概述

此 API 提供使用者儲存、讀取和管理每日穿搭推薦的功能。

---

## 📡 API 端點

### POST /api/saved-outfits

儲存使用者選擇的穿搭組合

#### Request

```json
{
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "outfitData": {
    "imageUrl": "https://...",
    "styleName": "Casual Comfort",
    "description": "Perfect for a cool day",
    "heroImageUrl": "https://...",
    "items": [
      {
        "id": "item-uuid-1",
        "name": "白色T恤",
        "imageUrl": "https://..."
      }
    ]
  },
  "weather": {
    "temp_c": 25,
    "condition": "Clear",
    "description": "晴朗",
    "humidity": 60,
    "feels_like": 26,
    "locationName": "台北市"
  },
  "occasion": "casual",
  "outfitType": "saved",
  "timestamp": "2024-12-01T10:00:00Z"
}
```

#### Response - 成功 (201 Created)

```json
{
  "success": true,
  "savedOutfit": {
    "id": "uuid",
    "user_id": "uuid",
    "outfit_data": { ... },
    "weather_info": { ... },
    "occasion": "casual",
    "outfit_type": "saved",
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
}
```

#### Response - 已存在 (200 OK)

```json
{
  "success": true,
  "savedOutfit": { ... },
  "message": "Outfit already saved"
}
```

#### Response - 錯誤 (400/500)

```json
{
  "success": false,
  "error": "Missing required field: userId",
  "details": "..."
}
```

#### 特殊功能

- **重複檢查**：自動檢測 1 分鐘內的重複儲存
- **智能比對**：根據 `styleName` 和 `imageUrl` 判斷重複
- **容錯處理**：重複檢查失敗不會阻斷儲存流程

---

### GET /api/saved-outfits

取得使用者儲存的穿搭列表

#### Query Parameters

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| `userId` | string | ✅ | - | 使用者 UUID |
| `outfitType` | string | ❌ | `'saved'` | 穿搭類型：`'saved'` 或 `'confirmed'` |
| `occasion` | string | ❌ | - | 場合篩選 |
| `limit` | number | ❌ | `20` | 回傳數量限制 |

#### Example Request

```
GET /api/saved-outfits?userId=xxx&outfitType=saved&limit=10
```

#### Response - 成功 (200 OK)

```json
{
  "success": true,
  "outfits": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "outfit_data": {
        "imageUrl": "https://...",
        "styleName": "Casual Comfort",
        "description": "...",
        "items": [...]
      },
      "weather_info": { ... },
      "occasion": "casual",
      "outfit_type": "saved",
      "created_at": "2024-12-01T10:00:00Z",
      "updated_at": "2024-12-01T10:00:00Z"
    }
  ],
  "count": 10
}
```

#### Response - 錯誤 (400/500)

```json
{
  "success": false,
  "error": "Missing required parameter: userId",
  "details": "..."
}
```

---

## 🗄️ 資料表結構

### saved_outfits

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | UUID | 主鍵 |
| `user_id` | UUID | 使用者 ID |
| `outfit_data` | JSONB | 完整穿搭資料（圖片、名稱、描述、單品列表）|
| `items` | JSONB | 單品 ID 列表（legacy，可為 null）|
| `weather_info` | JSONB | 天氣資訊（可為 null）|
| `occasion` | VARCHAR(50) | 場合 |
| `outfit_type` | VARCHAR(20) | 類型：`'saved'` 或 `'confirmed'` |
| `created_at` | TIMESTAMPTZ | 建立時間 |
| `updated_at` | TIMESTAMPTZ | 更新時間 |

### 索引

- `idx_saved_outfits_user_id` - 根據使用者查詢
- `idx_saved_outfits_created_at` - 根據時間排序
- `idx_saved_outfits_occasion` - 根據場合篩選
- `idx_saved_outfits_user_type` - 組合索引（使用者 + 類型）
- `idx_saved_outfits_outfit_data_gin` - GIN 索引（jsonb 查詢）

---

## 🔒 安全性

### Row Level Security (RLS)

已啟用 RLS 並設定以下政策：

1. **SELECT** - 使用者只能查詢自己的穿搭
2. **INSERT** - 使用者只能新增自己的穿搭
3. **UPDATE** - 使用者只能更新自己的穿搭
4. **DELETE** - 使用者只能刪除自己的穿搭

### 驗證機制

- 所有請求必須提供有效的 `userId`
- `outfitData` 必須包含 `imageUrl` 和 `styleName`
- 自動檢查重複儲存（防止誤點）

---

## 📊 使用範例

### 前端整合範例

#### 儲存穿搭

```typescript
const saveOutfit = async (outfit: Outfit) => {
  const response = await fetch('/api/saved-outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'user-uuid',
      outfitData: {
        imageUrl: outfit.imageUrl,
        styleName: outfit.styleName,
        description: outfit.description,
        heroImageUrl: outfit.imageUrl,
        items: []
      },
      weather: currentWeather,
      occasion: 'casual',
      outfitType: 'saved',
      timestamp: new Date().toISOString()
    })
  });

  const result = await response.json();

  if (result.success) {
    if (response.status === 201) {
      toast.success('穿搭已儲存');
    } else {
      toast('此穿搭已在收藏中');
    }
  } else {
    toast.error(result.error);
  }
};
```

#### 讀取穿搭列表

```typescript
const loadSavedOutfits = async (userId: string) => {
  const response = await fetch(
    `/api/saved-outfits?userId=${userId}&outfitType=saved&limit=20`
  );

  const result = await response.json();

  if (result.success) {
    return result.outfits;
  } else {
    throw new Error(result.error);
  }
};
```

---

## 🚀 部署步驟

### 1. 執行 Migration

```bash
# 執行原始資料表建立
psql -U postgres -d your_database -f supabase/migrations/create_saved_outfits_table.sql

# 執行欄位更新
psql -U postgres -d your_database -f supabase/migrations/20241201_add_outfit_data_column.sql
```

### 2. 驗證資料表

```sql
-- 檢查資料表結構
\d saved_outfits

-- 檢查索引
\di saved_outfits*

-- 檢查 RLS 政策
SELECT * FROM pg_policies WHERE tablename = 'saved_outfits';
```

### 3. 測試 API

使用 Postman 或 curl 測試：

```bash
# POST 測試
curl -X POST http://localhost:3000/api/saved-outfits \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-uuid",
    "outfitData": {
      "imageUrl": "https://example.com/image.jpg",
      "styleName": "Test Outfit",
      "description": "Test Description"
    }
  }'

# GET 測試
curl http://localhost:3000/api/saved-outfits?userId=test-uuid
```

---

## 🐛 常見問題

### Q1: 為什麼重複儲存沒有被阻止？

A: 重複檢查僅在 1 分鐘內生效。如果超過 1 分鐘，可以重複儲存相同的穿搭。

### Q2: outfit_data 和 items 欄位有什麼區別？

A: `outfit_data` 是新版格式，包含完整的穿搭資訊。`items` 是 legacy 欄位，保留以向下相容。

### Q3: 如何在測試環境中關閉 RLS？

A: 不建議關閉 RLS。如需測試，請使用有效的 `auth.uid()`。

---

## 📝 更新日誌

### 2024-12-01
- ✅ 新增 `outfit_data` JSONB 欄位
- ✅ 實作重複儲存檢查
- ✅ 統一回傳格式（`success` + `savedOutfit`）
- ✅ 改善錯誤處理
- ✅ 新增 GIN 索引

### 2024-11-XX
- ✅ 初始版本建立
- ✅ 建立 RLS 政策
- ✅ 建立基本 CRUD 操作
