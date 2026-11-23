-- 02_sicherheit_rls.sql
-- Zugriffsregeln (Row Level Security). Nach 01 ausführen.
--
-- Grundprinzip: RLS an + keine passende Regel = Zugriff verboten.
-- Der öffentliche Anon-Key darf nur game_state und rounds LESEN.
-- Geschrieben wird ausschließlich über RPC-Funktionen (03_funktionen_rpc.sql).

alter table public.game_state   enable row level security;
alter table public.rounds       enable row level security;
alter table public.participants enable row level security;
alter table public.submissions  enable row level security;
alter table public.pool_items   enable row level security;
alter table public.cards        enable row level security;
alter table public.draws        enable row level security;
alter table public.admins       enable row level security;

-- Hilfsfunktion: ist der eingeloggte Nutzer Admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Alte Regeln entfernen, damit das Skript wiederholbar ist
drop policy if exists game_state_read   on public.game_state;
drop policy if exists rounds_read       on public.rounds;
drop policy if exists participants_admin_read on public.participants;
drop policy if exists submissions_admin_read  on public.submissions;
drop policy if exists pool_items_admin_read   on public.pool_items;
drop policy if exists cards_admin_read        on public.cards;
drop policy if exists draws_admin_read        on public.draws;
drop policy if exists admins_self_read        on public.admins;

-- Öffentlich lesbar: Phase, Motto, Theme (für Beamer und Realtime)
create policy game_state_read on public.game_state for select to anon, authenticated using (true);
create policy rounds_read     on public.rounds     for select to anon, authenticated using (true);

-- Nur Admins dürfen den Rest lesen
create policy participants_admin_read on public.participants for select to authenticated using (public.is_admin());
create policy submissions_admin_read  on public.submissions  for select to authenticated using (public.is_admin());
create policy pool_items_admin_read   on public.pool_items   for select to authenticated using (public.is_admin());
create policy cards_admin_read        on public.cards        for select to authenticated using (public.is_admin());
create policy draws_admin_read        on public.draws        for select to authenticated using (public.is_admin());

-- Jeder Eingeloggte darf nur die eigene Zeile in admins sehen (für die Admin-Prüfung)
create policy admins_self_read on public.admins for select to authenticated using (user_id = auth.uid());

-- Zusätzliche Absicherung: direkte Schreibrechte komplett entziehen.
-- (Ohne Schreib-Policy wäre Schreiben ohnehin verboten, das hier ist der zweite Riegel.)
revoke insert, update, delete, truncate on
  public.game_state, public.rounds, public.participants, public.submissions,
  public.pool_items, public.cards, public.draws, public.admins
from anon, authenticated;

-- Lesen für anon nur dort, wo es Policies gibt
revoke select on public.participants, public.submissions, public.pool_items,
  public.cards, public.draws, public.admins from anon;
