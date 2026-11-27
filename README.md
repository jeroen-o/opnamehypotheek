# opnamehypotheek1985

WoonFixx-rekentool voor de **Ingroeihypotheek** en **Opnamehypotheek** — standalone HTML (`index.html`), geen build-step, geen externe API's of CDN's, geen localStorage (geschikt voor Google Sites-embed). Afdrukken via `window.open()`.

## Normen — keuze normjaar 2026 / 2027 (standaard op datum)
- **Trhk 2026 / Nibud** — Bijlage 1 tabel 1–4 (financieringslastpercentages), art. 3 lid 8 (alleenstaanden + € 17.000), art. 4 lid 3–4 (energielabel/EBV). Bron: Stcrt. 2025, 36471. Ruwe data: `data/trhk-2026-financieringslastpercentages.json`.
- **Trhk 2027 / Nibud** — Stcrt. 2026, 38415: nieuwe tabellen (vanaf € 31.000), alleenstaanden + € 18.000 boven € 31.000 (AOW en niet-AOW). Gecontroleerd tegen *Bijlage financieringslastnormen 2027.xlsx*. Ruwe data: `data/trhk-2027-financieringslastpercentages.json`.
- **NHG V&N 2027-1** — grens € 500.000 / € 530.000, standaard Energiebespaarbudget € 20.000 bij label E/F/G.
- Studieschuld: wettelijk maandbedrag × Nibud-bruteringsfactor (1,05–1,40).
- **NHG V&N 2026-1** — kostengrens € 470.000 / € 498.200 (EBV), borgtochtprovisie 0,4%, LTV 100%/106%, aflosvorm (C.6.7), seniorenregeling (C.8).
- AFM-minimale toetsrente 5,0% (rentevast < 10 jaar) — per kwartaal controleren.

Validatie: maximale hypotheken komen exact overeen met Nibud *Advies hypotheeknormen 2026* (tabel 2 en 3) en *2027* (tabel 3 en 4), bijv. € 70.000 bij 4,25% → € 290.517 (2026) / € 294.074 (2027). Studieschuldvoorbeeld Nibud (€ 72,21 bij 3,75% → € 18.711 lager) klopt.

Indicatieve berekening; productaannames rond het B-/opnamedeel vereisen juridische/AFM-toetsing.
