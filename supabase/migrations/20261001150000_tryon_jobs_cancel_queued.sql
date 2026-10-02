-- 「換一批」時取消舊推薦還在排隊的試穿工作：使用者只能刪自己的、而且只能刪還沒開始做的
create policy "tryon_jobs_delete_own_queued" on public.tryon_jobs
  for delete to authenticated using (auth.uid() = user_id and status = 'queued');
