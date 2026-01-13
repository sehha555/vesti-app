-- ============================================
-- Migration: Make optional columns flexible in saved_outfits
-- ============================================
-- Purpose: Support various outfit types with optional fields
-- Example: basket_mixmatch may not have weather_info; some outfits may not have occasion

-- Allow NULL for weather_info (not all outfits have weather context)
ALTER TABLE saved_outfits
ALTER COLUMN weather_info DROP NOT NULL;

-- Allow NULL for occasion (outfits may not have specific occasion)
ALTER TABLE saved_outfits
ALTER COLUMN occasion DROP NOT NULL;
