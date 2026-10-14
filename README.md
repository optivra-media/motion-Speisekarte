# Motion Hookah Club – Digitale Speisekarte

Statische Website (reines HTML/CSS/JS, kein Framework, kein Build-Schritt).
Einfach den kompletten Ordnerinhalt per Datei-Manager/FTP auf Hostinger
hochladen (Zielordner z.B. `public_html/`) – fertig.

## Dateien

```
index.html                     Seitenstruktur
assets/css/styles.css          Design (Farben/Schriften ganz oben als Variablen)
assets/js/script.js            Rendert die Karte aus menu-data.json
assets/data/menu-data.json     Alle Kategorien, Gerichte, Preise ← HIER PFLEGEN
assets/img/                    Logo + alle Produktfotos (optimiert, WebP)
```

## Gerichte/Preise selbst pflegen

Alles Inhaltliche steht in **`assets/data/menu-data.json`**. Diese Datei mit
einem Texteditor öffnen (z.B. Notepad++, VS Code – **kein** Word, das
zerstört die Formatierung). Für jedes Getränk/Gericht gibt es einen Block:

```json
{
  "id": "espresso",
  "name": "Espresso",
  "price": "2,50 €",
  "image": "assets/img/espresso.webp",
  "tags": ["Koffeinhaltig"]
}
```

- **Preis ändern:** Nur den Text bei `"price"` ersetzen, Format `"X,XX €"`
  beibehalten (Komma, Leerzeichen vor €).
- **Name/Beschreibung ändern:** Text bei `"name"` bzw. `"description"`
  ersetzen. Deutsche Sonderzeichen (ä, ö, ü, ß, €) sind kein Problem, wenn
  die Datei als UTF‑8 gespeichert wird (Standard in den meisten Editoren).
- **Position löschen:** Den kompletten `{ ... }`-Block inkl. der Kommas
  drum herum entfernen.
- **Neue Position hinzufügen:** Einen bestehenden Block kopieren, Werte
  anpassen, mit Komma an die Liste anhängen. `"id"` muss innerhalb der
  Datei einmalig sein (wird u.a. für den Bild-Dateinamen verwendet).
- **Ganze Kategorie hinzufügen:** Einen kompletten `{"id":..., "name":...,
  "items":[...]}`-Block innerhalb von `"categories"` ergänzen. Die
  Kategorie erscheint automatisch in der Navigation oben.
- **Felder `tags`, `description`, `flavors` sind alle optional** – nur
  eintragen, was gebraucht wird. `tags` sind kurze Badges (z.B.
  "Koffeinhaltig", "4cl"), `description` ist normaler Fließtext, `flavors`
  ist eine lange, ausklappbare Liste (aktuell nur bei der Shisha-Position
  verwendet).

**Nach jeder Änderung:** Datei speichern, dann die hochgeladene Version auf
dem Server ersetzen (oder bei Hostinger direkt im Datei-Manager editieren).
Kein Rebuild, kein Deploy-Schritt nötig – die Seite liest die JSON-Datei bei
jedem Aufruf frisch ein.

## Bilder austauschen

Ein Foto ersetzen: neue Bilddatei unter demselben Dateinamen in
`assets/img/` hochladen (idealerweise ebenfalls als `.webp`, ca. 700–900px
breit, das hält die Seite schnell). Alternativ neuen Dateinamen vergeben und
den `"image"`-Pfad im passenden Item in `menu-data.json` anpassen.

**⚠️ Wichtig – danach immer `assetVersion` erhöhen:** Hostinger cacht Fotos
serverseitig (CDN) und im Browser der Gäste bis zu **einem Jahr**. Wird ein
Foto unter demselben Dateinamen ersetzt, sehen viele Besucher sonst noch
monatelang das alte Bild, obwohl die Datei längst ausgetauscht ist. Deshalb
ganz oben in `menu-data.json` die Zahl bei `"assetVersion"` um 1 erhöhen
(z.B. `"2"` → `"3"`) – das hängt automatisch an jedes Bild einen neuen
Cache-Buster (`?v=3`) an, wodurch garantiert die frische Version geladen
wird. Diesen einen Wert bei **jedem** Fotoaustausch erhöhen, egal wie viele
Fotos gleichzeitig ersetzt wurden.

## Logo austauschen

Das Logo liegt an **drei Stellen** in `index.html` fest eingebunden (Header,
Footer, Favicon/Tab-Icon):

```html
<img src="assets/img/logo.png?v=1" alt="Motion Hookah Club" class="logo" ...>
```

Neues Logo einfach unter demselben Namen `assets/img/logo.png` hochladen
(Freistellung/transparenter Hintergrund empfohlen, wie beim aktuellen Logo).
**Auch hier wegen des Hostinger-Caches wichtig:** die Zahl hinter `?v=` an
allen drei Stellen in `index.html` erhöhen (z.B. `?v=1` → `?v=2`), sonst
bleibt aus demselben Grund wie bei den Fotos oben das alte Logo im Cache
hängen. Ändert sich das Seitenverhältnis stark, ggf. `--header-logo-height`
bzw. die `.logo`/`.footer-logo`-Höhe in `assets/css/styles.css` anpassen.

## Farben/Schrift anpassen

Ganz oben in `assets/css/styles.css` im Block `:root { ... }` stehen alle
Farben und Schriften als zentrale Variablen (Design-Tokens), z.B.
`--color-gold`. Dort ändern wirkt sich auf die komplette Seite aus.

**⚠️ Auch `styles.css` und `script.js` selbst unterliegen dem
Hostinger-Cache** (genau wie Fotos, siehe oben – gilt für **jede** Datei auf
dem Server, nicht nur Bilder). Nach jeder Änderung an einer dieser beiden
Dateien in `index.html` die Zahl hinter `?v=` erhöhen:

```html
<link rel="stylesheet" href="assets/css/styles.css?v=5">
...
<script src="assets/js/script.js?v=5"></script>
```

Sonst sehen Besucher unter Umständen noch lange das alte Design/Verhalten,
obwohl die Datei längst aktualisiert wurde.

## Kontaktdaten ergänzen (Adresse/Öffnungszeiten/Telefon/Social Media)

Aktuell bewusst leer gelassen (lagen bei Erstellung nicht vor). Im Footer in
`index.html` gibt es einen auskommentierten Beispielblock
(`KONTAKT-PLATZHALTER`) mit Struktur-Vorschlag zum Einfügen.
