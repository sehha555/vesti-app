# Next.js Pages Router 遷移至 App Router 計劃

**版本:** 1.0
**日期:** 2025-11-09
**作者:** Gemini AI

## 1. 總覽

本文件旨在為 Next.js 專案從 Pages Router (`/pages`) 遷移至 App Router (`/app`) 提供一份詳細的行動計劃。目標是統一專案的路由和渲染模型，利用 App Router 的新特性（如 Server Components, Layouts），並消除混合路由帶來的維護困難。

**核心問題:** 目前專案在 `apps/web` 中同時存在 `pages/` 和 `app/` 目錄，導致路由規則混亂、API 端點分散。

**最終目標:**
1.  將 `pages/` 目錄下的所有頁面和 API 路由完全遷移至 `app/` 目錄。
2.  移除 `pages/` 目錄。
3.  統一 API 路由管理。
4.  將所有頁面轉換為符合 App Router 模式的元件。

---

## 2. `pages` 目錄結構分析

### 2.1 頁面元件 (`.tsx`)

| 原始檔案路徑                  | URL Path     | 類型           | 資料獲取方式                  | 備註                                       |
| ----------------------------- | ------------ | -------------- | ----------------------------- | ------------------------------------------ |
| `pages/basket/index.tsx`      | `/basket`    | 頁面 (Page)    | Client-side (`useEffect`/`fetch`) | 向 `/api/reco/basket-mixmatch` 發送請求。  |
| `pages/cart/index.tsx`        | `/cart`      | 頁面 (Page)    | Client-side (`useEffect`/`fetch`) | 向 `/api/cart-payments` 等 API 發送請求。    |
| `pages/daily/index.tsx`       | `/daily`     | 頁面 (Page)    | Client-side (`useEffect`/`fetch`) | 向 `/api/daily-outfits` 等 API 發送請求。  |
| `pages/gap-fill/index.tsx`    | `/gap-fill`  | 頁面 (Page)    | Client-side (`useEffect`/`fetch`) | 向 `/api/reco/closet-gap-fill` 發送請求。 |

**分析結論:**
- 所有頁面元件都是 **純客戶端渲染 (Client-Side Rendering)**。
- 頁面在 `useEffect` Hook 中使用 `fetch` API 獲取資料。
- **沒有使用** `getServerSideProps` 或 `getStaticProps`。這極大地簡化了頁面遷移的複雜度，因為它們可以直接轉換為 Client Components。

### 2.2 API 路由 (`.ts`)

| 原始檔案路徑                                   | API Endpoint                             | HTTP Methods   | 依賴與備註                                         |
| ---------------------------------------------- | ---------------------------------------- | -------------- | -------------------------------------------------- |
| `pages/api/outfits/index.ts`                   | `/api/outfits`                           | `GET`, `POST`    | 讀寫 `shared-outfit-store`。                       |
| `pages/api/outfits/[id].ts`                    | `/api/outfits/[id]`                      | `GET`, `PUT`, `DELETE` | 動態路由，讀寫 `shared-outfit-store`。             |
| `pages/api/reco/basket-mixmatch.ts`            | `/api/reco/basket-mixmatch`              | `POST`         | Mock 資料。                                        |
| `pages/api/reco/basket-mixmatch/save.ts`       | `/api/reco/basket-mixmatch/save`         | `POST`         | Mock 資料。                                        |
| `pages/api/reco/closet-gap-fill.ts`            | `/api/reco/closet-gap-fill`              | `POST`         | Mock 資料。                                        |
| `pages/api/reco/daily-outfits.ts`              | `/api/reco/daily-outfits`                | `POST`         | Mock 資料。                                        |
| `pages/api/reco/daily-outfits/save.ts`         | `/api/reco/daily-outfits/save`           | `POST`         | Mock 資料。                                        |
| `pages/api/test-cloudinary.ts`                 | `/api/test-cloudinary`                   | `GET`          | 依賴 `cloudinary` 和環境變數。                   |
| `pages/api/upload.ts`                          | `/api/upload`                            | `POST`         | 依賴 `cloudinary`, `formidable`, `remove.bg`。 **使用了自訂的 `api.bodyParser: false` 設定。** |

