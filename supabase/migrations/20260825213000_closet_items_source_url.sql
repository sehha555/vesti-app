-- 記錄「從商品連結匯入」的來源網址；拍照上傳的 item 為 NULL
alter table public.closet_items add column if not exists source_url text;
