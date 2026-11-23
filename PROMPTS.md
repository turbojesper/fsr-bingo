# Arbeitsanleitung und Prompts für Claude Code

Projektordner: `C:\Users\jespe\Desktop\AI\BingoApp`

## So arbeitest du mit Claude Code

### Starten

1. **Windows Terminal** öffnen (Startmenü → "Terminal").
2. In den Projektordner wechseln:
   ```
   cd "$env:USERPROFILE\Desktop\AI\BingoApp"
   ```
3. Claude Code starten: `claude`
   Warum im Projektordner: Claude Code darf nur in diesem Ordner arbeiten und liest beim Start automatisch die `CLAUDE.md` (Projektkontext, Regeln, Status).

### Der Grundrhythmus pro Phase

| Schritt | Was du tust | Warum |
|---|---|---|
| 1. Plan Mode an | `Shift+Tab` drücken, bis unten "plan mode" steht (unter Windows je nach Terminal stattdessen `Alt+M`) | Claude liest und plant nur, ändert noch nichts. Fehler im Plan kosten nichts, Fehler im Code schon. |
| 2. Prompt einfügen | Prompt der Phase aus dieser Datei kopieren, mit `Strg+V` einfügen, Enter | Der Prompt ist kurz, weil der Kontext in `CLAUDE.md` steht. |
| 3. Plan lesen | Verstehst du jeden Schritt? Wenn nicht: nachfragen ("Erklär mir Schritt 3 einfacher") | Du bleibst Chef und lernst nebenbei. |
| 4. Plan freigeben | Option "Ja, umsetzen" wählen | Erst jetzt wird Code geschrieben. |
| 5. Rückfragen beantworten | Bei Befehlen fragt Claude um Erlaubnis | Siehe "Erlaubnisse" unten. |
| 6. Testen | Die "So testest du es"-Schritte am Ende befolgen | Nur getestete Phasen gelten als fertig. |
| 7. Commit prüfen | Claude committet und pusht am Ende jeder Phase | Jeder Commit ist ein Speicherpunkt, zu dem man zurück kann. |
| 8. `/clear` | Gesprächsverlauf leeren, dann nächste Phase | Spart Tokens. Der Stand liegt in `CLAUDE.md` und im Repo, nicht im Chat. |

### Erlaubnisse (wenn Claude einen Befehl ausführen will)

- **Unbedenklich, gerne "immer erlauben"**: `git status`, `git add`, `git commit`, `git push`, `gh`, `python -m http.server`, Dateien lesen/anlegen im Projektordner.
- **Genau lesen, einzeln erlauben**: alles mit `rm`, `del`, `Remove-Item`, `git reset`, `git push --force`, Installationen.
- **Nie** mit `--dangerously-skip-permissions` starten.

### Nützliche Kurzbefehle

| Befehl | Wirkung |
|---|---|
| `Esc` | Claude sofort stoppen (z. B. wenn es in die falsche Richtung läuft) |
| `/clear` | Neues Gespräch, Projektwissen bleibt über `CLAUDE.md` |
| `/help` | Übersicht aller Befehle |
| Nachfrage in normaler Sprache | "Was hast du gerade geändert und warum?" oder "Mach den letzten Commit rückgängig" |

### Wenn etwas kaputt ist

1. Fehlermeldung oder Screenshot-Beschreibung an Claude geben: "Auf dem Handy erscheint X statt Y."
2. Claude zuerst im Plan Mode die Ursache suchen lassen, dann fixen.
3. Notfall: "Setz den Code auf den letzten funktionierenden Commit zurück und erklär mir, was du tust."

---

## Phase 0: Init (erster Prompt)

```
Lies CLAUDE.md vollständig. Wir starten das Projekt. Ich bin kein Profi-Entwickler: erkläre mir
zu Beginn in wenigen Sätzen die Gesamtarchitektur (GitHub Pages + Supabase) und warum wir sie so bauen.
Dann plane das Setup, noch keinen Spiel-Code.

1. Voraussetzungen prüfen: git --version, gh --version, gh auth status, python --version.
   Fehlt etwas: nenne mir den winget-Befehl und warte, installiere nichts selbst.
2. Ordnerstruktur laut CLAUDE.md anlegen. Die beiden WhatsApp-.ogg-Dateien nach _input/ verschieben.
3. git init, .gitignore (_input/, Archiv/, .env, Musik- und Audiodateien, OS-Müll), kurze README.
4. Öffentliches GitHub-Repo "fsr-bingo" per gh anlegen, erster Commit, push.
   Erkläre kurz, warum das Repo öffentlich ist und was deshalb nie hinein darf.
5. GitHub Pages für das Repo aktivieren (Deploy vom main-Branch), Pages-URL nennen.
6. Supabase: Führe mich Schritt für Schritt durch Account und neues Projekt (Region Frankfurt, Free Plan).
   Sag mir genau, welche zwei Werte (Projekt-URL, Anon/Publishable Key) ich wo kopiere.
   Lege eine config.js an, in die diese Werte kommen. Service-Role-Key niemals verwenden.
7. Verbindungstest: eine minimale Testseite, die aus einer Testtabelle eine Zeile liest
   und "Verbindung zu Supabase OK" anzeigt. SQL dafür als Datei in supabase/, ich führe es im
   SQL-Editor aus (erkläre wie).
8. Lokales Testen erklären: python -m http.server im Projektordner, warum file:// nicht reicht.

Akzeptanz: Die Testseite zeigt "Verbindung OK" lokal und auf der GitHub-Pages-URL am Handy.
Am Ende: CLAUDE.md Status aktualisieren, committen, pushen, "So testest du es" ausgeben.
```

