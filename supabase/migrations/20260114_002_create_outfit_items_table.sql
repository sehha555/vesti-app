-- ============================================
-- Migration: Create outfit_items table
-- ============================================
-- Purpose: Store individual items within an outfit
-- Related to: outfits, closet_items
-- Note: Permission check via outfit.user_id = auth.uid()

CREATE TABLE IF NOT EXISTS public.outfit_items (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id       uuid        NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  closet_item_id  uuid        DEFAULT NULL REFERENCES public.closet_items(id) ON DELETE SET NULL,
  position        int         NOT NULL, -- Order within outfit (1, 2, 3, ...)
  layer           text        NOT NULL, -- Layer: top, bottom, outer, accessory, feet
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),

  CONSTRAINT outfit_items_layer_chk CHECK (layer IN ('top', 'bottom', 'outer', 'accessory', 'feet')),
  CONSTRAINT outfit_items_position_chk CHECK (position > 0)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS outfit_items_outfit_id_idx
  ON public.outfit_items (outfit_id);

CREATE INDEX IF NOT EXISTS outfit_items_closet_item_id_idx
  ON public.outfit_items (closet_item_id);

CREATE INDEX IF NOT EXISTS outfit_items_outfit_position_idx
  ON public.outfit_items (outfit_id, position);

-- Create updated_at trigger (safe for re-run)
DROP TRIGGER IF EXISTS trg_outfit_items_updated_at ON public.outfit_items;
CREATE TRIGGER trg_outfit_items_updated_at
  BEFORE UPDATE ON public.outfit_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Access controlled via outfit -> user_id relationship (safe for re-run)
-- Users can only access items within their own outfits
DROP POLICY IF EXISTS outfit_items_select_own ON public.outfit_items;
CREATE POLICY outfit_items_select_own
  ON public.outfit_items FOR SELECT
  USING (outfit_id IN (
    SELECT id FROM public.outfits WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS outfit_items_insert_own ON public.outfit_items;
CREATE POLICY outfit_items_insert_own
  ON public.outfit_items FOR INSERT
  WITH CHECK (outfit_id IN (
    SELECT id FROM public.outfits WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS outfit_items_update_own ON public.outfit_items;
CREATE POLICY outfit_items_update_own
  ON public.outfit_items FOR UPDATE
  USING (outfit_id IN (
    SELECT id FROM public.outfits WHERE user_id = auth.uid()
  ))
  WITH CHECK (outfit_id IN (
    SELECT id FROM public.outfits WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS outfit_items_delete_own ON public.outfit_items;
CREATE POLICY outfit_items_delete_own
  ON public.outfit_items FOR DELETE
  USING (outfit_id IN (
    SELECT id FROM public.outfits WHERE user_id = auth.uid()
  ));
