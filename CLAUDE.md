# BingoApp - Bullshit-Bingo für die FSR-Weihnachtsfeier

Projekt-ArbeitsMD (WiWi FSR, Universität Hamburg). Wird nach jeder Phase knapp aktualisiert: Status, Entscheidungen, offene Punkte.

## Arbeitsweise mit Jesper (wichtig)

Jesper ist kein Profi-Entwickler und lernt mit diesem Projekt, mit KI zu entwickeln.

- Jeder Plan beginnt mit 3 bis 5 Sätzen: **was** gebaut wird und **warum so**.
- Fachbegriffe beim ersten Auftreten in einem Satz erklären (z. B. RLS, RPC, Realtime, Deployment).
- Schritte, die Jesper selbst machen muss (Accounts, Klicks im Browser, Keys kopieren), als nummerierte Anleitung.
- Nach jeder Umsetzung: "So testest du es" mit konkreten Schritten (URL, was du sehen solltest).
- Keine Befehle mit Datenverlust-Risiko ohne Erklärung und Rückfrage.
- Antworten auf Deutsch mit echten Umlauten, kurz und strukturiert.

## Idee

Bullshit-Bingo als Party-Spiel für alle Gäste (Ursprung: Vorschlag, Bingo zu spielen, plus Idee eines Basteltischs für Karten):

1. Gäste reichen per **eigenem Handy** Begriffe zu einem **Motto** ein (Online-Umfrage, Live-**Wortwolke** auf dem Beamer). Beispiel: "Die besten Uni-Gadgets" → "Monster White".
2. Begriffe erscheinen erst nach **Freigabe** durch den Manager. Häufigste bzw. zusammengeführte ähnliche Begriffe bilden den **Pool**.
3. Jeder Gast bekommt eine eigene, zufällige **Bingo-Karte** (3x3, 4x4 oder 5x5) aus dem Pool.
4. Ein **Bingo-Automat im Retro-Pixelart-Look** zieht animiert Begriffe auf dem Beamer, moderiert per JBL-Box + Mikro, **Bingo-Musik** im Hintergrund.
5. Wer den Begriff hat, streicht ab. Erste vollständige Linie gewinnt.

## Ablauf einer Runde (Zustandsmaschine)

| Phase | Präsentation (Beamer) | Manager | Teilnehmer (Handy) |
|---|---|---|---|
| **Lobby** | QR-Code, Motto, Bilder-Slideshow | Motto, Rastergröße, Regeln festlegen | Nickname eingeben |
| **Sammeln** | Live-Wortwolke (nur Freigegebenes), Countdown | Freigeben, löschen, zusammenführen | Begriffe einsenden |
| **Kuratieren** | "Gleich geht's los" | Top-Begriffe prüfen, Pool festlegen | Warten |
| **Karten** | Hinweis "Karte checken" | Karten erzeugen, Druckansicht | Eigene Karte sehen |
| **Ziehung** | Automat-Animation, gezogener Begriff, Historie | Ziehen, Musik, Lautstärke | Felder abstreichen, Bingo-Button |
| **Gewinner** | Name + Gewinnkarte, Fanfare, Schnee/Konfetti | Bingo-Prüfung, bestätigen/ablehnen | Ergebnis |
| **Nächste Runde** | zurück zur Lobby, neues Motto | Runde zurücksetzen, Historie behalten | neue Karte |

## Architektur (entschieden)

**GitHub Pages (Frontend) + Supabase (Datenbank, Free Plan).**

Warum: GitHub Pages liefert nur statische Dateien aus (HTML, CSS, JS) und kann keine Daten empfangen. Für Einsendungen, Karten und Bingo-Prüfung braucht es eine Datenbank im Netz. Supabase bietet Postgres, Zugriffsregeln (RLS) und Datenbankfunktionen (RPC) kostenlos, damit läuft die Spiellogik sicher auf dem Server, ohne eigenen Server zu betreiben. Firebase (Free) wäre auf 100 gleichzeitige Verbindungen begrenzt, das ist für eine Party zu knapp.