---

## Phase 1: Fundament

```
Lies CLAUDE.md. Plane und baue das Fundament, noch ohne Spielinhalte.
Erkläre vorab kurz: Tabellen, RLS, RPC-Funktionen und warum Teilnehmer nur über Funktionen schreiben.

- Supabase-Schema als SQL-Dateien in supabase/ (nummeriert, in Reihenfolge ausführbar):
  Spielzustand/Phase, Runden, Teilnehmer, Einsendungen, Pool, Karten, Ziehungen.
  RLS auf allen Tabellen. Teilnehmer-Aktionen nur per RPC. Admin per Supabase-Login (E-Mail).
- Drei Ansichten als Gerüst mit gemeinsamer Design-Datei (Pixel-Look laut CLAUDE.md, erst grob),
  Farben/Fonts/Texte von Anfang an aus themes/weihnachten/ laden (spätere Themes vorbereiten):
  Teilnehmer, screen, admin. Phasenwechsel im Admin erscheint auf screen (Realtime)
  und auf dem Handy (Polling alle paar Sekunden, Intervall konfigurierbar).
- Teilnehmer-Join: Nickname, Geräte-Token in localStorage, Reload ohne Datenverlust.
- screen zeigt QR-Code zur Teilnehmer-URL (QR-Library lokal im Repo).
- Admin: Login, Phasen-Steuerung, Liste verbundener Teilnehmer.

Akzeptanz: Laptop (screen + admin) und 2 Handys, Phasenwechsel kommt überall an,
Handy-Reload behält den Teilnehmer, ohne Admin-Login keine Admin-Aktionen möglich.
Am Ende: CLAUDE.md aktualisieren, committen, pushen, "So testest du es".
```

---

## Phase 2: Sammelphase, Wortwolke, Freigabe

```
Lies CLAUDE.md. Plane und baue die Sammelphase (Online-Umfrage mit Wortwolke).

- Handy: Begriff einsenden (Zeichenlimit, Limit pro Gerät, Rate-Limit, Bestätigung).
- Admin: Eingang aller Einsendungen mit Anzahl, Freigeben/Ablehnen, Blockliste,
  Ähnlichkeitsvorschläge (z. B. Levenshtein), Zusammenführen mit wählbarem Anzeigebegriff,
  manuelles Hinzufügen (Papier-Fallback).
- screen: Live-Wortwolke nur aus freigegebenen Begriffen, Größe nach Häufigkeit,
  flüssige Updates ohne Flackern, Motto als Überschrift, optional Countdown, im Pixel-Look.

Akzeptanz: 3 Geräte senden parallel, nichts erscheint ohne Freigabe, Zusammenführen ändert
die Gewichtung sofort, Limits greifen auch bei Manipulationsversuch (serverseitig geprüft).
Am Ende: CLAUDE.md aktualisieren, committen, pushen, "So testest du es".
```

---

## Phase 3: Pool, Karten, Druckansicht

```
Lies CLAUDE.md. Plane und baue Pool-Auswahl und Bingo-Karten.

- Admin: Top-Begriffe nach Häufigkeit, Pool festlegen, Rastergröße 3x3/4x4/5x5 (5x5 mit Freifeld),
  Warnung bei zu kleinem Pool laut CLAUDE.md, automatischer Rastervorschlag (größtes Raster mit erfülltem Mindestpool).
  Muss mit 10 wie mit 50 Gästen sinnvoll funktionieren.
- Karten zufällig pro Teilnehmer, mit Kartennummer, serverseitig gespeichert.
- Handy: eigene Karte, große Touch-Felder, Abstreichen per Tap, Markierungen überstehen Reload.
- Druckansicht: N zufällige Karten für Papier-Fallback (A4, mehrere pro Seite, Kartennummer),
  plus Basteltisch-Variante (leere Pixel-Karten + Begriffsliste). Per Browser "Als PDF drucken".

Akzeptanz: 2 Geräte haben unterschiedliche Karten, Reload ändert nichts,
gedruckte Karte Nr. X ist im Admin prüfbar.
Am Ende: CLAUDE.md aktualisieren, committen, pushen, "So testest du es".
```

