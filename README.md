# FSR Bingo

Bullshit-Bingo als Party-Spiel für die Weihnachtsfeier des FSR WiWi (Universität Hamburg).
Gäste reichen per Handy Begriffe zu einem Motto ein, daraus entstehen Bingo-Karten, ein Pixelart-Automat zieht die Begriffe auf dem Beamer.

**Technik:** statische Seiten auf GitHub Pages (Vanilla JS, kein Build) + Supabase (Datenbank, Free Plan, EU).

Details, Spielregeln und Status stehen in [CLAUDE.md](CLAUDE.md).

## Lokal testen

```
python -m http.server 8000
```

Dann im Browser `http://localhost:8000/` öffnen (nicht die Datei per Doppelklick, `file://` reicht nicht).

## Supabase einrichten (einmalig)

1. Auf supabase.com ein Projekt anlegen (Region Frankfurt, Free Plan).
2. Project URL und Publishable/Anon Key in `js/config.js` eintragen (nie den service_role Key).
3. Im SQL-Editor nacheinander ausführen: `supabase/01_tabellen.sql`, `02_sicherheit_rls.sql`, `03_funktionen_rpc.sql`, `04_realtime.sql`.
4. Authentication > Users: Admin-Account anlegen (Auto confirm). Unter Sign In / Providers "Allow new users to sign up" ausschalten.
5. `supabase/05_admin_eintragen.sql` mit der eigenen E-Mail im SQL-Editor ausführen (nicht mit echter E-Mail committen).

## Seiten

| Seite | Zweck |
|---|---|
| `index.html` | Teilnehmer (Handy), Einstieg per QR-Code |
| `screen.html` | Beamer |
| `admin.html` | Manager (Login) |

## Wichtig: Repo ist öffentlich

Nie committen: Service-Role-Key, Passwörter, `.env`, Musik, Rohmaterial (`_input/`), Daten von Gästen.
Der Supabase-Anon/Publishable-Key in `config.js` darf öffentlich sein.
