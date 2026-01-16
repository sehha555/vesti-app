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

穿搭組合的功能骨架已搭建，API 層安全性已强化，但資料仍未持久化至資料庫。

-   **核心結構**: `Outfit` (定義於 `packages/types/src/outfit.ts`)。引入 `OutfitsCreateRequestSchema` (Zod)，支援新式格式（含 userId）與遺留格式（無 userId）。
-   **主要 API**:
    -   `GET, POST, PUT, DELETE /api/outfits/*`: 提供對穿搭組合的 CRUD 操作。
    -   **安全改進** (2026-01-16):
        - ✅ Zod schema 驗證：強制 userId（UUID）、name（非空 trim）、itemIds（UUID array）
        - ✅ 使用 `getSupabaseAndUser()` 取得已驗證用戶身份（移除不安全的 token 字串解析）
        - ✅ 遺留 payload 支持：無 userId 時自動從認證會話提取，支援環境變數 `ENABLE_LEGACY_OUTFITS_PAYLOAD` 控制
        - ✅ 成本/安全日誌：新增 `sanitizeUserAgent()`（CRLF 清理 + 多重空白壓縮 + 256 字元截斷）與 `logDeprecationMetric()`（結構化 JSON，不記敏感數據）
        - ✅ 生產環境隱藏驗證錯誤詳情（NODE_ENV 檢查）
        - ✅ 所有錯誤回應加 `Cache-Control: private, no-store` 標頭
-   **功能狀態**: **部分已實作 (Partially Implemented)**。API 層驗證與安全認證已完成，但資料仍儲存在伺服器記憶體中。**下一步**：需完成 ownership verification（防止用戶濫用他人 userId），並將資料對接資料庫。

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

**總結** (更新於 2026-01-16):
專案後端基礎良好，技術選型現代化。核心的「虛擬衣櫃」功能已基本完成；「穿搭組合」API 層安全性已強化（Zod schema、Supabase Auth、deprecation logging）。然而，專案整體仍處於從原型向產品過渡的階段，多數核心業務（推薦、購物）尚未實現，資料持久化不完整，ownership verification 尚缺。

**優先級建議** (更新版):

| 優先級 | 建議項目 | 狀態 | 說明與理由 |
| :--- | :--- | :--- | :--- |
| **1 (最高)** | **Ownership Verification + Authorization** | 🔄 進行中 | **(安全性)** 已完成 Outfits API 的 Supabase Auth 集成，但仍需在所有 CRUD 端點加入 ownership 檢查（防止用戶 A 查看/修改用戶 B 的資料）。GET /api/outfits 也須驗證已登入用戶身份。 |
| **2 (高)** | **資料持久化：Outfits 對接資料庫** | ⏳ 待開始 | **(功能性)** 將「穿搭組合」從 in-memory store 遷移至 Supabase PostgreSQL，確保資料持久化。建議與資料庫遷移工具一併推進。 |
| **3 (高)** | **引入資料庫遷移工具 + Schema 版本控制** | ⏳ 待開始 | **(穩定性)** 為專案添加資料庫結構的版本控制（如 Supabase Migrations 或 Prisma），確保團隊和不同環境間的資料庫結構一致性。 |
| **4 (中)** | **標準化 API 錯誤處理與安全日誌** | 🔄 進行中 | **(可維護性)** 已為 Outfits API 建立基礎的 `logDeprecationMetric()` 與環境感知的錯誤回應。需推廣至其他 API 端點，建立統一的安全事件記錄機制。 |
| **5 (中)** | **完成核心功能後端邏輯** | ⏳ 待開始 | **(功能性)** 逐步替換 AI 推薦和購物功能中的模擬數據，實現真正的業務邏輯。 |
| **6 (低)** | **API 文件與測試覆蓋率** | 🔄 進行中 | **(品質)** 已為 Outfits API 加入基礎測試覆蓋。建議持續擴展至其他 API，並建立 Swagger 文件。 |

