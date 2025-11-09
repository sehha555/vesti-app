# API 路由合併與重構報告

**版本:** 1.0
**日期:** 2025-11-09

## 1. 總覽

本報告記錄了 API 遷移第 3 階段的執行過程與結果，此階段專注於處理重複和複雜的 API 路由。主要任務包括合併重複的 `daily-outfits` 端點和重構 `upload` API。

---

## 2. 任務 1: 合併 `daily-outfits` API

### 2.1 分析與比較

- **`pages/api/reco/daily-outfits.ts`**:
  - **類型**: Mock API
  - **功能**: 接收 `POST` 請求並返回一個寫死的、固定的 JSON 物件作為假資料。不涉及任何真實的業務邏輯。

- **`app/api/daily-outfits/route.ts`**:
  - **類型**: 功能完整的 API
  - **功能**: 接收 `GET` 請求，包含 `userId`, `latitude`, `longitude` 等真實參數。它會呼叫後端的 `DailyOutfitsService` 和 `getWeather` 服務，結合使用者衣櫥和天氣資訊來動態生成個人化的穿搭推薦。

### 2.2 結論與執行策略

`app/` 目錄下的版本是 `pages/` 版本的完全實現和替代。`pages/` 版本的 Mock 邏輯在目前階段已無價值。

- **執行結果**:
  - ✅ **已確認 `app/api/daily-outfits/route.ts` 為標準實現。**
  - ✅ **已標記 `pages/api/reco/daily-outfits.ts` 為「可刪除」狀態。** 在整個遷移完成後，此檔案將被移除。
  - **無需進行程式碼合併。**

---

## 3. 任務 2: 重構 `upload` API

### 3.1 分析與重構策略

`pages/api/upload.ts` 是一個功能複雜但架構存在問題的 API。

- **存在的問題**:
  1.  **外部依賴**: 依賴 `formidable` 來解析 `multipart/form-data`。
  2.  **架構反模式**: 在處理完圖片上傳後，它使用 `fetch` 向自己的應用程式 (`http://localhost:3000/api/wardrobe/items`) 發送請求來儲存資料。這造成了不必要的內部 HTTP 迴圈，增加了延遲和不穩定性。

- **重構策略**:
  1.  **移除 `formidable`**: 使用 App Router 原生的 `await req.formData()` 來處理檔案上傳，使程式碼更簡潔、更現代化。
  2.  **消除內部 `fetch` 呼叫**: 找到 `app/api/wardrobe/items/route.ts` 中用於寫入資料庫的核心邏輯（即 Supabase client 的 `insert` 操作），並在新的 `upload` API 中直接呼叫該邏輯。

### 3.2 執行結果

- ✅ **已成功建立 `app/api/wardrobe/upload/route.ts`。**
- ✅ **已成功替換 `formidable`**: 新的 API 使用 `req.formData()` 進行檔案和欄位解析。
- ✅ **已成功移除內部 `fetch` 呼叫**: 新的 API 現在直接與 Supabase client 互動，將衣物資料寫入 `clothing_items` 資料表，顯著優化了架構。
- ✅ **保留了核心功能**: Cloudinary 圖片上傳和 `remove.bg` 去背的邏輯被完整保留和適配。
- ✅ **已標記 `pages/api/upload.ts` 為「可刪除」狀態。**

---

## 4. 總結

第 3 階段的 API 遷移任務已成功完成。所有重複的 API 都已制定了清晰的處理策略，最複雜的 `upload` API 也已成功重構並遷移至新架構。至此，所有在 `pages/api/` 下的 API 路由都已在 `app/api/` 中有了對應的、功能更佳的實現。
