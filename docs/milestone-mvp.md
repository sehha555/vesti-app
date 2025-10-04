# MVP 功能里程碑

## 今日完成功能清單

- **前端頁面按鈕新增：** 在 `daily`、`basket` 和 `gap-fill` 頁面中加入了「儲存」和「分享」按鈕。
- **API Mock 端點建立：**
  - 為 `daily-outfits`、`basket-mixmatch` 和 `closet-gap-fill` 建立了 API mock 端點。
  - 為 `daily-outfits` 和 `basket-mixmatch` 的儲存功能建立了 API mock 端點。
- **API Mock 資料結構更新：**
  - 更新了 `daily-outfits.ts` 的 mock 資料結構，使其包含更詳細的 `outfit.top`、`outfit.bottom`、`shoes`、`outerwear`、`scores` (含 `total`, `compatibility`, `weather`, `rules`) 和 `reasons` 欄位。
  - 更新了 `basket-mixmatch.ts` 的 mock 資料結構，使其包含更詳細的 `outfit.top`、`outfit.bottom`、`shoes`、`scores` (含 `total`, `compatibility`, `rules`) 和 `reasons` 欄位，並保留 `totalRecommendations`。

## 技術架構

- **前端：** Next.js 應用程式 (`apps/web`)。
- **後端邏輯：** 推薦服務的核心邏輯位於 `services/reco`，並透過 Next.js 的 API 路由 (`apps/web/pages/api/reco/`) 整合到前端應用程式中。
- **API Gateway：** 作為 Next.js 中介軟體實作 (`services/api-gateway/index.ts`)，處理請求日誌、延遲計量、錯誤追蹤、限流和超時等功能。

## API 端點

- `POST /api/reco/daily-outfits`：回傳每日穿搭推薦。
- `POST /api/reco/daily-outfits/save`：模擬儲存每日穿搭推薦。
- `POST /api/reco/basket-mixmatch`：回傳購物車混搭推薦。
- `POST /api/reco/basket-mixmatch/save`：模擬儲存購物車混搭推薦。
- `POST /api/reco/closet-gap-fill`：回傳衣櫥空缺填補推薦。

## 測試狀態

- `services/reco` 測試套件：11 個通過，0 個失敗。

## 後續規劃

- 實作 `services/reco` 中推薦服務的實際後端邏輯。
- 將實際的推薦邏輯與現有的 API mock 端點整合。
- 將所有佔位符圖片 (`/placeholder.jpg`, `https://via.placeholder.com/150`) 替換為實際的圖片資源。
- 在前端實作實際的儲存和分享功能。
- 實作 `gap-fill` 頁面的篩選邏輯。
- 實作實際的使用者身份驗證和授權機制。
- 實作全面的錯誤處理和日誌記錄。
- 為各種情境新增更詳細的 mock 資料。
- 為新的 API 端點編寫單元測試和整合測試。
