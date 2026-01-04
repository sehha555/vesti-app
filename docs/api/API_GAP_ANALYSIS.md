# Vesti API 缺口分析報告

**產出日期:** 2025年11月28日
**分析範圍:** 前端功能需求 vs 已實作 API 端點
**目的:** 識別缺失的 API 並規劃開發優先級

---

## 📊 執行摘要

### 當前 API 實作狀態
- ✅ **已完整實作:** 3 個模組 (衣櫃管理、基礎推薦、每日穿搭)
- ⚠️ **部分實作/使用 Mock 資料:** 4 個模組
- ❌ **完全缺失:** 8 個核心功能模組

### 關鍵發現
1. **推薦引擎:** 僅有 Mock 資料，未連接實際演算法服務
2. **商店與購物車:** 完全缺失後端 API，前端使用硬編碼資料
3. **使用者系統:** 缺少認證、個人資料、訂單管理 API
4. **AR 試穿:** 僅前端 UI，無後端處理邏輯
5. **天氣整合:** 僅在每日穿搭 API 內部使用，無獨立端點

---

## 🔍 已實作 API 清單

### 1. ✅ 衣櫃管理 API (Wardrobe Management)

#### 端點列表
| HTTP Method | 端點 | 功能 | 狀態 |
|-------------|------|------|------|
| GET | `/api/wardrobe/items?userId={userId}` | 取得使用者所有衣物 | ✅ 完整 |
| POST | `/api/wardrobe/items` | 新增衣物 | ✅ 完整 |
| PUT | `/api/wardrobe/items` | 更新衣物資訊 | ✅ 完整 |
| DELETE | `/api/wardrobe/items?id={id}` | 刪除衣物 | ✅ 完整 |
| POST | `/api/wardrobe/upload` | 上傳衣物圖片 (含去背) | ✅ 完整 |
| GET | `/api/wardrobe/items/[id]` | 取得單一衣物詳情 | ✅ 完整 |

#### 技術實作
- **資料庫:** Supabase (clothing_items 表)
- **圖片處理:**
  - Cloudinary (圖片上傳與儲存)
  - Remove.bg API (背景移除)
- **驗證:** 型別檢查 (WardrobeItem)
- **重複檢測:** 基於 `image_url` 的去重邏輯

#### 資料模型
```typescript
WardrobeItem {
  id, userId, name, type, imageUrl, originalImageUrl,
  colors, season, source, purchased, createdAt, updatedAt,
  style, material, pattern, occasions, customTags, shopProductId
}
```

---

### 2. ⚠️ 推薦系統 API (Recommendation System)

#### 2.1 購物籃混搭推薦 (Basket Mix-Match)
| HTTP Method | 端點 | 功能 | 狀態 |
|-------------|------|------|------|
| GET | `/api/reco/basket-mixmatch?userId={userId}&basketIds={ids}` | 購物籃商品搭配推薦 | ⚠️ Mock |
| POST | `/api/reco/basket-mixmatch/save` | 儲存推薦偏好 | ⚠️ 未驗證 |

**問題:**
- 回傳硬編碼的 Mock 資料
- 未連接 `services/reco/pipelines/basket_mixmatch/` 實際服務
- 推薦演算法未啟用 (scoreCompatibility, scoreOccasion 未使用)

**程式碼位置:** `apps/web/app/api/reco/basket-mixmatch/route.ts:30-46`

---

#### 2.2 衣櫃缺口分析 (Closet Gap Fill)
| HTTP Method | 端點 | 功能 | 狀態 |
|-------------|------|------|------|
| GET | `/api/reco/closet-gap-fill?userId={userId}` | 分析衣櫃缺少的品項 | ⚠️ Mock |

**問題:**
- 完全使用 Mock 資料
- 未實作缺口分析演算法
- 建議購買的商品為假資料

**程式碼位置:** `apps/web/app/api/reco/closet-gap-fill/route.ts:17-50`

---

#### 2.3 每日穿搭推薦 (Daily Outfits)
| HTTP Method | 端點 | 功能 | 狀態 |
|-------------|------|------|------|
| GET | `/api/daily-outfits?userId={userId}&latitude={lat}&longitude={lon}&occasion={occasion}` | 基於天氣與場合的穿搭推薦 | ✅ 部分完整 |
| POST | `/api/reco/daily-outfits/save` | 儲存每日穿搭偏好 | ⚠️ 未驗證 |

