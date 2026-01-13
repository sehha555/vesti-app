-- ============================================
-- Migration: Add missing columns to saved_outfits
-- ============================================
-- Purpose: Support RPC outfit creation with source tracking and flexible fields
-- Columns added: season, source, notes

-- Add season for outfit recommendations (optional)
ALTER TABLE saved_outfits
ADD COLUMN IF NOT EXISTS season VARCHAR(50);

-- Add source to track outfit origin (daily, basket_mixmatch, gap_fill)
ALTER TABLE saved_outfits
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'daily';

-- Add notes for user-provided outfit description (optional)
ALTER TABLE saved_outfits
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_saved_outfits_season
  ON saved_outfits(season);

CREATE INDEX IF NOT EXISTS idx_saved_outfits_source
  ON saved_outfits(source);

CREATE INDEX IF NOT EXISTS idx_saved_outfits_user_source
  ON saved_outfits(user_id, source);
