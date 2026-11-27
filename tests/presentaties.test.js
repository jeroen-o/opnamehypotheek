// Test van de presentaties: elk bedrag wordt onafhankelijk nagerekend en moet exact op de dia staan.
// Draaien: node tests/presentaties.test.js   (VERBOSE=1 toont ook geslaagde controles)
const R = require('./referentie');
const { URL_BASE, openBrowser, teller, setInput } = require('./helpers');
const norm = s => s.replace(/\s+/g, ' ');

(async () => {
  const { browser, page, errors } = await openBrowser();
  const t = teller();
  const dia = (deck, i) => page.evaluate(([d, i]) => document.querySelectorAll('#deck-' + d + ' .slide')[i].innerText, [deck, i]);
  const staat = async (deck, i, label, waarde, isTekst = false) => {
    const tekst = norm(await dia(deck, i)); const s = norm(isTekst ? waarde : R.eur(waarde));
    t.check(`dia ${i + 1} ${label}: ${s}`, tekst.includes(s), tekst.includes(s) ? '' : 'niet gevonden op dia');
  };

  // ---------------- INGROEIHYPOTHEEK ----------------
  const ING = [
    { W: 450000, eig: 0, b: 20, g: 3, r: 4.2, rvp: 10, afl: 'ann', label: 'C, D', i1: 62000, i2: 30000, woz: 450000, bb: 4.5, bo: 0.5, stap: 25000 },
    { W: 520000, eig: 30000, b: 25, g: 6, r: 3.6, rvp: 5, afl: 'lin', label: 'A, B', i1: 58000, i2: 0, woz: 500000, bb: 4, bo: 1, stap: 40000, single: true },
  ];
  for (const [k, s] of ING.entries()) {
    console.log(`Ingroeihypotheek scenario ${k + 1} (W ${s.W}, B ${s.b}%, groei ${s.g}%, ${s.afl}, rentevast ${s.rvp} jr)`);
    await page.goto(URL_BASE + 'ingroeihypotheek'); await page.waitForTimeout(150);
    for (const [id, v] of [['i_w', s.W], ['i_eigen', s.eig], ['i_bpct', s.b], ['i_g', s.g], ['i_rente', s.r], ['i_rvp', s.rvp], ['i_afl', s.afl], ['i_label', s.label], ['i_ink1', s.i1], ['i_ink2', s.i2], ['i_woz', s.woz], ['i_bb', s.bb], ['i_bo', s.bo], ['i_stap', s.stap], ['i_single', !!s.single], ['i_ebv', 0], ['i_tax', 'auto']]) await setInput(page, id, v);
    await page.goto(URL_BASE + 'presentatie-ingroeihypotheek'); await page.waitForTimeout(250);
    const B = s.W * s.b / 100, A = s.W - B - s.eig, bodem = (s.bb + s.bo) / 100, ink = s.i1 + s.i2, hi = Math.max(s.i1, s.i2);
    const mh = R.maxHyp({ ink, single: !!s.single, rente: s.r, rvp: s.rvp, label: s.label });
    const la = R.lening(A, s.r, 30, 12, s.afl), lr = R.lening(s.W - s.eig, s.r, 30, 12, s.afl);
    const brA = (la.rente1 + la.aflossing1) / 12, brR = (lr.rente1 + lr.aflossing1) / 12;
    const netA = brA - R.fiscaalVoordeel(la.rente1, s.woz, hi) / 12, netR = brR - R.fiscaalVoordeel(lr.rente1, s.woz, hi) / 12;
    const W10 = s.W * Math.pow(1 + s.g / 100, 10), m10 = s.b / 100 * W10, b10 = B * Math.pow(1 + bodem, 10), afr10 = Math.max(m10, b10);
    const a10 = R.lening(A, s.r, 30, 120, s.afl).saldo;
    await staat('ingroei', 0, 'woningwaarde', s.W); await staat('ingroei', 0, 'netto maandlast', netA); await staat('ingroei', 0, 'B-deel', B);
    await staat('ingroei', 2, 'toetsinkomen', ink); await staat('ingroei', 2, 'maximale hypotheek', mh.max);
    if (s.W > mh.max) await staat('ingroei', 2, 'tekort', s.W - mh.max);
    await staat('ingroei', 3, 'A-deel', A);
    await staat('ingroei', 4, 'netto ingroei', netA); await staat('ingroei', 4, 'netto regulier', netR); await staat('ingroei', 4, 'verschil', netR - netA);
    await staat('ingroei', 4, 'bruto ingroei', brA); await staat('ingroei', 4, 'bruto regulier', brR);
    await staat('ingroei', 5, 'afrekening B-deel na 10 jaar', afr10); await staat('ingroei', 5, 'vergoeding boven hoofdsom', afr10 - B);
    await staat('ingroei', 5, 'bepalend', m10 >= b10 ? 'waardestijging is bepalend' : 'bodem is bepalend', true);
    // ingroeipad onafhankelijk naspelen
    let frac = s.b / 100, hb = B, laatste = null;
    for (let y = 2; y < 30 && frac > 1e-9; y += 2) {
      const claim = Math.max(frac * s.W * Math.pow(1 + s.g / 100, y), hb * Math.pow(1 + bodem, y));
      const koop = Math.min(Math.max(20000, s.stap), claim), d = koop / claim; frac *= 1 - d; hb *= 1 - d; if (frac < 1e-6) frac = 0; laatste = { y, frac };
    }
    await staat('ingroei', 6, 'overname per stap', Math.max(20000, s.stap));
    if (laatste && laatste.frac === 0) await staat('ingroei', 6, 'volledig eigenaar', 'jaar ' + laatste.y, true);
    await staat('ingroei', 7, 'verkoopwaarde na 10 jaar', W10); await staat('ingroei', 7, 'aflossing A-deel', a10);
    await staat('ingroei', 7, 'afrekening B-deel', afr10); await staat('ingroei', 7, 'overwaarde', W10 - a10 - afr10);
    await staat('ingroei', 8, 'A-deel in toetsing', A); await staat('ingroei', 8, 'maximum in toetsing', mh.max);
    await staat('ingroei', 11, 'verschil in samenvatting', netR - netA);
  }

  // ---------------- OPNAMEHYPOTHEEK ----------------
  const OP = [
    { W: 550000, age: 72, O: 110000, g: 3, H: 12, rs: 80000, rr: 3.9, rvp: 10, afl: 'avr', loop: 20, bb: 4.5, bo: 0.5, prem: 1, i1: 38000, i2: 22000, op: 6.5 },
    { W: 420000, age: 81, O: 140000, g: 5.5, H: 15, rs: 60000, rr: 4.4, rvp: 20, afl: 'ann', loop: 12, bb: 4, bo: 0.75, prem: 1.5, i1: 31000, i2: 0, op: 7, single: true },
  ];
  for (const [k, s] of OP.entries()) {
    console.log(`Opnamehypotheek scenario ${k + 1} (W ${s.W}, ${s.age} jr, opname ${s.O}, groei ${s.g}%, restschuld ${s.afl})`);
    await page.goto(URL_BASE + 'opnamehypotheek'); await page.waitForTimeout(150);
    for (const [id, v] of [['o_w', s.W], ['o_age', s.age], ['o_opn', s.O], ['o_g', s.g], ['o_h', s.H], ['o_rs', s.rs], ['o_rr', s.rr], ['o_rvp', s.rvp], ['o_afl', s.afl], ['o_loop', s.loop], ['o_bb', s.bb], ['o_bo', s.bo], ['o_prem', s.prem], ['o_ink1', s.i1], ['o_ink2', s.i2], ['o_opeet', s.op], ['o_single', !!s.single]]) await setInput(page, id, v);
    await page.goto(URL_BASE + 'presentatie-opnamehypotheek'); await page.waitForTimeout(250);
    const share = s.O / s.W, bodem = (s.bb + s.bo) / 100;
    const rsAt = h => s.afl === 'ann' ? (h >= s.loop ? 0 : R.lening(s.rs, s.rr, s.loop, h * 12, 'ann').saldo) : s.rs;
    const claim = h => { const Wt = s.W * Math.pow(1 + s.g / 100, h); return { Wt, c: Math.min(Math.max(share * Wt, s.O * Math.pow(1 + bodem, h)), Math.max(0, Wt - rsAt(h))) }; };
    const cH = claim(s.H), netH = Math.max(0, cH.Wt - cH.c - rsAt(s.H));
    const effK = (Math.pow(cH.c / (s.O * (1 - s.prem / 100)), 1 / s.H) - 1) * 100;
    const opeet = s.O * Math.pow(1 + s.op / 100, s.H), nOp = Math.max(0, cH.Wt - opeet - rsAt(s.H));
    const mh = R.maxHyp({ ink: s.i1 + s.i2, aow: true, single: !!s.single, rente: s.rr, rvp: s.rvp });
    const werk = s.afl === 'avr' ? s.rs * s.rr / 1200 : s.rs * R.annF(s.rr, s.loop * 12);
    await staat('opname', 0, 'woningwaarde', s.W); await staat('opname', 0, 'opname', s.O); await staat('opname', 0, 'leeftijd', s.age + ' jaar', true);
    await staat('opname', 2, 'bestaande hypotheek', s.rs); await staat('opname', 2, 'overwaarde', s.W - s.rs); await staat('opname', 2, 'blijft vrij', s.W - s.rs - s.O);
    await staat('opname', 4, 'aandeel geldverstrekker', R.pct(share * 100, 1), true);
    await staat('opname', 5, 'staffelmaximum', s.W * R.staffel(s.age) / 100); await staat('opname', 5, 'netto uitkering', s.O * (1 - s.prem / 100));
    await staat('opname', 6, `afrekening na ${s.H} jaar`, cH.c); await staat('opname', 6, 'kosten per jaar', R.pct(effK, 2), true);
    for (const h of [...new Set([5, 10, 15, 20, 25, s.H])]) { const x = claim(h); await staat('opname', 7, `scenario ${h} jaar afrekening`, x.c); await staat('opname', 7, `scenario ${h} jaar netto`, Math.max(0, x.Wt - x.c - rsAt(h))); }
    await staat('opname', 8, 'vordering opname', cH.c); await staat('opname', 8, 'schuld opeet', opeet);
    await staat('opname', 8, 'netto erfgenamen opname', netH); await staat('opname', 8, 'netto erfgenamen opeet', nOp);
    await staat('opname', 11, 'maximale hypotheek', mh.max); await staat('opname', 11, 'maximale last', mh.maxLast); await staat('opname', 11, 'werkelijke last', werk);
    await staat('opname', 12, 'netto uitkering in samenvatting', s.O * (1 - s.prem / 100));
  }

  t.check('Geen JavaScript-fouten', errors.length === 0, errors.join('; '));
  console.log(`\nPresentaties: ${t.ok} geslaagd, ${t.fout} mislukt`);
  await browser.close(); process.exit(t.fout ? 1 : 0);
})();