**狀態:**
- ✅ 已連接 `DailyOutfitsService`
- ✅ 整合天氣 API (`getWeather`)
- ✅ 整合 Wardrobe Service
- ⚠️ 天氣 API 可能為 Mock (需確認 `services/weather/` 實作)

**程式碼位置:** `apps/web/app/api/daily-outfits/route.ts:44-87`

---

### 3. ⚠️ 穿搭管理 API (Outfit Management)

| HTTP Method | 端點 | 功能 | 狀態 |
|-------------|------|------|------|
| GET | `/api/outfits?userId={userId}&tag={tag}&season={season}&occasion={occasion}` | 取得穿搭列表 | ✅ 完整 |
| POST | `/api/outfits` | 建立穿搭組合 | ✅ 完整 |
| GET | `/api/outfits/[id]` | 取得單一穿搭詳情 | ✅ 完整 |

**實作方式:**
- 使用記憶體內存儲 (`shared-outfit-store.ts`)
- 支援按標籤、季節、場合過濾
- 驗證包含 1-5 星評分

**限制:**
- ❌ 資料未持久化 (重啟遺失)
- ❌ 未使用 Supabase 或其他資料庫
- ❌ 無法跨使用者會話保存

---

### 4. ⚠️ 測試用 API

| HTTP Method | 端點 | 功能 | 狀態 |
|-------------|------|------|------|
| GET | `/api/test-cloudinary` | 測試 Cloudinary 連線 | ⚠️ 測試用 |

---

## ❌ 缺失的 API 模組

### 🔴 優先級 P0 (阻斷核心功能)

#### 1. **使用者認證與授權 API** (Authentication & Authorization)
**影響頁面:** ProfilePage, 所有需要 userId 的功能

**缺失端點:**
```
POST   /api/auth/register          - 使用者註冊
POST   /api/auth/login             - 登入
POST   /api/auth/logout            - 登出
GET    /api/auth/me                - 取得當前使用者資訊
POST   /api/auth/reset-password    - 重置密碼
PUT    /api/auth/update-profile    - 更新個人資料
POST   /api/auth/upload-avatar     - 上傳大頭照
```

**當前狀況:**
- 前端所有請求直接傳遞 `userId` (無驗證)
- 無 Session 或 JWT Token 機制
- 任何人可存取任何使用者資料

**建議技術:**
- NextAuth.js / Auth.js
- Supabase Auth
- JWT + HTTP-only Cookies

---

#### 2. **商店商品 API** (Store & Product Catalog)
**影響頁面:** StorePage, CheckoutPage, DiscountPage

**缺失端點:**
```
GET    /api/products               - 取得商品列表 (支援篩選、分頁)
GET    /api/products/[id]          - 取得商品詳情
GET    /api/products/search        - 商品搜尋
GET    /api/products/featured      - 精選商品
GET    /api/stores                 - 商店列表
GET    /api/stores/[id]/products   - 商店商品
GET    /api/outfit-packs           - 穿搭套裝列表
GET    /api/outfit-packs/[id]      - 穿搭套裝詳情
```

**當前狀況:**
- StorePage.tsx 使用硬編碼的 `featuredStores`, `featuredProducts`, `outfitSets`
- 無法動態更新商品資訊
- 無庫存管理

**資料來源建議:**
- 連接 `services/catalog/` 服務
- Supabase 建立 `products`, `stores`, `outfit_packs` 表

---

#### 3. **購物車 API** (Shopping Cart)
**影響頁面:** CheckoutPage, StorePage (加入購物車功能)

**缺失端點:**
```
GET    /api/cart?userId={userId}        - 取得購物車內容
POST   /api/cart/items                  - 加入商品到購物車
PUT    /api/cart/items/[id]             - 更新購物車商品 (數量、尺寸等)
DELETE /api/cart/items/[id]             - 移除購物車商品
DELETE /api/cart/clear                  - 清空購物車
POST   /api/cart/apply-coupon           - 套用優惠碼
```

**當前狀況:**
- CheckoutPage.tsx 使用 `useState` 管理本地狀態 (`mockCartItems`)
- 重新整理頁面後購物車資料遺失
- 無法跨裝置同步購物車

**資料模型:**
```typescript
CartItem {
  id, userId, productId, name, price, imageUrl,
  brand, quantity, size, color, addedAt
}
```

