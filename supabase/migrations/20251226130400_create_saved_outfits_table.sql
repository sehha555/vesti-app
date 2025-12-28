-- ======================================================
-- 建立 saved_outfits 表格
-- ======================================================
-- 用途：儲存使用者收藏/確認的每日穿搭組合
--
-- 使用情境：
-- - 使用者在首頁滑動穿搭卡片時按下「確認」或「收藏」
-- - 儲存當時的天氣資訊、單品 ID 列表、場合等
-- - 未來可用於分析使用者偏好、生成穿搭統計等
-- ======================================================

CREATE TABLE IF NOT EXISTS saved_outfits (
  -- 主鍵
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 使用者 ID (外鍵關聯 users 表，如果有的話)
  user_id UUID NOT NULL,

  -- 穿搭單品 ID 列表 (jsonb array)
  -- 範例: ["uuid-1", "uuid-2", "uuid-3"]
  items JSONB NOT NULL,

  -- 天氣資訊 (jsonb object)
  -- 範例: { "temp_c": 25.5, "condition": "Clear", "description": "晴朗", "humidity": 60, ... }
  weather_info JSONB NOT NULL,

  -- 場合 (casual, work, date, formal, outdoor)
  occasion VARCHAR(50) NOT NULL DEFAULT 'casual',

  -- 穿搭類型 (可選：saved = 收藏, confirmed = 確認穿著)
  outfit_type VARCHAR(20) DEFAULT 'saved',

  -- 時間戳記
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ======================================================
-- 建立索引以提升查詢效能
-- ======================================================

-- 根據使用者 ID 查詢 (最常用)
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_id
  ON saved_outfits(user_id);

-- 根據建立時間查詢 (用於「最近儲存」)
CREATE INDEX IF NOT EXISTS idx_saved_outfits_created_at
  ON saved_outfits(created_at DESC);

-- 根據場合查詢
CREATE INDEX IF NOT EXISTS idx_saved_outfits_occasion
  ON saved_outfits(occasion);

-- 組合索引：使用者 + 類型 (快速篩選「我的收藏」或「已確認穿搭」)
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_type
  ON saved_outfits(user_id, outfit_type);

-- ======================================================
-- 建立 RLS (Row Level Security) 政策
-- ======================================================
-- 確保使用者只能存取自己的資料

-- 啟用 RLS
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;

-- 政策 1: 使用者只能查詢自己的穿搭
CREATE POLICY "Users can view their own saved outfits"
  ON saved_outfits
  FOR SELECT
  USING (auth.uid() = user_id);

-- 政策 2: 使用者只能新增自己的穿搭
CREATE POLICY "Users can insert their own saved outfits"
  ON saved_outfits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 政策 3: 使用者只能更新自己的穿搭
CREATE POLICY "Users can update their own saved outfits"
  ON saved_outfits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 政策 4: 使用者只能刪除自己的穿搭
CREATE POLICY "Users can delete their own saved outfits"
  ON saved_outfits
  FOR DELETE
  USING (auth.uid() = user_id);

-- ======================================================
-- 建立 updated_at 自動更新觸發器
-- ======================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_outfits_updated_at
  BEFORE UPDATE ON saved_outfits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ======================================================
-- 範例查詢
-- ======================================================

-- 查詢使用者最近儲存的 10 套穿搭
-- SELECT * FROM saved_outfits
-- WHERE user_id = 'YOUR_UUID'
-- ORDER BY created_at DESC
-- LIMIT 10;

-- 查詢使用者在特定場合的穿搭
-- SELECT * FROM saved_outfits
-- WHERE user_id = 'YOUR_UUID' AND occasion = 'work'
-- ORDER BY created_at DESC;

-- 查詢包含特定單品的穿搭 (使用 jsonb 運算子)
-- SELECT * FROM saved_outfits
-- WHERE user_id = 'YOUR_UUID'
-- AND items @> '["specific-item-uuid"]'::jsonb;
