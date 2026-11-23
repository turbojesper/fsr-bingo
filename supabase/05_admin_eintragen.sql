-- 05_admin_eintragen.sql
-- VORLAGE: Ersetze DEINE@MAIL.DE durch die E-Mail des Admin-Accounts
-- (Supabase: Authentication > Users), dann im SQL-Editor ausführen.
-- Diese Datei NICHT mit der echten E-Mail committen.

insert into public.admins (user_id)
select id from auth.users where email = 'DEINE@MAIL.DE'
on conflict do nothing;

-- Kontrolle: sollte genau 1 Zeile liefern
select a.user_id, u.email from public.admins a join auth.users u on u.id = a.user_id;