---

#### 4. **訂單與支付 API** (Orders & Payments)
**影響頁面:** CheckoutPage, ProfilePage (訂單歷史)

**缺失端點:**
```
POST   /api/orders                      - 建立訂單
GET    /api/orders?userId={userId}      - 取得訂單列表
GET    /api/orders/[id]                 - 訂單詳情
PUT    /api/orders/[id]/cancel          - 取消訂單
POST   /api/payments/process            - 處理付款
POST   /api/payments/webhook            - 支付閘道 Webhook
GET    /api/payments/methods            - 取得支付方式
```

**當前狀況:**
- CheckoutPage 完全無後端整合
- ProfilePage 顯示硬編碼的 `recentOrders`
- 無實際金流處理

**建議整合:**
- 連接 `services/cart-payments/` 服務
- 整合第三方支付 (Stripe, ECPay, 綠界等)

---

### 🟡 優先級 P1 (重要功能)

#### 5. **使用者個人資料 API** (User Profile)
**影響頁面:** ProfilePage

**缺失端點:**
```
GET    /api/users/[userId]/profile          - 取得個人檔案
PUT    /api/users/[userId]/profile          - 更新個人檔案
POST   /api/users/[userId]/measurements     - 儲存身體尺寸
GET    /api/users/[userId]/measurements     - 取得身體尺寸
PUT    /api/users/[userId]/ai-settings      - 更新 AI 推薦設定
GET    /api/users/[userId]/ai-settings      - 取得 AI 推薦設定
POST   /api/users/[userId]/try-on-photo     - 上傳試穿照片
GET    /api/users/[userId]/statistics       - 取得使用者統計 (衣櫃分佈等)
```

**當前狀況:**
- ProfilePage 所有資料存在本地 state
- 無法持久化使用者設定
- 衣櫃顏色/分類統計無後端支援

**資料模型:**
```typescript
UserProfile {
  userId, name, email, phone, avatarUrl,
  tryOnPhotoUrl, measurements: BodyMeasurements,
  aiSettings: AISettings, createdAt, updatedAt
}
```

---

#### 6. **地址管理 API** (Address Management)
**影響頁面:** CheckoutPage, ProfilePage

**缺失端點:**
```
GET    /api/addresses?userId={userId}   - 取得地址列表
POST   /api/addresses                   - 新增地址
PUT    /api/addresses/[id]              - 更新地址
DELETE /api/addresses/[id]              - 刪除地址
PUT    /api/addresses/[id]/set-default  - 設為預設地址
```

**當前狀況:**
- CheckoutPage 使用硬編碼 `mockAddresses`
- 無地址驗證

---

#### 7. **優惠券與折扣 API** (Coupons & Discounts)
**影響頁面:** CheckoutPage, DiscountPage

**缺失端點:**
```
GET    /api/coupons/available?userId={userId}  - 可用優惠券
POST   /api/coupons/validate                   - 驗證優惠碼
GET    /api/discounts/active                   - 當前活動折扣
GET    /api/discounts/products                 - 折扣商品列表
```

**當前狀況:**
- CheckoutPage 優惠碼功能無後端驗證
- DiscountPage 顯示假資料

---

#### 8. **虛擬試穿 API** (AR Try-On)
**影響頁面:** TryOnPage

**缺失端點:**
```
POST   /api/tryon/generate              - 生成虛擬試穿圖片
GET    /api/tryon/history?userId={id}   - 試穿歷史記錄
POST   /api/tryon/save                  - 儲存試穿結果
```

**當前狀況:**
- TryOnPage 完全無後端整合
- 無 AI 模型處理
- 服務層 `services/tryon/` 狀態不明

**技術需求:**
- AI 模型整合 (VITON-HD, TryOnDiffusion 等)
- GPU 運算資源
- 可能需要第三方 API (Virtooal, Veesual 等)

---

### 🟢 優先級 P2 (優化功能)

#### 9. **推薦引擎事件追蹤 API** (Recommendation Events)
**影響頁面:** 所有頁面 (使用者行為追蹤)

**部分存在但未完整:**
```
POST   /api/reco/events                 - 記錄使用者互動事件
```

**當前狀況:**
- `lib/api.ts` 已定義 `logInteractionEvent()` 函數
- 端點 `/api/reco/events` **不存在**
- 前端呼叫會失敗

