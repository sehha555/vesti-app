
ALTER TABLE public.daily_outfit_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "select_own_daily_outfit_plans" ON public.daily_outfit_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "insert_own_daily_outfit_plans" ON public.daily_outfit_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "update_own_daily_outfit_plans" ON public.daily_outfit_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_daily_outfit_plans" ON public.daily_outfit_plans;
CREATE POLICY "delete_own_daily_outfit_plans" ON public.daily_outfit_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON public.daily_outfit_plans TO postgres, anon, service_role;
REVOKE ALL ON public.daily_outfit_plans FROM anon;
REVOKE ALL ON public.daily_outfit_plans FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_outfit_plans TO authenticated;
