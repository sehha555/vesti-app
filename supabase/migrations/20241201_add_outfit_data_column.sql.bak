-- ======================================================
-- 新增 outfit_data 欄位到 saved_outfits 表格
-- ======================================================
-- 目的：儲存完整的穿搭資料（圖片、名稱、描述等）
--
-- 變更日期：2024-12-01
-- ======================================================

-- 新增 outfit_data 欄位（jsonb）
ALTER TABLE saved_outfits
ADD COLUMN IF NOT EXISTS outfit_data JSONB;

-- outfit_data 範例結構：
-- {
--   "imageUrl": "https://...",
--   "styleName": "Casual Comfort",
--   "description": "Perfect for a cool day",
--   "heroImageUrl": "https://...",
--   "items": [
--     { "id": "uuid-1", "name": "白色T恤", "imageUrl": "https://..." },
--     { "id": "uuid-2", "name": "牛仔褲", "imageUrl": "https://..." }
--   ]
-- }

-- 將 items 和 weather_info 改為可選（nullable）
-- 因為新的資料結構會將這些資訊放在 outfit_data 中
ALTER TABLE saved_outfits
ALTER COLUMN items DROP NOT NULL;

ALTER TABLE saved_outfits
ALTER COLUMN weather_info DROP NOT NULL;

-- 為 outfit_data 建立 GIN 索引以支援 jsonb 查詢
CREATE INDEX IF NOT EXISTS idx_saved_outfits_outfit_data_gin
  ON saved_outfits USING GIN (outfit_data);

-- 註解說明
COMMENT ON COLUMN saved_outfits.outfit_data IS '完整的穿搭資料，包含圖片、名稱、描述和單品列表';