**需要記錄的事件:**
- 商品瀏覽 (view)
- 加入購物車 (add_to_cart)
- 試穿 (try_on)
- 喜歡/不喜歡 (like/dislike)
- 購買 (purchase)

---

#### 10. **天氣 API** (Weather Service)
**影響頁面:** Home (WeatherCard), 每日穿搭推薦

**缺失端點:**
```
GET    /api/weather?latitude={lat}&longitude={lon}  - 取得天氣資訊
GET    /api/weather/forecast?location={location}    - 天氣預報
```

**當前狀況:**
- `services/weather/` 服務存在但未暴露為 API 端點
- 僅在 `/api/daily-outfits` 內部使用
- 前端 WeatherCard 可能使用假資料或客戶端 API

**建議:**
- 整合 OpenWeatherMap API
- 或使用 WeatherAPI.com

---

#### 11. **探索頁面 API** (Explore Page)
**影響頁面:** ExplorePage

**缺失端點:**
```
GET    /api/explore/trending            - 流行趨勢穿搭
GET    /api/explore/recommendations     - 個人化推薦內容
GET    /api/explore/outfits             - 穿搭靈感
GET    /api/explore/collections         - 精選系列
```

**當前狀況:**
- ExplorePage 完全使用前端假資料
- 無動態內容

---

#### 12. **搜尋 API** (Search)
**影響頁面:** StorePage, WardrobePage, ExplorePage (搜尋功能)

**缺失端點:**
```
GET    /api/search?q={query}&type={type}  - 全域搜尋 (商品/穿搭/衣物)
GET    /api/search/suggestions            - 搜尋建議
```

**當前狀況:**
- 各頁面搜尋僅為前端過濾
- 無搜尋歷史記錄

---

#### 13. **通知 API** (Notifications)
**影響頁面:** 全局 (通知功能)

**缺失端點:**
```
GET    /api/notifications?userId={userId}      - 取得通知列表
PUT    /api/notifications/[id]/mark-read       - 標記已讀
POST   /api/notifications/subscribe            - 訂閱推播
```

**當前狀況:**
- 服務層 `services/notifications/` 存在但未整合
- 前端使用 Sonner Toast (僅本地)

---

## 📋 API 優先開發建議

### 第一階段 (必須完成才能上線)
1. ✅ **使用者認證 API** - 資安與使用者管理基礎
2. ✅ **商店商品 API** - 商業核心功能
3. ✅ **購物車 API** - 購物流程基礎
4. ✅ **訂單與支付 API** - 營收關鍵

### 第二階段 (提升使用者體驗)
5. ✅ **使用者個人資料 API** - 個人化基礎
6. ✅ **地址管理 API** - 完整購物流程
7. ✅ **優惠券 API** - 促銷活動
8. ⚠️ **推薦引擎實際整合** - 將 Mock 替換為真實演算法

### 第三階段 (差異化功能)
9. ✅ **虛擬試穿 API** - 核心賣點
10. ✅ **天氣 API** - 智能推薦
11. ✅ **探索內容 API** - 內容運營

### 第四階段 (優化與增長)
12. ✅ **搜尋 API** - 使用體驗
13. ✅ **通知 API** - 用戶留存
14. ✅ **事件追蹤 API** - 資料分析

---

## 🔧 技術債務與改進建議

### 1. 資料持久化問題
**問題:**
- `shared-outfit-store.ts` 使用記憶體存儲
- `CheckoutPage`, `ProfilePage` 大量本地狀態

**建議:**
- 所有穿搭資料遷移至 Supabase
- 實作前端狀態管理 (Zustand / Jotai)

---

### 2. Mock 資料替換
**問題:**
- `/api/reco/basket-mixmatch` 回傳假資料
- `/api/reco/closet-gap-fill` 回傳假資料

**建議:**
```typescript
// 當前 (apps/web/app/api/reco/basket-mixmatch/route.ts)
const baseRecommendation = { /* 硬編碼 */ };

// 應改為
import { BasketMixmatchService } from '@/services/reco/pipelines/basket_mixmatch';
const service = new BasketMixmatchService();
const recommendations = await service.generate(userId, basketIds);
```

---

### 3. API 客戶端一致性
**問題:**
- `lib/api.ts` 僅涵蓋部分 API
- 部分元件直接使用 `fetch()`