- **Frontend**: statische Seiten auf GitHub Pages, Vanilla JS (ES-Module), kein Build-Schritt. Alle Libraries und Fonts im Repo (kein CDN).
- **Drei Ansichten**: `screen.html` (Beamer), `admin.html` (Manager, Login, auch vom Handy bedienbar), `index.html` bzw. `play` (Teilnehmer, mobile-first, Einstieg per QR-Code).
- **Datenbank**: Supabase-Projekt in Region **Frankfurt (EU)**. Tabellen u. a. für Spielzustand, Runden, Teilnehmer, Einsendungen, Pool, Karten, Ziehungen.
- **Sicherheit**: Row Level Security (RLS) auf allen Tabellen. Teilnehmer schreiben nur über RPC-Funktionen (Einsenden, Karte holen, Bingo melden), nie direkt. Admin per Supabase-Login. Bingo-Prüfung serverseitig in einer RPC-Funktion.
- **Verbindungslast klein halten**: Nur `screen` und `admin` nutzen Realtime. Teilnehmer-Handys arbeiten mit einzelnen Anfragen und leichtem Polling des Spielzustands (alle paar Sekunden). Grund: Free-Plan-Limits (200 gleichzeitige Realtime-Verbindungen, 100 Nachrichten pro Sekunde) werden so selbst bei vielen Gästen nicht erreicht.
- **Netzwerk**: Handys brauchen nur normales Internet (Uni-WLAN oder mobile Daten). Kein lokaler Server nötig.
- **Musik und SFX** liegen lokal auf dem Laptop und werden in `screen` per Ordnerauswahl geladen (kein Upload, keine Lizenzprobleme im öffentlichen Repo). Wiedergabe über Laptop-Ausgang → JBL.
- **Repo**: öffentlich (GitHub Pages im Gratis-Account nur für öffentliche Repos). Darum: keine Secrets im Repo. Der Supabase-Anon/Publishable-Key ist für das Frontend gedacht und darf öffentlich sein, Schutz übernimmt RLS. Der Service-Role-Key kommt nie ins Repo.

Risiken und Gegenmaßnahmen:

| Risiko | Gegenmaßnahme |
|---|---|
| Supabase pausiert Free-Projekte nach ca. 1 Woche geringer Aktivität | Vor der Feier Projekt im Dashboard öffnen, Generalprobe kurz vorher |
| Internet fällt aus | Papier-Fallback: Begriffe manuell im Admin, Karten als PDF drucken, Prüfung per Kartennummer |
| Unangemessene Begriffe | Vorab-Freigabe Pflicht, Blockliste |
| Datenschutz | Nur Nickname + Begriffe speichern, EU-Region, Daten nach der Feier per Skript löschen |

## Spielregeln und Logik

- **Gästezahl**: 10 bis 50 Mitspieler, die App muss für beide Enden funktionieren.
- **Einsendungen**: max. Zeichen (Default 30), max. Einsendungen pro Gerät einstellbar (Default 3, bei kleinen Runden bis 5), Rate-Limit.
- **Normalisierung**: trim, Kleinschreibung, Mehrfach-Leerzeichen, Satzzeichen. Ähnlichkeit nur als **Vorschlag**, Zusammenführen entscheidet der Manager.
- **Moderation**: Vorab-Freigabe immer an. Nur freigegebene Begriffe erscheinen auf dem Beamer und im Pool.
- **Poolgröße**: Karten werden zufällig aus dem Pool gezogen. Damit sich Karten genug unterscheiden, gilt Pool mindestens ca. 1,5 x Felder. Admin warnt darunter.

| Raster | Felder | Min. Pool |
|---|---|---|
| 3x3 | 9 | 14 |
| 4x4 | 16 | 24 |
| 5x5 (Mitte frei) | 24 | 36 |

- **Rastergröße automatisch vorschlagen**: Admin schlägt das größte Raster vor, dessen Mindestpool erfüllt ist (datenbasiert, nicht nach Gästezahl geraten). Zu kleiner Pool: Manager kann eigene Begriffe ergänzen.
- Grobe Orientierung (Schätzung, hängt von Doppelungen ab): ca. 10-15 Gäste → 3x3, ca. 16-30 → 4x4, ab ca. 30 → 5x5.

- **Karten**: zufällig pro Teilnehmer, mit Kartennummer (reproduzierbar für Druck und Prüfung), an das Gerät gebunden (Token in localStorage), Reload stellt Karte und Markierungen wieder her.
- **Ziehung**: ohne Zurücklegen aus dem Pool.
- **Gewinn**: Linie (Reihe/Spalte/Diagonale), optional "Volle Karte". Prüfung serverseitig gegen gezogene Begriffe.
- **Mehrere Gewinner**: Alle gültigen Bingos zum selben gezogenen Begriff sind Gewinner (bei 50 Gästen realistisch). screen zeigt alle.
- **Basteltisch (optional)**: Druckansicht mit leeren Karten im Pixel-Look plus Liste der Pool-Begriffe zum Selbstbeschriften.

## Medien

- Musik/SFX lokal auf dem Laptop, Ordner pro Szene (Lobby, Ziehung, Gewinner) und SFX (Trommelwirbel, Kugel-Ding, Fanfare). Nur lizenzfreie Tracks, Nachweis in `assets/CREDITS.md`.
- Bilder (Logo, Hintergründe, Slideshow) in `assets/images/` (nur eigene oder frei lizenzierte Bilder, Repo ist öffentlich).
- Admin: Play/Pause/Skip, Lautstärke Musik und SFX getrennt, **Ducking** (Musik leiser bei Ziehung und per Taste "Mikro"), Szenenwechsel automatisch je Phase.

## Design

**Retro-Pixelart, Winter-Wonderland-Stimmung**, einheitlich über alle drei Ansichten:

