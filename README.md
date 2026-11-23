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

## Wichtig: Repo ist öffentlich

Nie committen: Service-Role-Key, Passwörter, `.env`, Musik, Rohmaterial (`_input/`), Daten von Gästen.
Der Supabase-Anon/Publishable-Key in `config.js` darf öffentlich sein.
