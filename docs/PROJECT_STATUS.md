# Vesti 專案狀態報告

本報告旨在提供 Vesti 專案的整體技術概覽，特別聚焦於後端服務的當前狀態、專案結構、核心功能與未來建議。

## 1. 專案結構 (Project Structure)

專案採用 Monorepo 結構，將前端應用、後端服務、共享型別等分離管理，結構清晰。與後端直接相關的目錄如下：

-   **`apps/web/`**: 主要的 Next.js 應用程式，包含了前端頁面和後端 API。
    -   **`apps/web/app/api/`**: **後端 API 核心位置**。所有主要的 API 路由 (API Routes) 都定義在此，遵循 Next.js App Router 的檔案結構。
-   **`packages/types/`**: **共享資料模型**。所有後端 API 和前端通用的 TypeScript 型別 (`interface`, `type`) 都集中在此，是專案資料結構的「單一事實來源」(Single Source of Truth)。
-   **`services/`**: **核心業務邏輯與服務**。此目錄包含獨立的業務邏輯（如推薦引擎、天氣服務），以及部分舊有的或模擬的 API 處理程序。
-   **`docs/`**: 專案文件目錄。

## 2. 後端技術棧 (Backend Technology Stack)

後端技術選型現代且高效，以 Next.js 和 Supabase 為核心。

| 組件 | 技術/工具 | 狀態與分析 |
| :--- | :--- | :--- |
| **API 框架** | **Next.js API Routes** | 主要使用 Next.js 13+ 的 App Router (`app/api/.../route.ts`)。 |
| **資料庫 ORM** | **Supabase Client** | **沒有使用**傳統的 ORM (如 Prisma)。所有資料庫操作通過 `supabase-js` 客戶端庫直接進行。 |
| **資料庫** | **Supabase (PostgreSQL)** | 從 API 的實作中可見，資料主要儲存在 Supabase 提供的 PostgreSQL 資料庫中。 |
| **資料驗證** | **Zod** | 專案引入了 `zod`，是主要的資料驗證工具。 |
| **認證機制** | **Supabase Auth** | 依賴 `@supabase/ssr` 和 `@supabase/supabase-js` 進行認證。**存在安全隱患**，API 端點未做嚴格的伺服器端會話驗證。 |

## 3. 核心功能與 API (Backend Core Features & APIs)

後端功能完成度不一，核心的「虛擬衣櫃」功能最為完整，而推薦和購物功能則多處於原型或模擬階段。

### 虛擬衣櫃 (Virtual Wardrobe)

此為專案目前最完整、已達到生產標準的核心功能。

-   **核心結構**: `WardrobeItem` (定義於 `packages/types/src/wardrobe.ts`)。此模型非常詳盡，包含了衣物的基本資訊、AI 識別屬性（顏色、風格）、用戶自訂標籤、來源等。
-   **主要 API**:
    -   `POST /api/wardrobe/upload`: 處理衣物圖片上傳、背景移除、存入 Cloudinary，並將中繼資料寫入 Supabase 資料庫。
    -   `GET, POST, PUT, DELETE /api/wardrobe/items/*`: 提供對衣物項目 (`clothing_items` 表) 完整的 CRUD (增、刪、改、查) 功能，直接對接 Supabase 資料庫。
-   **功能狀態**: **已實作**。功能完整且已連接到真實的後端資料庫。

### 穿搭組合 (Outfits)

穿搭組合的功能骨架已搭建，但資料並未持久化。

-   **核心結構**: `Outfit` (定義於 `packages/types/src/outfit.ts`)。代表一套由多個 `WardrobeItem` ID 組成的穿搭。
-   **主要 API**:
    -   `GET, POST, PUT, DELETE /api/outfits/*`: 提供對穿搭組合的 CRUD 操作。
-   **功能狀態**: **模擬 (Mock)**。API 存在，但所有資料都儲存在伺服器的記憶體中 (`in-memory store`)，服務重啟後即會遺失，尚未對接資料庫。

### AI 推薦 (AI Recommendation)

推薦功能的 API 路由已建立，但後端邏輯均為寫死的模擬數據。

-   **核心結構**: `CatalogItem`, `GapSuggestion` (定義於 `packages/types/src/gap.ts`)。
-   **主要 API**:
    -   `GET /api/daily-outfits`: 每日穿搭推薦。已串接天氣服務，但推薦邏輯為模擬。
    -   `GET /api/reco/closet-gap-fill`: 衣櫃縫隙填充推薦。
    -   `GET /api/reco/basket-mixmatch`: 購物籃商品混搭推薦。
-   **功能狀態**: **原型/模擬 (Prototype/Mock)**。所有推薦結果都是硬編碼 (hardcoded) 的 JSON 數據，尚未實現真正的推薦演算法。

### 購物與支付 (Shopping & Payments)

此功能處於非常早期的模擬階段。

-   **核心結構**: `Cart`, `CartItem` (定義於 `packages/types/src/cart.ts`)。
-   **主要 API**: 相關邏輯位於 `services/cart-payments/index.ts`。
-   **功能狀態**: **模擬 (Mock)**。購物車和支付功能是基於舊版 API 風格和記憶體資料庫的模擬實現。

## 4. 後端狀態總結與建議

**總結**:
專案後端基礎良好，技術選型現代化，且核心的「虛擬衣櫃」功能已基本完成。然而，專案整體仍處於從原型向產品過渡的階段，多數核心業務（推薦、購物）尚未實現，且在安全性和穩定性方面存在明顯的短板。

**優先級建議**:

| 優先級 | 建議項目 | 說明與理由 |
| :--- | :--- | :--- |
| **1 (最高)** | **修復 API 認證漏洞** | **(安全性)** 立即重構所有 API，使用 `@supabase/ssr` 在伺服器端驗證用戶會話，絕不能再信任客戶端傳來的 `userId`，這是防止數據洩露的基礎。 |
| **2 (高)** | **引入資料庫遷移工具** | **(穩定性)** 為專案添加資料庫結構的版本控制（如 Supabase Migrations 或 Prisma），確保團隊和不同環境間的資料庫結構一致性。 |
| **3 (中)** | **完成核心功能後端邏輯** | **(功能性)** 逐步替換 AI 推薦和購物功能中的模擬數據，實現真正的業務邏輯，並將「穿搭組合」功能對接資料庫。 |
| **4 (中)** | **為 API 路由編寫測試** | **(品質)** 為關鍵 API（如衣櫃 CRUD）編寫整合測試，確保端點的行為符合預期。 |
| **5 (低)** | **建立統一的錯誤處理與 API 文件** | **(可維護性)** 建立標準化的錯誤處理機制，並推廣 Swagger 註解以自動生成 API 文件，提升長期可維護性。 |

