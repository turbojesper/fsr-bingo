-- 04_realtime.sql
-- Realtime nur für game_state: Beamer und Admin bekommen Phasenwechsel sofort.
-- Die Teilnehmerliste läuft bewusst NICHT über Realtime (jeder Herzschlag wäre eine Nachricht).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_state'
  ) then
    alter publication supabase_realtime add table public.game_state;
  end if;
end $$;
