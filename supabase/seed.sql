-- 本機 Supabase 的測試資料：`npx supabase start` 第一次啟動、或 `npx supabase db reset` 時自動執行。
-- 只在本機用，不會套到雲端（supabase db push 不跑 seed）。
--
-- 測試帳號：test@vesti.local / vesti-test-1234

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'test@vesti.local',
  extensions.crypt('vesti-test-1234', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}', '{"name":"測試帳號"}',
  now(), now(), '', '', '', ''
) on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"test@vesti.local","email_verified":true}',
  'email', now(), now(), now()
) on conflict do nothing;
