-- 衣物理解：上傳時由 AI 辨識的屬性（保暖度、正式度、顏色、風格…），推薦時用來篩候選與寫進 prompt。
-- 形狀見 apps/web/lib/closet/attributes.ts；null 代表還沒辨識。
alter table public.closet_items add column if not exists attributes jsonb;

-- view 用 select * 建立時就把欄位展開了，新欄位要重建 view 才看得到（加在最後，create or replace 可以）
create or replace view public.active_closet_items
with (security_invoker = true) as
select * from public.closet_items where status <> 'DELETED';
