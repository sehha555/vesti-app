# 規範：為 'daily_outfit_plans' 表格實施行級安全 (RLS)

## 1. 目標
透過在 Supabase 資料庫的 `daily_outfit_plans` 表格上實施行級安全 (RLS) 策略，以增強資料隱私和完整性。這將確保使用者只能存取和修改自己的資料。

## 2. 功能需求
- **資料隔離**：使用者在 `daily_outfit_plans` 表格中必須只能 `SELECT`、`INSERT`、`UPDATE` 和 `DELETE` 自己的記錄。
- **API 行為**：與此表格互動的現有 API (`/api/reco/daily-outfits/save` 和 `/api/reco/daily-outfits/plan`) 必須在尊重新的 RLS 策略的同時，繼續對已驗證使用者正常運作。
- **未經授權的存取**：未經身份驗證的使用者必須在資料庫層面被阻止存取 `daily_outfit_plans` 表格中的任何資料。

## 3. 技術實作
- **啟用 RLS**：必須在 `daily_outfit_plans` 表格上啟用 RLS。
- **創建策略**：
  - 必須創建一個 `SELECT` 策略，允許使用者只查看其 `user_id` 與其已驗證的 `auth.uid()` 相符的行。
  - 必須創建一個 `INSERT` 策略，允許使用者只在其新行中的 `user_id` 與其 `auth.uid()` 相符時插入新行。
  - 必須創建一個 `UPDATE` 策略，允許使用者只在其 `user_id` 與其 `auth.uid()` 相符時更新現有行。
  - 應考慮並創建一個 `DELETE` 策略，條件可能相同 (`user_id = auth.uid()`)，以允許使用者刪除自己的資料。
- **策略定義 (範例)**：
  ```sql
  -- For SELECT, UPDATE, DELETE
  CREATE POLICY "Enable user-specific access"
  ON public.daily_outfit_plans
  FOR ALL
  USING (auth.uid() = user_id);

  -- For INSERT (if not covered by ALL)
  CREATE POLICY "Enable user-specific insert"
  ON public.daily_outfit_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  ```

## 4. 驗收標準
- 所有針對 `/save` 和 `/plan` 路由的現有 API 測試都必須通過已驗證使用者。
- 應創建新的測試，以驗證使用者無法存取其他使用者的資料。
- 手動驗證確認 Supabase 儀表板中已啟用 RLS 且策略處於活動狀態。