- Gemeinsame Design-Datei (Farben, Abstände, Fonts) für alle Seiten.
- Pixel-Font nur für Überschriften und Automat, gut lesbare Schrift für Fließtext (Beamer aus 10 m, Handy bei Partylicht).
- Bingo-Automat als Pixel-Animation (Canvas, `image-rendering: pixelated`), Kugeln fliegen, Kugel rollt raus.
- Dunkles Theme, hoher Kontrast, große Touch-Felder auf dem Handy, Pixel-Schnee.

**Später: Allrounder-App mit austauschbaren Themes** (z. B. Silvester, Halloween). Jetzt nur Weihnachten bauen, aber so strukturieren, dass ein neues Theme nur ein neuer Ordner ist:

- Alles Theme-Spezifische (Farben, Fonts, Texte, Bilder, Partikel-Effekt wie Schnee, Automat-Sprites, Sound-Szenen) liegt in `themes/<name>/` mit einer `theme.json`.
- Spiellogik und Seiten enthalten keine hartcodierten Weihnachtselemente.
- Aktives Theme wählt der Admin (Default: weihnachten).
- Grund: Jetzt kostet die Trennung wenig, nachträgliches Auseinanderziehen viel.

## Ordnerstruktur (Ziel)

```
BingoApp/
  CLAUDE.md  PROMPTS.md  README.md
  index.html  screen.html  admin.html     (oder in einem Unterordner, im Plan festlegen)
  js/  css/  vendor/  assets/CREDITS.md
  themes/weihnachten/  theme.json, Bilder, Sprites, Fonts (später weitere Themes)
  supabase/          SQL: Tabellen, RLS, Funktionen, Lösch-Skript
  scripts/           Hilfsskripte, Lasttest
  docs/              Ablauf.md (Checkliste für den Abend)
  _input/            Rohmaterial, z. B. Sprachnachrichten (gitignored)
  Archiv/            alte Versionen, nichts löschen (gitignored)
```

## Konventionen

- UI und Doku Deutsch mit echten Umlauten (ä, ö, ü, ß). Code-Bezeichner Englisch, Kommentare Deutsch.
- Keine Gedankenstriche (em-dash) in Texten, stattdessen Komma, Doppelpunkt, Klammer oder " - ".
- Git: kleine Commits pro Feature mit verständlicher Nachricht, `main` immer lauffähig. Nie committen: `_input/`, `Archiv/`, Musik, `.env`, Service-Role-Key.
- Alte Dokumentversionen nach `Archiv/`, nicht löschen.
- Bei Unklarheit: Annahme nennen oder gezielt nachfragen.
- Nach jeder Phase: Status-Tabelle aktualisieren, committen, pushen.

## Status

| Phase | Inhalt | Status |
|---|---|---|
| 0 | Setup, Repo, Supabase-Projekt, GitHub Pages | Repo + Pages fertig, Supabase-Projekt offen (Jesper) |
| 1 | Fundament: Datenbank, Sicherheit, drei Ansichten, Join | Code fertig, Test mit Supabase + 2 Handys offen |
| 2 | Sammelphase, Wortwolke, Freigabe | offen |
| 3 | Pool, Karten, Druckansicht | offen |
| 4 | Ziehung, Pixel-Automat, Bingo-Prüfung | offen |
| 5 | Musik, SFX, Bilder, Pixel-Design | offen |
| 6 | Härtung, Lasttest, Generalprobe, Ablauf | offen |
| 7 | Weitere Themes (Silvester, Halloween ...) | später |

## Entscheidungen Phase 1

- Seiten liegen im Hauptordner (`index.html`, `screen.html`, `admin.html`), damit die QR-URL kurz bleibt.
- Admin = Eintrag in Tabelle `admins` (nicht jeder eingeloggte Account). Registrierung in Supabase ausschalten.
- Teilnehmer schreiben nur per RPC (`join_game`, `poll_state`), Admin per `admin_*`-RPCs mit `is_admin()`-Prüfung. Anon darf nur `game_state` und `rounds` lesen.
- "Online"-Status = Herzschlag: jeder `poll_state` setzt `last_seen_at`. Teilnehmerliste im Admin per Polling (5 s), nicht Realtime.
- Realtime nur auf `game_state` und `rounds` (screen, admin). Handy-Poll-Intervall steht in der DB (`poll_interval_ms`), Admin stellt es ein.
- Theme: `themes/<name>/theme.json` liefert Farben, Font, Texte, Partikel. Seiten nutzen `data-t`-Attribute und `t('pfad')`.
- Lokal testen: Python-`http.server` bearbeitet nur eine Anfrage gleichzeitig, vereinzelte Verbindungsabbrüche beim ersten Laden sind dort normal (Neuladen hilft).

## Offene Punkte

- Supabase-Projekt anlegen, URL + Key in `js/config.js`, SQL 01 bis 05 ausführen (Anleitung in README)
- Abnahme Phase 1: Phasenwechsel auf screen + 2 Handys, Reload, Admin-Schutz

- Offizieller Name der Feier (in der Sprachnachricht unklar, evtl. "WiWi Wonderland")
- Preise und Anzahl Runden/Mottos
- Musikauswahl
