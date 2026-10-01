-- 推薦回饋：使用者對每一套推薦的反應，餵回下一次推薦（核心迴圈 ⑥）
--
-- action：
--   choose   按「要這套」（同時寫入 daily_outfit_plans）
--   unchoose 取消「要這套」
--   dislike  按「不要」，reasons 記原因
--   skip     滑過去沒表態（弱負面訊號）
--   save / unsave  收藏 / 取消收藏
--   wore / not_worn  隔天回答「昨天有穿嗎」
create table if not exists public.outfit_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('choose', 'unchoose', 'dislike', 'skip', 'save', 'unsave', 'wore', 'not_worn')),
  -- 組成單品（closet_items.id）排序後以 | 串接，跟 lib/outfits/key.ts 一致
  outfit_key text not null,
  item_ids uuid[] not null,
  reasons text[] not null default '{}',
  -- 當下的天氣、場合、推薦標題等，之後分析用
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_outfit_feedback_user_created
  on public.outfit_feedback (user_id, created_at desc);

alter table public.outfit_feedback enable row level security;

drop policy if exists "outfit_feedback_select_own" on public.outfit_feedback;
drop policy if exists "outfit_feedback_insert_own" on public.outfit_feedback;
create policy "outfit_feedback_select_own" on public.outfit_feedback for select to authenticated
  using (user_id = auth.uid());
create policy "outfit_feedback_insert_own" on public.outfit_feedback for insert to authenticated
  with check (user_id = auth.uid());
-- 事件只增不改：不開放 update / delete

grant select, insert on public.outfit_feedback to authenticated;

-- 今日計畫：隔天回答「有沒有穿」，null = 還沒回答
alter table public.daily_outfit_plans add column if not exists wore boolean;
