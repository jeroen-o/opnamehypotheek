# opnamehypotheek1985

WoonFixx-rekentool voor de **Ingroeihypotheek** en **Opnamehypotheek** — standalone HTML (`index.html`), geen build-step, geen externe API's of CDN's, geen localStorage (geschikt voor Google Sites-embed). Afdrukken via `window.open()`.

## Normen 2027 (peildatum 1 januari 2027)
- **Trhk 2027 / Nibud** — Stcrt. 2026, 38415, Bijlage 1 tabel 1–4 (vanaf € 31.000), alleenstaanden + € 18.000 boven € 31.000, energielabelbedragen art. 4 lid 3–4. Gecontroleerd tegen *Bijlage financieringslastnormen 2027.xlsx*. Ruwe data: `data/trhk-2027-financieringslastpercentages.json`.
- **NHG V&N 2027-1** — grens € 500.000 / € 530.000 (EBV), borgtochtprovisie 0,4%, LTV 100%/106%, aflosvorm (C.6.7), standaard Energiebespaarbudget € 20.000 bij label E/F/G, seniorenregeling (C.8).
- Studieschuld: wettelijk maandbedrag × Nibud-bruteringsfactor (1,05–1,40).
- AFM-minimale toetsrente 5,0% (rentevast < 10 jaar) — per kwartaal controleren.
- Fiscaal (indicatief): Belastingplan 2027 — 35,84% t/m € 39.337, 38,02% t/m € 80.819, 49,50% daarboven; EWF 0,35%.

Validatie: maximale hypotheken komen exact overeen met Nibud *Advies hypotheeknormen 2027*, tabel 3 en 4 (bijv. € 70.000 bij 4,25% → € 294.074; bij 5% → € 279.267).

Indicatieve berekening; productaannames rond het B-/opnamedeel vereisen juridische/AFM-toetsing.
