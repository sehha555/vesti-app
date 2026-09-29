-- 每人每個時段每個場合的 AI 推薦結果，算一次存起來，之後打開首頁直接讀
-- 時段長度由程式端常數決定（預設 24 小時、從台灣午夜起算），period_start 是該時段的開始時間
-- outfits 存模型回的 item id（不存會過期的 signed URL），讀取時再簽章
-- latitude/longitude 記下算推薦時的位置，之後早上排程預先計算時要用
create table if not exists public.daily_recommendations (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start timestamptz not null,
  occasion text not null check (occasion in ('casual', 'work', 'date', 'sport')),
  outfits jsonb not null,
  weather jsonb,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  primary key (user_id, period_start, occasion)
);

alter table public.daily_recommendations enable row level security;

create policy "daily_recommendations_select_own" on public.daily_recommendations
  for select to authenticated using (auth.uid() = user_id);
create policy "daily_recommendations_insert_own" on public.daily_recommendations
  for insert to authenticated with check (auth.uid() = user_id);
create policy "daily_recommendations_update_own" on public.daily_recommendations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