**分析結論:**
- 所有 API 路由都使用標準的 `(req: NextApiRequest, res: NextApiResponse)` 處理器。
- `upload.ts` 是最複雜的端點，它處理檔案上傳並禁用了`bodyParser`，遷移時需要特別處理。

---

## 3. 現有 `app` 目錄分析與衝突

根據專案結構，`app/` 目錄下已存在 `api/daily-outfits/` 和 `api/wardrobe/`。這與 `pages/api/` 中的路由存在**命名與功能上的衝突**。

- **衝突點**:
  - `pages/api/reco/daily-outfits.ts` vs `app/api/daily-outfits/`
  - `pages/api/outfits/` (與衣櫥相關) vs `app/api/wardrobe/`

**決策**: 在遷移過程中，必須決定保留、合併還是廢棄 `pages/api` 中的舊邏輯。**本計劃假設 `app/api/` 中的路由是新標準，`pages/api/` 中的邏輯需要被整合進來。**

---

## 4. 遷移策略與步驟

### 4.1 總體策略

1.  **優先遷移 API 路由**: API 是應用的基礎，應首先遷移以確保前端頁面可以依賴穩定的新端點。
2.  **逐個遷移頁面**: 完成 API 遷移後，逐個遷移頁面元件，每次遷移都進行充分測試。
3.  **標記為客戶端元件**: 由於所有現有頁面都依賴 `useState` 和 `useEffect`，它們都將被轉換為 Client Components，在檔案頂部加上 `'use client';`。
4.  **驗證與清理**: 所有遷移完成並通過測試後，刪除 `pages/` 目錄。

### 4.2 API 路由遷移詳細步驟

對於 `pages/api/` 中的每個檔案，執行以下操作：

1.  **建立目標檔案**: App Router 中，API 路由在 `route.ts` 檔案中定義。
2.  **轉換處理器**: 將 `(req, res)` 處理器轉換為具名的 `HTTP Method` 函數 (如 `GET`, `POST`)。

**範例：遷移 `pages/api/outfits/[id].ts` 的 GET 方法**

**原始碼 (`pages/api/outfits/[id].ts`)**
```typescript
// ...
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { id, userId } = req.query;
    // ... logic
    const outfit = getOutfitById(userId, id);
    return res.status(200).json(outfit);
  }
}
```

