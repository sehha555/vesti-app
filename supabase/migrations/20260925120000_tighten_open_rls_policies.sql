-- 這幾條 policy 是 USING (true) / WITH CHECK (true) 且沒限定角色，
-- 等於拿 anon key 的任何人都能讀寫所有使用者的資料。
-- 程式碼碰這三張表都走 service role（不受 RLS 影響），拿掉不會壞功能。

-- clothing_items：原本只有全開的四條，改成只能碰自己的
drop policy if exists "Allow select for all users" on public.clothing_items;
drop policy if exists "Allow insert for all users" on public.clothing_items;
drop policy if exists "Allow update for all users" on public.clothing_items;
drop policy if exists "Allow delete for all users" on public.clothing_items;
drop policy if exists "clothing_items_select_own" on public.clothing_items;
drop policy if exists "clothing_items_insert_own" on public.clothing_items;
drop policy if exists "clothing_items_update_own" on public.clothing_items;
drop policy if exists "clothing_items_delete_own" on public.clothing_items;

create policy "clothing_items_select_own" on public.clothing_items for select to authenticated
  using (user_id = auth.uid());
create policy "clothing_items_insert_own" on public.clothing_items for insert to authenticated
  with check (user_id = auth.uid());
create policy "clothing_items_update_own" on public.clothing_items for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "clothing_items_delete_own" on public.clothing_items for delete to authenticated
  using (user_id = auth.uid());

-- saved_outfits：已經有 auth.uid() = user_id 的版本，只要拿掉並存的全開版本
drop policy if exists "Users can view own outfits" on public.saved_outfits;
drop policy if exists "Users can insert own outfits" on public.saved_outfits;
drop policy if exists "Users can delete own outfits" on public.saved_outfits;

-- daily_outfit_plans：名字叫 service role，但沒寫 TO service_role，實際上對所有角色全開；
-- service role 本來就繞過 RLS，不需要這條
drop policy if exists "Service role full access" on public.daily_outfit_plans;
