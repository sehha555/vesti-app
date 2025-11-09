# Pages Router 遷移執行計劃

**版本:** 1.0
**日期:** 2025-11-09
**基於:** `docs/migration-plan.md`

本文件提供具體的執行清單，用於將專案從 Pages Router 遷移至 App Router。

---

## 第 1 階段：API 路由遷移

### 1.1 待辦清單

#### A) 直接遷移的 API

以下 API 在 `app/` 目錄中沒有對應項，可以優先直接遷移。

- [ ] **`pages/api/outfits/index.ts`** → `app/api/outfits/route.ts`
- [ ] **`pages/api/outfits/[id].ts`** → `app/api/outfits/[id]/route.ts`
- [ ] **`pages/api/reco/basket-mixmatch.ts`** → `app/api/reco/basket-mixmatch/route.ts`
- [ ] **`pages/api/reco/closet-gap-fill.ts`** → `app/api/reco/closet-gap-fill/route.ts`
- [ ] **`pages/api/reco/basket-mixmatch/save.ts`** → `app/api/reco/basket-mixmatch/save/route.ts`
- [ ] **`pages/api/reco/daily-outfits/save.ts`** → `app/api/reco/daily-outfits/save/route.ts`
- [ ] **`pages/api/test-cloudinary.ts`** → `app/api/test-cloudinary/route.ts`

#### B) 需要合併或重構的 API

以下 API 在 `pages/` 和 `app/` 中存在功能重疊，需要謹慎處理。

- [ ] **合併 `daily-outfits`**:
    - **源**: `pages/api/reco/daily-outfits.ts` (Mock 數據)
    - **目標**: `app/api/daily-outfits/route.ts` (已有邏輯)
    - **策略**: 審查 `pages` 版本中的 mock 邏輯，確認是否仍有價值。如果 `app` 版本已實現完整功能，則直接棄用 `pages` 版本；否則，將其作為測試資料整合進 `app` 版本的開發環境中。

- [ ] **重構 `upload` 到 `wardrobe`**:
    - **源**: `pages/api/upload.ts`
    - **目標**: `app/api/wardrobe/upload/route.ts` (新檔案)
    - **策略**: `upload.ts` 的核心功能是上傳圖片並建立衣物 (`wardrobe item`)。這在功能上屬於 `wardrobe` 模組。應將其完整邏輯遷移到 `app/api/wardrobe/` 下的新路由，並使用 App Router 的 `req.formData()` 來處理檔案上傳，取代 `formidable`。

### 1.2 執行步驟 (適用於每個 API)

1.  **建立目標檔案**: 在 `app/api/` 下建立對應的 `route.ts` 檔案。
2.  **轉換程式碼**:
    - 將 `export default function handler(req, res)` 轉換為 `export async function GET(req, { params })` 或 `POST`, `PUT`, `DELETE`。
    - 使用 `NextResponse.json()` 取代 `res.status().json()`。
    - 從 `req.nextUrl.searchParams` 獲取查詢參數。
    - 從 `params` 獲取動態路由參數。
    - 使用 `await req.json()` 或 `await req.formData()` 獲取請求主體。
3.  **測試端點**: 使用 Postman 或自動化測試工具，驗證新端點的功能、參數和回應是否與舊版一致。
4.  **(遷移完成後) 刪除舊檔案**: 在所有 API 遷移並測試完畢後，統一刪除 `pages/api/` 下的對應檔案。

---

## 第 2 階段：頁面元件遷移

### 2.1 待辦清單

以下頁面需要從 `pages/` 目錄遷移到 `app/` 目錄。

- [ ] **`pages/basket/index.tsx`** → `app/basket/page.tsx`
- [ ] **`pages/cart/index.tsx`** → `app/cart/page.tsx`
- [ ] **`pages/daily/index.tsx`** → `app/daily/page.tsx`
- [ ] **`pages/gap-fill/index.tsx`** → `app/gap-fill/page.tsx`

### 2.2 執行步驟 (適用於每個頁面)

1.  **建立目標目錄與檔案**: 在 `app/` 下建立對應的路由目錄和 `page.tsx` 檔案 (例如 `app/basket/page.tsx`)。
2.  **標記為客戶端元件**: 由於所有頁面都使用了 `useState`, `useEffect` 等 Hooks，它們必須是 Client Components。在 `page.tsx` 檔案頂部加上 `'use client';`。
3.  **複製元件程式碼**: 將 `pages/.../index.tsx` 中的 React 元件程式碼複製到新的 `page.tsx` 中。
4.  **更新路由相關 Hooks**:
    - 如果使用了 `next/router` 的 `useRouter`，將其替換為 `next/navigation` 中的 `useRouter`, `usePathname`, `useSearchParams`。
5.  **更新資料獲取邏輯**:
    - 檢查所有 `fetch` 請求的 URL，確保它們指向**遷移後的新 API 端點** (例如 `/api/reco/basket-mixmatch` 可能需要更新)。
6.  **測試頁面功能**: 在瀏覽器中訪問新路由，驗證 UI 顯示、互動和資料載入是否與原頁面完全一致。

---

## 第 3 階段：清理與最終驗證

- [ ] **刪除 `pages/api`**: 確認所有 API 端點都已成功遷移並在生產環境中穩定運行後，刪除整個 `apps/web/pages/api` 目錄。
- [ ] **刪除 `pages/` 下的頁面目錄**: 確認所有頁面都已成功遷移後，逐個刪除 `apps/web/pages/` 下的 `basket`, `cart`, `daily`, `gap-fill` 目錄。
- [ ] **刪除 `pages/` 根目錄**: 當 `pages` 目錄下所有內容都清空後，刪除 `apps/web/pages` 目錄。
- [ ] **進行全站迴歸測試**: 執行端對端測試，確保整個應用程式的功能完整性。
- [ ] **更新文件**: 更新 `README.md` 和專案架構圖，移除對 `pages` 目錄的描述。