**目標碼 (`app/api/outfits/[id]/route.ts`)**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getOutfitById } from '../../../../lib/shared-outfit-store'; // 調整路徑

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少 userId 參數' }, { status: 400 });
  }

  // ... logic
  const outfit = getOutfitById(userId, id);
  if (outfit) {
    return NextResponse.json(outfit);
  }
  return NextResponse.json({ error: '找不到指定的搭配' }, { status: 404 });
}
```

#### **特殊處理: `upload.ts`**
- **檔案上傳**: 在 App Router 中，使用 `await req.formData()` 來處理 `multipart/form-data`。不再需要 `formidable` 和 `bodyParser: false`。
- **遷移路徑**: `pages/api/upload.ts` → `app/api/upload/route.ts`

### 4.3 檔案遷移對照表

| 原始檔案 (`pages/`)                         | 目標檔案 (`app/`)                             | 遷移類型 | 關鍵動作                                                                      |
| ------------------------------------------- | --------------------------------------------- | -------- | ----------------------------------------------------------------------------- |
| **--- API Routes ---**                      |                                               |          |                                                                               |
| `api/outfits/index.ts`                      | `api/outfits/route.ts`                        | API      | 轉換 `GET` 和 `POST` 函數，使用 `NextResponse`。                                |
| `api/outfits/[id].ts`                       | `api/outfits/[id]/route.ts`                   | API      | 轉換 `GET`, `PUT`, `DELETE`，從 `params` 獲取 `id`。                              |
| `api/reco/basket-mixmatch.ts`               | `api/reco/basket-mixmatch/route.ts`           | API      | 轉換 `POST` 函數。                                                            |
| `api/reco/closet-gap-fill.ts`               | `api/reco/closet-gap-fill/route.ts`           | API      | 轉換 `POST` 函數。                                                            |
| `api/reco/daily-outfits.ts`                 | `api/reco/daily-outfits/route.ts`             | API      | **衝突**: 與 `app/api/daily-outfits` 合併邏輯。                             |
| `api/upload.ts`                             | `api/upload/route.ts`                         | API      | **重點**: 使用 `req.formData()` 替換 `formidable`，不再需要 `config` 物件。 |
| **--- Page Components ---**                 |                                               |          |                                                                               |
| `basket/index.tsx`                          | `basket/page.tsx`                             | Page     | 在檔案頂部新增 `'use client';`，移動元件程式碼。                                |
| `cart/index.tsx`                            | `cart/page.tsx`                               | Page     | 在檔案頂部新增 `'use client';`，移動元件程式碼。                                |
| `daily/index.tsx`                           | `daily/page.tsx`                              | Page     | 在檔案頂部新增 `'use client';`，移動元件程式碼。                                |
| `gap-fill/index.tsx`                        | `gap-fill/page.tsx`                           | Page     | 在檔案頂部新增 `'use client';`，移動元件程式碼。                                |

---

## 5. 風險評估

1.  **API 回應格式變更**: 從 `res.status(..).json(..)` 到 `NextResponse.json(..)` 的轉換可能意外改變 Headers 或回應結構，需要 API 契約測試。
2.  **檔案上傳邏輯**: `upload.ts` 的重構風險較高，`formData` 的處理方式與 `formidable` 不同，需要進行充分測試。
3.  **環境變數**: 確保 Cloudinary 和 Remove.bg 的 API Keys (`process.env.*`) 在 App Router 的後端環境中依然能被正確讀取。
4.  **路由行為**: App Router 的快取機制與 Pages Router 不同，需要測試確保頁面在需要時能獲取最新資料。

---

## 6. 遷移檢查清單

### 遷移前
- [ ] **確認備份**: 確保 `pages/` 目錄已完整備份在 `.temp/pages-router-backup`。
- [ ] **審查 API 衝突**: 開發團隊開會決定 `daily-outfits` 和 `wardrobe` API 的合併策略。
- [ ] **建立測試案例**: 為現有 API 和頁面功能建立或審查自動化測試 (e.g., using Jest, Cypress)。

### 遷移中
- [ ] **從一個 API 開始**: 選擇一個簡單的 API (如 `reco/basket-mixmatch.ts`) 進行遷移，作為範例。
- [ ] **遷移 `upload.ts`**: 作為重點項目單獨處理，並進行詳盡測試。
- [ ] **逐個遷移 API**: 完成一個 API 路由的遷移與測試後，再進行下一個。
- [ ] **更新前端 `fetch` 呼叫**: 如果 API 路徑或行為有變，同步更新前端呼叫。
- [ ] **逐個遷移頁面**: API 穩定後，開始遷移頁面元件。加上 `'use client';` 並移至新路徑。
- [ ] **執行單元/整合測試**: 每遷移一個模組，就執行相關測試。

### 遷移後
- [ ] **進行端對端 (E2E) 測試**: 全面測試所有使用者流程，如註冊、上傳衣物、獲取推薦、購物車結帳等。
- [ ] **進行迴歸測試**: 確保舊功能沒有因遷移而損壞。
- [ ] **效能測試**: 分析新 App Router 的頁面載入速度和伺服器回應時間。
- [ ] **程式碼審查**: 由團隊成員交叉審查所有遷移後的程式碼。
- [ ] **刪除 `pages` 目錄**: **在所有測試通過且主分支合併後**，正式刪除 `apps/web/pages` 目錄。
- [ ] **更新文件**: 更新專案的 `README.md` 和架構文件，反映新的 App Router 結構。
