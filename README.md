# opnamehypotheek1985

WoonFixx-rekentool voor de **Ingroeihypotheek** en **Opnamehypotheek** — standalone HTML (`index.html`), geen build-step, geen externe API's of CDN's, geen localStorage (geschikt voor Google Sites-embed). Afdrukken via `window.open()`.

## Normen (peildatum 1 januari 2026)
- **Trhk 2026 / Nibud** — Bijlage 1 tabel 1–4 (financieringslastpercentages), art. 3 lid 8 (alleenstaanden + € 17.000), art. 4 lid 3–4 (energielabel/EBV). Bron: Stcrt. 2025, 36471. Ruwe data: `data/trhk-2026-financieringslastpercentages.json`.
- **NHG V&N 2026-1** — kostengrens € 470.000 / € 498.200 (EBV), borgtochtprovisie 0,4%, LTV 100%/106%, aflosvorm (C.6.7), seniorenregeling (C.8).
- AFM-minimale toetsrente 5,0% (rentevast < 10 jaar) — per kwartaal controleren.

Validatie: maximale hypotheken komen exact overeen met Nibud *Advies hypotheeknormen 2026*, tabel 2 en 3 (bijv. € 70.000 → € 290.517 bij 4,25%).

Indicatieve berekening; productaannames rond het B-/opnamedeel vereisen juridische/AFM-toetsing.
