# 計畫：實施 'daily_outfit_plans' 的 RLS

## 階段 1：RLS 策略實施與遷移

-   **任務**：定義並編寫 RLS 策略的 SQL 遷移腳本。
    -   **驗收條件**：
        -   創建一個新的 SQL 遷移檔案。
        -   腳本包含 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` 語句。
        -   腳本包含針對 `daily_outfit_plans` 表格的 `SELECT`、`INSERT`、`UPDATE` 和 `DELETE` 的 `CREATE POLICY` 語句，這些語句限制基於 `auth.uid() = user_id` 的存取。
    -   **預期修改檔案**：
        -   `supabase/migrations/<timestamp>_enable_rls_on_daily_outfit_plans.sql` (新檔案)

-   **任務**：應用資料庫遷移並驗證。
    -   **驗收條件**：
        -   遷移成功應用於本地資料庫。
        -   Supabase Studio UI 顯示 `daily_outfit_plans` 表格已啟用 RLS 且策略處於活動狀態。
    -   **預期修改檔案**：
        -   無 (這是命令執行和手動驗證任務)。

## 階段 2：API 與整合測試

-   **任務**：創建並運行整合測試以驗證 RLS 策略。
    -   **驗收條件**：
        -   測試證明 `user_A` 可以讀取自己的資料。
        -   測試證明 `user_A` *不能*讀取 `user_B` 的資料。
        -   測試證明未經身份驗證的 API 請求被拒絕並返回 401 狀態。
    -   **預期修改檔案**：
        -   `services/reco/pipelines/daily_outfits/route.contract.test.ts` (或類似的新測試檔案)

-   **任務**：運行現有 API 測試以確保沒有迴歸。
    -   **驗收條件**：
        -   針對 `/api/reco/daily-outfits/save` 和 `/api/reco/daily-outfits/plan` API 路由的所有現有測試都成功通過身份驗證用戶。
    -   **預期修改檔案**：
        -   無 (這是測試執行任務)。

## 階段 3：文件與最終確定

-   **任務**：更新專案文件以反映新的安全模型。
    -   **驗收條件**：
        -   文件清楚說明 `daily_outfit_plans` 表格受 RLS 保護。
    -   **預期修改檔案**：
        -   `docs/backend-services.md` 或 `docs/PROJECT_STRUCTURE.md`

-   **任務**：審查並合併變更。
    -   **驗收條件**：
        -   創建、審查並合併一個拉取請求。
    -   **預期修改檔案**：
        -   無 (這是 Git 工作流程任務)。
