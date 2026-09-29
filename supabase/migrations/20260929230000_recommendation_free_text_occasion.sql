-- occasion 改成使用者自己寫的一句今天情境（可空字串），不再只收 casual/work/date/sport 四種標籤
alter table public.daily_recommendations drop constraint if exists daily_recommendations_occasion_check;
alter table public.daily_recommendations add constraint daily_recommendations_occasion_length check (char_length(occasion) <= 100);
