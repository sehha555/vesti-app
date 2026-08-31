-- 程式碼一直往 closet-images bucket 傳圖，但遠端從來沒建過這個 bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('closet-images', 'closet-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- 每個人只能碰自己資料夾（{user_id}/xxx.jpg）裡的檔案
create policy "closet_images_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'closet-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "closet_images_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'closet-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "closet_images_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'closet-images' and (storage.foldername(name))[1] = auth.uid()::text);
