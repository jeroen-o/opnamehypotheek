# Tests

Controleren de rekentool en de presentaties in `index.html` met een **onafhankelijke** narekening (`referentie.js`) op basis van de normen 2027 (`data/trhk-2027-financieringslastpercentages.json`).

| Script | Wat wordt getest |
|---|---|
| `rekentool.test.js` | Maximale hypotheek tegen de voorbeelden uit het Nibud-advies 2027 (tabel 3 en 4) en het studieschuldvoorbeeld, een raster van 2.400 combinaties tegen de Trhk-tabellen, en de uitkomsten van de ingroei- en opnamehypotheek in meerdere scenario's. |
| `presentaties.test.js` | Elk bedrag in beide presentaties wordt nagerekend en moet exact op de juiste dia staan (2 scenario's per presentatie). |

## Draaien

```bash
npm install
npx playwright install chromium
npm test
```

- `VERBOSE=1 npm test` toont ook de geslaagde controles.
- Een eigen Chromium gebruiken: `CHROMIUM_PATH=/pad/naar/chromium npm test`.
- Exitcode `0` = alles geslaagd, `1` = minstens één controle mislukt.

Pas bij nieuwe normen (bijv. 2028) zowel de tool als `referentie.js` en de verwachte Nibud-voorbeelden in `rekentool.test.js` aan.