**建議:**
- 所有 API 呼叫統一由 `lib/api.ts` 管理
- 新增缺失的 API 客戶端函數

---

### 4. 錯誤處理標準化
**問題:**
- 不同 API 錯誤格式不一致
- 部分 API 缺少詳細錯誤訊息

**建議:**
```typescript
// 統一錯誤回應格式
interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
}
```

---

### 5. API 文件缺失
**問題:**
- 無 Swagger / OpenAPI 規格
- 部分端點無註解

**建議:**
- 使用 `next-swagger-doc` 生成 API 文件
- 每個 API Route 加上 JSDoc 註解 (如 `/api/daily-outfits/route.ts:8-43` 已有範例)

---

## 📊 API 實作完整度矩陣

| 功能模組 | 前端需求 | 後端 API | 服務層 | 資料庫 | 完整度 |
|---------|---------|---------|--------|--------|--------|
| 衣櫃管理 | ✅ | ✅ | ✅ | ✅ Supabase | 100% |
| 圖片上傳 | ✅ | ✅ | ✅ | ✅ Cloudinary | 100% |
| 每日穿搭 | ✅ | ✅ | ✅ | ⚠️ 部分 | 75% |
| 穿搭管理 | ✅ | ✅ | ⚠️ 記憶體 | ❌ | 60% |
| 購物籃推薦 | ✅ | ⚠️ Mock | ✅ 未連接 | ❌ | 30% |
| 衣櫃缺口 | ✅ | ⚠️ Mock | ❌ | ❌ | 20% |
| **使用者認證** | ✅ | ❌ | ❌ | ❌ | 0% |
| **商店商品** | ✅ | ❌ | ⚠️ 存在 | ❌ | 0% |
| **購物車** | ✅ | ❌ | ⚠️ 存在 | ❌ | 0% |
| **訂單支付** | ✅ | ❌ | ⚠️ 存在 | ❌ | 0% |
| **個人資料** | ✅ | ❌ | ❌ | ❌ | 0% |
| **地址管理** | ✅ | ❌ | ❌ | ❌ | 0% |
| **優惠券** | ✅ | ❌ | ❌ | ❌ | 0% |
| **虛擬試穿** | ✅ | ❌ | ⚠️ 存在 | ❌ | 0% |
| **天氣服務** | ✅ | ❌ | ✅ | N/A | 50% |
| **探索內容** | ✅ | ❌ | ❌ | ❌ | 0% |
| **搜尋** | ✅ | ❌ | ❌ | ❌ | 0% |
| **通知** | ⚠️ | ❌ | ⚠️ 存在 | ❌ | 0% |

**整體 API 實作完整度: 約 28%**

---

## 🎯 下一步行動計畫

### 立即行動 (本週)
1. [ ] 實作使用者認證系統 (NextAuth.js + Supabase)
2. [ ] 建立 Supabase 資料表 schema (users, products, orders, cart)
3. [ ] 將推薦 API Mock 資料替換為實際服務呼叫

### 短期目標 (2 週內)
4. [ ] 完成商店商品 API (連接 catalog 服務)
5. [ ] 完成購物車 API
6. [ ] 完成訂單與支付流程 API
7. [ ] 整合第三方支付閘道

### 中期目標 (1 個月內)
8. [ ] 完成個人資料與地址管理 API
9. [ ] 實作優惠券系統
10. [ ] 整合天氣 API
11. [ ] 完成虛擬試穿 MVP

### 長期目標 (2-3 個月)
12. [ ] 探索內容推薦系統
13. [ ] 全域搜尋功能
14. [ ] 通知系統
15. [ ] 完整事件追蹤與分析

---

## 📞 相關資源

### 程式碼位置
- **已實作 API:** `apps/web/app/api/`
- **服務層:** `services/`
- **API 客戶端:** `apps/web/lib/api.ts`
- **型別定義:** `packages/types/src/`

### 推薦工具
- **API 文件:** Swagger / OpenAPI
- **狀態管理:** Zustand, Jotai
- **認證:** NextAuth.js, Supabase Auth
- **支付:** Stripe, ECPay
- **API 測試:** Postman, Insomnia

---

**報告結束**

此分析涵蓋了 Vesti 專案所有核心功能的 API 缺口，並提供了詳細的開發優先級建議。建議優先處理 P0 等級的 API，以確保系統核心功能可運作。
