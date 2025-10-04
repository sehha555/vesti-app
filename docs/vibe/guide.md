# Vibe guide

- KIRO/Gemini CLI prompts, spec-first, test-first, run-iterate.

## Definition of Done (DoD)

A feature is considered done when it meets the following criteria:

- **Vertical Slice:** The feature is implemented as a vertical slice, from the UI to the backend.
- **API Contract:** The API contract is clearly defined and documented.
- **DTOs:** Data Transfer Objects are defined in the `packages/types` directory.
- **Automated Tests:** The feature has automated tests, including unit tests and contract tests.
- **Documentation:** The feature is documented in the relevant guides.

### Vertical Slice Example: `daily_outfits`

A vertical slice for `daily_outfits` is considered done when it includes the following components:

*   **API Route:** `services/reco/pipelines/daily_outfits/route.ts` is implemented, handling `POST /reco/daily_outfits`.
*   **Service Logic:** `services/reco/pipelines/daily_outfits/daily_outfits.service.ts` contains the core rule-based recommendation logic.
*   **DTOs:** `packages/types/src/daily.ts` defines `DailyOutfitRequest`, `DailyOutfitResponse`, `DailyOutfitRecommendation`. `packages/types/src/wardrobe.ts` and `packages/types/src/weather.ts` are updated with necessary fields.
*   **Frontend Page:** `apps/web/pages/daily/index.tsx` displays daily outfit recommendations.
*   **Wardrobe Service:** `services/wardrobe/modules/items/items.service.ts` provides a placeholder for fetching user wardrobe items.
*   **Weather Service:** `services/weather/weather.service.ts` provides a placeholder for fetching weather summaries.
*   **Prompts:** `packages/prompts/src/vqa-prompts.ts` contains a stub for image keyword VQA.
*   **Documentation:** This PRD is updated with API contracts, DTOs, and DoD.
*   **Tests:** Unit and contract tests are added for the new API and core logic.


### 垂直切片範例：`launch-hardening`

`launch-hardening` 的垂直切片在滿足以下條件時視為完成：

*   **觀測：**
    *   請求日誌：在 `services/api-gateway/index.ts` 中實作基本的請求日誌佔位符。
    *   耗時計量：在 `services/api-gateway/index.ts` 中實作基本的耗時計量佔位符。
    *   錯誤追蹤：在 `services/api-gateway/index.ts` 中實作基本的錯誤追蹤佔位符。
*   **結果持久化：**
    *   `packages/types/src/persistence.ts` 定義了儲存推薦結果的 DTOs。
    *   `services/reco/pipelines/daily_outfits/persistence.ts`、`basket_mixmatch/persistence.ts`、`closet_gap_fill/persistence.ts` 實作了各自推薦結果的佔位符持久化邏輯。
    *   `services/reco/pipelines/daily_outfits/route.ts`、`basket_mixmatch/route.ts`、`closet_gap_fill/route.ts` 新增了 `/save` 端點。
*   **彈性策略：**
    *   限流：在 `services/api-gateway/index.ts` 中實作基本的限流佔位符。
    *   超時：在 `services/api-gateway/index.ts` 中實作基本的超時佔位符。
    *   降級：在 `services/api-gateway/index.ts` 中實作基本的降級策略佔位符。
*   **前端功能：**
    *   前端儲存：在 `apps/web/pages/daily/index.tsx`、`basket/index.tsx`、`gap-fill/index.tsx` 中新增儲存推薦結果的按鈕和佔位符邏輯。
    *   分享佔位：在 `apps/web/pages/daily/index.tsx`、`basket/index.tsx`、`gap-fill/index.tsx` 中新增分享推薦結果的按鈕和佔位符邏輯。
*   **文件：** 此 PRD 已更新 API 契約、DTOs 和 DoD。
*   **測試：** 為新的 API 和核心邏輯新增了單元測試和契約測試。
