-- ============================================
-- Migration: Create RPC for atomic outfit creation
-- ============================================
-- Purpose: Insert outfit record with atomic transaction + RLS enforcement
-- Security: SECURITY INVOKER + auth.uid() check prevents unauthorized writes
-- Validation: Items ownership + existence checks + JSONB schema validation

CREATE OR REPLACE FUNCTION create_outfit_with_items(
  p_source TEXT,
  p_items JSONB,
  p_season TEXT DEFAULT NULL,
  p_occasion TEXT DEFAULT NULL,
  p_weather_info JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_outfit_id UUID;
  v_item JSONB;
  v_item_type TEXT;
  v_closet_item_id UUID;
  v_catalog_item_id UUID;
  v_items_count INT;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate p_source enum
  IF p_source NOT IN ('daily', 'basket_mixmatch', 'gap_fill') THEN
    RAISE EXCEPTION 'Invalid source: %', p_source;
  END IF;

  -- Validate p_items is not null and is array
  IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' THEN
    RAISE EXCEPTION 'Items must be a non-null array';
  END IF;

  -- Count items and validate array not empty
  v_items_count := jsonb_array_length(p_items);
  IF v_items_count = 0 THEN
    RAISE EXCEPTION 'Items cannot be empty';
  END IF;

  -- Validate maximum items count to prevent DoS
  IF v_items_count > 30 THEN
    RAISE EXCEPTION 'Maximum 30 items per outfit';
  END IF;

  -- Validate each item and check ownership (for closet items only)
  -- Note: catalog_items validation is deferred to application layer
  FOR v_item IN SELECT jsonb_array_elements(p_items)
  LOOP
    -- Validate item_type
    v_item_type := v_item->>'item_type';
    IF v_item_type NOT IN ('closet', 'catalog') THEN
      RAISE EXCEPTION 'Invalid item_type: %', v_item_type;
    END IF;

    -- Closet item: verify existence and ownership (user_id match)
    IF v_item_type = 'closet' THEN
      v_closet_item_id := (v_item->>'closet_item_id')::UUID;
      IF v_closet_item_id IS NULL THEN
        RAISE EXCEPTION 'closet_item_id required for item_type=closet';
      END IF;

      PERFORM 1 FROM closet_items
      WHERE id = v_closet_item_id
      AND user_id = v_user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Closet item not found or unauthorized: %', v_closet_item_id;
      END IF;
    END IF;

    -- Catalog item: validation deferred to application layer
    -- (catalog_items table is not yet available in this schema)
    -- Application layer must verify catalog_item_id exists and is visible
    IF v_item_type = 'catalog' THEN
      v_catalog_item_id := (v_item->>'catalog_item_id')::UUID;
      IF v_catalog_item_id IS NULL THEN
        RAISE EXCEPTION 'catalog_item_id required for item_type=catalog';
      END IF;
    END IF;
  END LOOP;

  -- Insert outfit record (RLS will enforce user_id match)
  INSERT INTO saved_outfits (
    user_id,
    items,
    season,
    occasion,
    weather_info,
    notes,
    source,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    p_items,
    p_season,
    p_occasion,
    p_weather_info,
    p_notes,
    p_source,
    NOW(),
    NOW()
  )
  RETURNING saved_outfits.id, saved_outfits.user_id, saved_outfits.created_at
  INTO v_outfit_id, v_user_id;

  -- Return inserted record
  RETURN QUERY SELECT v_outfit_id, v_user_id, NOW();
END;
$$;
