-- 01_tabellen.sql
-- Legt alle Tabellen an. Im Supabase SQL-Editor als Erstes ausführen.
-- Mehrfaches Ausführen ist unschädlich (if not exists).

-- Spielzustand: genau eine Zeile (id = 1)
create table if not exists public.rounds (
  id          bigint generated always as identity primary key,
  number      int  not null default 1,
  motto       text not null default '',
  grid_size   int  not null default 4 check (grid_size in (3, 4, 5)),
  created_at  timestamptz not null default now(),
  ended_at    timestamptz
);

create table if not exists public.game_state (
  id               int primary key default 1 check (id = 1),
  phase            text not null default 'lobby'
                   check (phase in ('lobby', 'collect', 'curate', 'cards', 'draw', 'winner')),
  current_round_id bigint references public.rounds (id),
  theme            text not null default 'weihnachten',
  poll_interval_ms int  not null default 4000 check (poll_interval_ms between 1000 and 60000),
  updated_at       timestamptz not null default now()
);

-- Teilnehmer gelten über alle Runden hinweg
create table if not exists public.participants (
  id           uuid primary key default gen_random_uuid(),
  device_token text not null unique,
  nickname     text not null check (char_length(nickname) between 1 and 20),
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create unique index if not exists participants_nickname_uq
  on public.participants (lower(nickname));

-- Einsendungen (ab Phase 2 befüllt)
create table if not exists public.submissions (
  id             bigint generated always as identity primary key,
  round_id       bigint not null references public.rounds (id) on delete cascade,
  participant_id uuid   references public.participants (id) on delete set null,
  text_raw       text   not null,
  text_norm      text   not null,
  status         text   not null default 'pending'
                 check (status in ('pending', 'approved', 'rejected')),
  merged_into    bigint references public.submissions (id) on delete set null,
  created_at     timestamptz not null default now()
);
create index if not exists submissions_round_idx on public.submissions (round_id);

-- Pool (ab Phase 3 befüllt)
create table if not exists public.pool_items (
  id        bigint generated always as identity primary key,
  round_id  bigint not null references public.rounds (id) on delete cascade,
  label     text   not null,
  weight    int    not null default 1
);
create index if not exists pool_items_round_idx on public.pool_items (round_id);

-- Karten (ab Phase 3 befüllt). participant_id leer = Druckkarte
create table if not exists public.cards (
  id             bigint generated always as identity primary key,
  round_id       bigint not null references public.rounds (id) on delete cascade,
  participant_id uuid   references public.participants (id) on delete set null,
  card_no        int    not null,
  cells          jsonb  not null default '[]'::jsonb,
  marks          jsonb  not null default '[]'::jsonb,
  created_at     timestamptz not null default now(),
  unique (round_id, card_no)
);

-- Ziehungen (ab Phase 4 befüllt). Zwei unique-Regeln = ohne Zurücklegen
create table if not exists public.draws (
  id           bigint generated always as identity primary key,
  round_id     bigint not null references public.rounds (id) on delete cascade,
  pool_item_id bigint not null references public.pool_items (id) on delete cascade,
  seq          int    not null,
  drawn_at     timestamptz not null default now(),
  unique (round_id, seq),
  unique (round_id, pool_item_id)
);

-- Wer in dieser Tabelle steht, ist Admin (verweist auf den Supabase-Login)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

-- Startdaten: Runde 1 und der Spielzustand
insert into public.rounds (number, motto)
select 1, ''
where not exists (select 1 from public.rounds);

insert into public.game_state (id, current_round_id)
select 1, (select min(id) from public.rounds)
where not exists (select 1 from public.game_state);
