-- 衣櫃來源從「只有 OWNED」開放成四種：
--   UPLOAD          拍照 / 相簿上傳
--   URL_IMPORT      貼商品網址匯入
--   EXTERNAL_ORDER  外部電商的購買紀錄（訂單截圖）
--   IN_APP_PURCHASE 在 vesti 內購買（第 4 站才會用到，先開值）
-- source_ref_id 只有訂單類可以填（訂單編號），上傳與網址匯入必須是 NULL。

begin;

-- 1. 先拿掉舊規則，否則下面的回填會被擋
alter table public.closet_items drop constraint closet_items_owned_ref_chk;
alter table public.closet_items drop constraint closet_items_source_type_chk;

-- 2. 回填舊資料：有 source_url 的是網址匯入，其餘是上傳
update public.closet_items
set source_type = case when source_url is not null then 'URL_IMPORT' else 'UPLOAD' end
where source_type = 'OWNED';

-- 3. 新規則
alter table public.closet_items
  add constraint closet_items_source_type_chk
  check (source_type in ('UPLOAD', 'URL_IMPORT', 'EXTERNAL_ORDER', 'IN_APP_PURCHASE'));

alter table public.closet_items
  add constraint closet_items_source_ref_chk
  check (source_ref_id is null or source_type in ('EXTERNAL_ORDER', 'IN_APP_PURCHASE'));

alter table public.closet_items alter column source_type set default 'UPLOAD';

commit;
