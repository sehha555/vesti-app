-- 關掉「所有人都能讀寫」的 RLS policy。後端存取這三張表都走 service role（不受 RLS 限制），
-- 前端拿到的 anon key 不該能直接讀寫別人的資料。

-- clothing_items：舊表，程式已不使用（0 筆），連登入使用者都不該碰
drop policy if exists "Allow delete for all users" on public.clothing_items;
drop policy if exists "Allow insert for all users" on public.clothing_items;
drop policy if exists "Allow select for all users" on public.clothing_items;
drop policy if exists "Allow update for all users" on public.clothing_items;
revoke all on public.clothing_items from anon, authenticated;

-- saved_outfits：保留「只能動自己的」那組 policy，拿掉 using (true) 的三條
drop policy if exists "Users can view own outfits" on public.saved_outfits;
drop policy if exists "Users can insert own outfits" on public.saved_outfits;
drop policy if exists "Users can delete own outfits" on public.saved_outfits;
revoke all on public.saved_outfits from anon;

-- daily_outfit_plans：名為 service role 但沒限定角色，等於所有登入使用者都能讀寫全部；service role 本來就不受 RLS 限制
drop policy if exists "Service role full access" on public.daily_outfit_plans;
