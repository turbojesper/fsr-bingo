-- 03_funktionen_rpc.sql
-- RPC-Funktionen: der einzige Weg, wie Handys und Admin etwas schreiben.
-- "security definer" = die Funktion läuft mit den Rechten ihres Besitzers und
-- darf dadurch schreiben, obwohl der Aufrufer selbst keine Schreibrechte hat.
-- Dafür prüft jede Funktion ihre Eingaben und (bei Admin-Funktionen) is_admin().

-- ---------------------------------------------------------------
-- Teilnehmer: beitreten
-- ---------------------------------------------------------------
create or replace function public.join_game(p_token text, p_nickname text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick text := btrim(regexp_replace(coalesce(p_nickname, ''), '\s+', ' ', 'g'));
  v_row  public.participants;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9-]{16,64}$' then
    raise exception 'Ungültiges Geräte-Token.' using errcode = 'P0001';
  end if;

  -- Gerät kennen wir schon: bestehenden Teilnehmer zurückgeben (Reload-sicher)
  select * into v_row from public.participants where device_token = p_token;
  if found then
    update public.participants set last_seen_at = now() where id = v_row.id;
    return jsonb_build_object('nickname', v_row.nickname);
  end if;

  if char_length(v_nick) < 1 or char_length(v_nick) > 20 then
    raise exception 'Der Nickname muss 1 bis 20 Zeichen lang sein.' using errcode = 'P0001';
  end if;

  begin
    insert into public.participants (device_token, nickname)
    values (p_token, v_nick)
    returning * into v_row;
  exception when unique_violation then
    raise exception 'Dieser Nickname ist schon vergeben.' using errcode = 'P0001';
  end;

  return jsonb_build_object('nickname', v_row.nickname);
end;
$$;

-- ---------------------------------------------------------------
-- Teilnehmer: Zustand abfragen (Polling) und Herzschlag setzen
-- ---------------------------------------------------------------
create or replace function public.poll_state(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nick  text;
  v_state public.game_state;
  v_motto text;
begin
  select nickname into v_nick from public.participants where device_token = p_token;
  if not found then
    raise exception 'Nicht beigetreten.' using errcode = 'P0002';
  end if;

  update public.participants set last_seen_at = now() where device_token = p_token;

  select * into v_state from public.game_state where id = 1;
  select motto into v_motto from public.rounds where id = v_state.current_round_id;

  return jsonb_build_object(
    'nickname', v_nick,
    'phase', v_state.phase,
    'motto', coalesce(v_motto, ''),
    'theme', v_state.theme,
    'poll_interval_ms', v_state.poll_interval_ms
  );
end;
$$;

-- ---------------------------------------------------------------
-- Admin: Phase setzen
-- ---------------------------------------------------------------
create or replace function public.admin_set_phase(p_phase text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Keine Admin-Berechtigung.' using errcode = '42501';
  end if;
  if p_phase not in ('lobby', 'collect', 'curate', 'cards', 'draw', 'winner') then
    raise exception 'Unbekannte Phase.' using errcode = 'P0001';
  end if;
  update public.game_state set phase = p_phase, updated_at = now() where id = 1;
end;
$$;

-- ---------------------------------------------------------------
-- Admin: Einstellungen (Motto, Poll-Intervall, Theme)
-- ---------------------------------------------------------------
create or replace function public.admin_set_settings(
  p_motto text,
  p_poll_interval_ms int,
  p_theme text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_round bigint;
begin
  if not public.is_admin() then
    raise exception 'Keine Admin-Berechtigung.' using errcode = '42501';
  end if;
  if p_poll_interval_ms is null or p_poll_interval_ms < 1000 or p_poll_interval_ms > 60000 then
    raise exception 'Intervall muss zwischen 1000 und 60000 ms liegen.' using errcode = 'P0001';
  end if;
  if p_theme is null or p_theme !~ '^[a-z0-9_-]{1,40}$' then
    raise exception 'Ungültiger Theme-Name.' using errcode = 'P0001';
  end if;
  if char_length(coalesce(p_motto, '')) > 120 then
    raise exception 'Das Motto ist zu lang (max. 120 Zeichen).' using errcode = 'P0001';
  end if;

  select current_round_id into v_round from public.game_state where id = 1;
  update public.rounds set motto = btrim(coalesce(p_motto, '')) where id = v_round;
  update public.game_state
     set poll_interval_ms = p_poll_interval_ms, theme = p_theme, updated_at = now()
   where id = 1;
end;
$$;

-- ---------------------------------------------------------------
-- Admin: Teilnehmerliste
-- ---------------------------------------------------------------
create or replace function public.admin_list_participants()
returns table (nickname text, created_at timestamptz, last_seen_at timestamptz, online boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window interval;
begin
  if not public.is_admin() then
    raise exception 'Keine Admin-Berechtigung.' using errcode = '42501';
  end if;
  select make_interval(secs => greatest(3 * poll_interval_ms / 1000.0, 10))
    into v_window from public.game_state where id = 1;

  return query
    select p.nickname, p.created_at, p.last_seen_at, (p.last_seen_at > now() - v_window)
      from public.participants p
     order by p.created_at;
end;
$$;

-- ---------------------------------------------------------------
-- Ausführungsrechte: erst allen entziehen, dann gezielt vergeben
-- ---------------------------------------------------------------
revoke all on function public.join_game(text, text)                from public;
revoke all on function public.poll_state(text)                     from public;
revoke all on function public.admin_set_phase(text)                from public;
revoke all on function public.admin_set_settings(text, int, text)  from public;
revoke all on function public.admin_list_participants()            from public;

grant execute on function public.join_game(text, text)               to anon, authenticated;
grant execute on function public.poll_state(text)                    to anon, authenticated;
-- Admin-Funktionen nur für eingeloggte Nutzer (zusätzlich prüft is_admin())
grant execute on function public.admin_set_phase(text)               to authenticated;
grant execute on function public.admin_set_settings(text, int, text) to authenticated;
grant execute on function public.admin_list_participants()           to authenticated;
