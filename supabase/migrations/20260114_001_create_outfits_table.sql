-- ============================================
-- Migration: Create outfits table
-- ============================================
-- Purpose: Store user's outfit combinations
-- Related to: closet_items, outfit_items

CREATE TABLE IF NOT EXISTS public.outfits (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  notes         text        DEFAULT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS outfits_user_id_idx
  ON public.outfits (user_id);

CREATE INDEX IF NOT EXISTS outfits_user_created_at_idx
  ON public.outfits (user_id, created_at DESC);

-- Create updated_at trigger (safe for re-run)
DROP TRIGGER IF EXISTS trg_outfits_updated_at ON public.outfits;
CREATE TRIGGER trg_outfits_updated_at
  BEFORE UPDATE ON public.outfits
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own outfits (safe for re-run)
DROP POLICY IF EXISTS outfits_select_own ON public.outfits;
CREATE POLICY outfits_select_own
  ON public.outfits FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS outfits_insert_own ON public.outfits;
CREATE POLICY outfits_insert_own
  ON public.outfits FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS outfits_update_own ON public.outfits;
CREATE POLICY outfits_update_own
  ON public.outfits FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS outfits_delete_own ON public.outfits;
CREATE POLICY outfits_delete_own
  ON public.outfits FOR DELETE
  USING (user_id = auth.uid());
