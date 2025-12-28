-- ======================================================
-- 建立 daily_outfit_plans 表格
-- ======================================================
-- 用途：儲存使用者每日穿搭計畫
-- 業務規則：同用戶同一天只能有一套「今日穿搭計畫」
--
-- 使用情境：
-- - 使用者在首頁選定穿搭時儲存
-- - 存儲該日期的完整穿搭布局、天氣、場合等資訊
-- - 下次打開首頁時可回填已選定的穿搭
-- ======================================================

CREATE TABLE IF NOT EXISTS public.daily_outfit_plans (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 使用者 ID (外鍵關聯 auth.users)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 日期 (YYYY-MM-DD)
  date DATE NOT NULL,

  -- Outfit ID
  outfit_id INTEGER NOT NULL,

  -- 完整白板布局結構 (jsonb)
  -- 範例: {
  --   "top_inner": {"item_id": 456, "imageUrl": "...", "name": "白T"},
  --   "top_outer": {"item_id": 789, "imageUrl": "...", "name": "牛仔外套"},
  --   "bottom": {"item_id": 101, "imageUrl": "...", "name": "窄管褲"},
  --   "shoes": {"item_id": 112, "imageUrl": "...", "name": "白球鞋"},
  --   "accessory": {"item_id": 131, "imageUrl": "...", "name": "銀色項鍊"}
  -- }
  layout_slots JSONB NOT NULL,

  -- 使用場合 (casual, work, date, formal, outdoor)
  occasion TEXT,

  -- 當日天氣資訊 (jsonb)
  -- 範例: {"temp_c": 18, "condition": "rain", "humidity": 60}
  weather JSONB,

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 唯一約束：同用戶同一天只能有一套計畫
  CONSTRAINT unique_user_date UNIQUE(user_id, date)
);

-- ======================================================
-- 建立索引以提升查詢效能
-- ======================================================

-- 根據使用者 ID 和日期查詢（最常用）
CREATE INDEX IF NOT EXISTS idx_daily_outfit_plans_user_date
  ON public.daily_outfit_plans(user_id, date DESC);

-- 根據使用者 ID 查詢（用於查看多天計畫）
CREATE INDEX IF NOT EXISTS idx_daily_outfit_plans_user_id
  ON public.daily_outfit_plans(user_id);

-- ======================================================
-- 建立 updated_at 自動更新觸發器
-- ======================================================

CREATE OR REPLACE FUNCTION public.update_daily_outfit_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_outfit_plans_updated_at ON public.daily_outfit_plans;
CREATE TRIGGER update_daily_outfit_plans_updated_at
  BEFORE UPDATE ON public.daily_outfit_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_daily_outfit_plans_updated_at();

-- ======================================================
-- 建立 RLS (Row Level Security) 政策
-- ======================================================

ALTER TABLE public.daily_outfit_plans ENABLE ROW LEVEL SECURITY;

-- 政策 1: 已認證使用者只能查詢自己的計畫
DROP POLICY IF EXISTS "select_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "select_own_daily_outfit_plans"
  ON public.daily_outfit_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 政策 2: 已認證使用者只能新增自己的計畫
DROP POLICY IF EXISTS "insert_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "insert_own_daily_outfit_plans"
  ON public.daily_outfit_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 政策 3: 已認證使用者只能更新自己的計畫
DROP POLICY IF EXISTS "update_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "update_own_daily_outfit_plans"
  ON public.daily_outfit_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 政策 4: 已認證使用者只能刪除自己的計畫
DROP POLICY IF EXISTS "delete_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "delete_own_daily_outfit_plans"
  ON public.daily_outfit_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ======================================================
-- 授權設定
-- ======================================================

-- 撤銷匿名用戶的所有權限
REVOKE ALL ON public.daily_outfit_plans FROM anon;

-- 已認證使用者具有所有操作權限（受 RLS 限制）
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_outfit_plans TO authenticated;

-- 評論
COMMENT ON TABLE public.daily_outfit_plans IS '使用者每日穿搭計畫表，同用戶同一天只能有一套計畫';
COMMENT ON COLUMN public.daily_outfit_plans.user_id IS '使用者 ID（外鍵）';
COMMENT ON COLUMN public.daily_outfit_plans.date IS '穿搭計畫日期 (YYYY-MM-DD)';
COMMENT ON COLUMN public.daily_outfit_plans.layout_slots IS '完整白板布局結構（JSONB 格式）';
COMMENT ON COLUMN public.daily_outfit_plans.occasion IS '使用場合';
COMMENT ON COLUMN public.daily_outfit_plans.weather IS '天氣資訊';
