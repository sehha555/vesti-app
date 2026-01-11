-- ============================================
-- Migration: Create active_closet_items view
-- ============================================
-- This view excludes soft-deleted items (status='DELETED')
-- to simplify queries and reduce maintenance overhead.
--
-- SECURITY NOTE:
-- - SECURITY INVOKER (default) ensures RLS on closet_items is enforced
-- - Queries through this view will only return rows where user_id = auth.uid()

CREATE OR REPLACE VIEW public.active_closet_items
WITH (security_invoker = true)
AS SELECT * FROM public.closet_items WHERE status <> 'DELETED';

-- Grant schema usage (idempotent, required for querying objects in public schema)
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to authenticated users (RLS on base table still applies)
GRANT SELECT ON public.active_closet_items TO authenticated;
