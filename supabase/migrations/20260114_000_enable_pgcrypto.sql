-- ============================================
-- Migration: Enable pgcrypto extension
-- ============================================
-- Purpose: Required for gen_random_uuid() function
-- Used in: closet_items, outfits, outfit_items, etc.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
