-- 試穿工作清單：App 登記「這個人穿這組衣服」，桌機的工作程式來拿、生圖、把結果存回 Storage
-- job_key = 全身照路徑 + 排序過的衣服 id，同一張照片同一組衣服只做一次；換照片就是新工作
-- 使用者只能看自己的、登記自己的；狀態只由桌機（service role，不受 RLS 限制）更新
create table if not exists public.tryon_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_key text not null,
  person_path text not null,
  items jsonb not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  result_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_key)
);

-- 桌機照登記順序拿等待中的工作
create index if not exists tryon_jobs_queued_idx on public.tryon_jobs (created_at) where status = 'queued';

alter table public.tryon_jobs enable row level security;

create policy "tryon_jobs_select_own" on public.tryon_jobs
  for select to authenticated using (auth.uid() = user_id);
create policy "tryon_jobs_insert_own" on public.tryon_jobs
  for insert to authenticated with check (auth.uid() = user_id and status = 'queued');
