-- 程式碼一直查 active_closet_items（排除軟刪除的衣物），但這個 view 從來沒進 migration，遠端不存在
-- security_invoker：用呼叫者身分查，closet_items 的 RLS 才會生效
create or replace view public.active_closet_items
with (security_invoker = true) as
select * from public.closet_items where status <> 'DELETED';

grant select on public.active_closet_items to authenticated;
