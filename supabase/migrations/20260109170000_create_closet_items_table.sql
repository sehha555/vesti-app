-- ============================================
-- Migration: Create closet_items table
-- ============================================

-- 1. Create set_updated_at function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create closet_items table
CREATE TABLE IF NOT EXISTS public.closet_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  category      text        NOT NULL,
  subcategory   text        DEFAULT NULL,
  brand         text        DEFAULT NULL,
  color         text        DEFAULT NULL,
  size          text        DEFAULT NULL,
  season        text        DEFAULT NULL,
  tags          text[]      DEFAULT '{}',
  image_url     text        DEFAULT NULL,
  custom_group  text        DEFAULT NULL,
  is_archived   boolean     DEFAULT false,
  source_type   text        DEFAULT 'OWNED',
  source_ref_id text        DEFAULT NULL,
  status        text        DEFAULT 'ACTIVE',
  acquired_at   timestamptz DEFAULT NULL,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),

  CONSTRAINT closet_items_source_type_chk CHECK (source_type IN ('OWNED')),
  CONSTRAINT closet_items_owned_ref_chk   CHECK (source_type <> 'OWNED' OR source_ref_id IS NULL),
  CONSTRAINT closet_items_status_chk      CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED'))
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS closet_items_user_id_idx
  ON public.closet_items (user_id);

CREATE INDEX IF NOT EXISTS closet_items_user_id_category_idx
  ON public.closet_items (user_id, category);

CREATE INDEX IF NOT EXISTS closet_items_user_id_source_status_idx
  ON public.closet_items (user_id, source_type, status);

-- 4. Create updated_at trigger
CREATE TRIGGER closet_items_set_updated_at
  BEFORE UPDATE ON public.closet_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 5. Enable RLS
ALTER TABLE public.closet_items ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies
CREATE POLICY closet_items_select_policy
  ON public.closet_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY closet_items_insert_policy
  ON public.closet_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY closet_items_update_policy
  ON public.closet_items FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY closet_items_delete_policy
  ON public.closet_items FOR DELETE
  USING (user_id = auth.uid());