---

## Phase 4: Ziehung, Pixel-Automat, Bingo

```
Lies CLAUDE.md. Plane und baue die Ziehung und die Bingo-Prüfung.

- screen: Bingo-Automat in Retro-Pixelart (Canvas, image-rendering: pixelated), Kugeln wirbeln,
  Kugel rollt raus, Begriff groß einblenden, Historie der gezogenen Begriffe.
  Flüssig auf normalem Laptop, Animationsdauer konfigurierbar.
- Admin: "Ziehen" (gesperrt während Animation), letzten Zug rückgängig, Historie.
- Ziehung serverseitig per RPC, ohne Zurücklegen, Pool-Ende sauber behandeln.
- Handy: Bingo-Button. Prüfung serverseitig gegen gezogene Begriffe (Linie, optional volle Karte),
  gleichzeitige Claims korrekt behandeln (mehrere Gewinner zum selben Begriff möglich).
- Gewinner: screen zeigt Nickname + Karte mit Gewinnlinie, Admin bestätigt oder lehnt ab.
  Papier-Fallback: Prüfung per Kartennummer.
- Neue Runde: Reset, Rundenhistorie bleibt.

Akzeptanz: Durchlauf mit 3 Geräten von Lobby bis Gewinner, falscher Claim wird abgelehnt,
Reload von screen mitten in der Ziehung zeigt korrekten Stand.
Am Ende: CLAUDE.md aktualisieren, committen, pushen, "So testest du es".
```

---

## Phase 5: Musik, Sound, Bilder, Design-Feinschliff

```
Lies CLAUDE.md. Plane und baue Medien und finalen Pixel-Look.

- Audio in screen (Web Audio API): Musikordner lokal per Ordnerauswahl laden (Unterordner je Szene + SFX),
  einmaliges Entsperren per Klick mit deutlichem Hinweis (Browser-Autoplay-Sperre erklären).
- Admin steuert per Realtime: Play/Pause/Skip, Lautstärke Musik und SFX getrennt,
  Ducking (automatisch bei Ziehung + Taste "Mikro"), Szenenwechsel je Phase, manuell übersteuerbar.
- SFX: Trommelwirbel/Rattern beim Ziehen, Ding beim Auswurf, Fanfare bei Gewinn.
- Bilder aus assets/images/: Logo, Hintergründe, Lobby-Slideshow.
- Einheitlicher Retro-Pixelart-Winter-Look über alle drei Ansichten, Pixel-Schnee, Beamer-Lesbarkeit prüfen.
- Ohne Musikordner läuft alles, Hinweis im Admin. assets/CREDITS.md als Vorlage.
- Theme-Struktur laut CLAUDE.md: alles Weihnachtliche in themes/weihnachten/ mit theme.json,
  keine hartcodierten Theme-Elemente in Logik und Seiten. Kurze Anleitung "Neues Theme anlegen" in docs/.

Akzeptanz: Musik läuft über Laptop → JBL, Ducking hörbar, Admin vom Handy aus bedienbar.
Am Ende: CLAUDE.md aktualisieren, committen, pushen, "So testest du es".
```

---

## Phase 6: Härtung und Generalprobe

```
Lies CLAUDE.md. Plane Härtung und Generalprobe.

- Lasttest-Skript in scripts/: 60 simulierte Teilnehmer (max. 50 Gäste + 20 % Puffer),
  Join, Einsenden, Karte holen, Bingo melden. Unter den Free-Plan-Limits bleiben, keine Dauerlast.
  Ergebnis kurz auswerten.
- Prüfen: keine externen URLs außer Supabase, RLS dicht (Versuch, als Teilnehmer Admin-Aktionen auszuführen).
- Fehlerfälle: Handy-Sperre, Reload in jeder Phase, Internet kurz weg, Beamer-Fenster neu laden.
- supabase/: Lösch-Skript für alle Spieldaten nach der Feier.
- docs/Ablauf.md: zeitlose Checkliste (Supabase vorher aufwecken, Aufbau, Audio-Test, Rundenablauf,
  Papier-Fallback, Daten löschen). Keine Datumsangaben.
- Codereview der gesamten App: Bugs und Vereinfachungen, priorisiert.

Am Ende: CLAUDE.md Status finalisieren, committen, pushen, Release-Tag v1.0.
```
