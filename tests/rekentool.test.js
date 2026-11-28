// Test van de rekentool (normen 2027): maximale hypotheek, ingroei- en opnamehypotheek.
// Draaien: node tests/rekentool.test.js   (VERBOSE=1 toont ook geslaagde controles)
const R = require('./referentie');
const { URL_BASE, openBrowser, teller, setInput } = require('./helpers');

(async () => {
  const { browser, page, errors } = await openBrowser();
  const t = teller();
  await page.goto(URL_BASE + 'ingroeihypotheek'); await page.waitForTimeout(200);

  console.log('1. Maximale hypotheek — validatie tegen Nibud Advies hypotheeknormen 2027 (tabel 3 en 4)');
  const NIBUD = { 4.25: [142887, 204124, 294074, 467537], 5: [135830, 194043, 279267, 442419] };
  for (const r of [4.25, 5]) {
    const got = await page.evaluate(r => [35000, 50000, 70000, 100000].map(i => Math.round(maxHypotheek({ inkomen: i, aow: false, alleenstaand: false, rente: r, rvp: 10, label: 'E, F, G', ebv: 0 }).max)), r);
    t.check(`Nibud-voorbeelden bij ${r}%`, JSON.stringify(got) === JSON.stringify(NIBUD[r]), got.join(' / '));
  }
  const st = await page.evaluate(() => { const a = { inkomen: 50000, aow: false, alleenstaand: false, rente: 3.75, rvp: 10, label: 'E, F, G', ebv: 0 }; return Math.round(maxHypotheek(a).max - maxHypotheek({ ...a, studie: 72.21 }).max); });
  t.check('Nibud-voorbeeld studieschuld (€ 72,21 bij 3,75% → € 18.711 lager)', st === 18711, String(st));

  console.log('2. Maximale hypotheek — raster van 2.400 combinaties tegen de Trhk-tabellen 2027');
  let n = 0, bad = 0;
  for (const ink of [12000, 30999, 31000, 31500, 45000, 57000, 80819, 99999, 125000, 180000])
    for (const r of [1.2, 1.5, 1.501, 3.0, 4.25, 4.5, 4.501, 6.5, 6.51, 8])
      for (const rvp of [5, 10]) for (const aow of [false, true]) for (const single of [false, true])
        for (const label of ['E, F, G', 'C, D', 'A++++']) {
          const tool = await page.evaluate(a => maxHypotheek(a).max, { inkomen: ink, aow, alleenstaand: single, rente: r, rvp, label, ebv: 12000, studie: 150 });
          const ref = R.maxHyp({ ink, aow, single, rente: r, rvp, label, ebv: 12000, studie: 150 }).max;
          n++; if (Math.abs(tool - ref) > 0.01) { bad++; if (bad <= 5) console.log('  afwijking', { ink, r, rvp, aow, single, label, tool, ref }); }
        }
  t.check(`Raster ${n - bad}/${n} gelijk`, bad === 0);

  console.log('2b. AOW-leeftijd binnen 10 jaar — laagste van toets vóór (tabel 1) en na AOW (tabel 2)');
  for (const [ink, na, r, rvp, single] of [[70000, 32000, 4.2, 10, false], [55000, 48000, 3.8, 20, false], [42000, 40000, 4.6, 5, true], [90000, 25000, 4.0, 10, true]]) {
    const tool = await page.evaluate(([ink, na, r, rvp, single]) => { const m = maxHypotheekAow({ inkomen: ink, alleenstaand: single, rente: r, rvp, label: 'E, F, G', ebv: 0 }, na); return [m.max, m.bindend]; }, [ink, na, r, rvp, single]);
    const voor = R.maxHyp({ ink, aow: false, single, rente: r, rvp }).max, naM = R.maxHyp({ ink: na, aow: true, single, rente: r, rvp }).max;
    t.near(`  inkomen ${ink} / na AOW ${na}: maximum`, tool[0], Math.min(voor, naM));
    t.check(`  inkomen ${ink} / na AOW ${na}: bindend ${naM < voor ? 'na' : 'voor'} AOW`, tool[1] === (naM < voor ? 'na' : 'voor'));
  }
  // via de invoer van de rekentool (ingroei)
  await page.goto(URL_BASE + 'ingroeihypotheek'); await page.waitForTimeout(150);
  for (const [id, v] of [['i_w', 450000], ['i_eigen', 0], ['i_bpct', 20], ['i_rente', 4.2], ['i_rvp', 10], ['i_label', 'E, F, G'], ['i_ink1', 70000], ['i_ink2', 0], ['i_aow', false], ['i_aow10', true], ['i_na1', 32000], ['i_na2', 0], ['i_ebv', 0]]) await setInput(page, id, v);
  const kpiAow = await page.evaluate(() => [...document.querySelectorAll('#i_kpis .kpi .v')].map(e => e.textContent));
  t.near('  rekentool ingroei: max. hypotheek met AOW binnen 10 jaar', R.num(kpiAow[3]), Math.min(R.maxHyp({ ink: 70000, rente: 4.2, rvp: 10 }).max, R.maxHyp({ ink: 32000, aow: true, rente: 4.2, rvp: 10 }).max));
  t.check('  invoervelden "inkomen na AOW" zichtbaar', await page.isVisible('#i_na1'));
  await setInput(page, 'i_aow10', false);
  t.check('  invoervelden "inkomen na AOW" verborgen zonder vinkje', !(await page.isVisible('#i_na1')));

  console.log('3. Ingroeihypotheek');
  const ING = [
    { W: 450000, eig: 0, b: 20, g: 3, r: 4.2, rvp: 10, afl: 'ann', label: 'C, D', i1: 62000, i2: 30000, woz: 450000 },
    { W: 600000, eig: 50000, b: 30, g: 3, r: 3.8, rvp: 5, afl: 'lin', label: 'A, B', i1: 95000, i2: 0, woz: 580000 },
  ];
  for (const s of ING) {
    await page.goto(URL_BASE + 'ingroeihypotheek'); await page.waitForTimeout(150);
    for (const [id, v] of [['i_w', s.W], ['i_eigen', s.eig], ['i_bpct', s.b], ['i_g', s.g], ['i_rente', s.r], ['i_rvp', s.rvp], ['i_afl', s.afl], ['i_label', s.label], ['i_ink1', s.i1], ['i_ink2', s.i2], ['i_woz', s.woz], ['i_ebv', 0], ['i_tax', 'auto'], ['i_bb', 4.5], ['i_bo', 0.5]]) await setInput(page, id, v);
    const B = s.W * s.b / 100, A = s.W - B - s.eig, ink = s.i1 + s.i2;
    const l = R.lening(A, s.r, 30, 12, s.afl), bruto = (l.rente1 + l.aflossing1) / 12;
    const netto = bruto - R.fiscaalVoordeel(l.rente1, s.woz, Math.max(s.i1, s.i2)) / 12;
    const kpi = await page.evaluate(() => [...document.querySelectorAll('#i_kpis .kpi .v')].map(e => e.textContent));
    const pre = `  W ${s.W}:`;
    t.near(`${pre} A-deel`, R.num(kpi[0]), A); t.near(`${pre} B-deel`, R.num(kpi[1]), B);
    t.near(`${pre} max. hypotheek`, R.num(kpi[3]), R.maxHyp({ ink, rente: s.r, rvp: s.rvp, label: s.label }).max);
    t.near(`${pre} B-deel na 10 jaar`, R.num(kpi[2]), Math.max(s.b / 100 * s.W * Math.pow(1 + s.g / 100, 10), B * Math.pow(1.05, 10)));
    t.near(`${pre} netto maandlast`, R.num(await page.textContent('#i_mb1')), netto);
    const maand = await page.evaluate(() => [...document.querySelectorAll('#i_maand tr')].map(tr => [...tr.children].map(td => td.textContent)));
    const brutoRij = maand.find(r => r[0] === 'Bruto maandlast'); t.near(`${pre} bruto maandlast`, R.num(brutoRij[1]), bruto);
    const rij = await page.evaluate(() => [...[...document.querySelectorAll('#i_pad tr')][1].children].map(td => td.textContent));
    t.near(`${pre} ingroeipad jaar 2 woningwaarde`, R.num(rij[1]), s.W * Math.pow(1 + s.g / 100, 2));
    t.near(`${pre} ingroeipad jaar 2 waarde B-deel`, R.num(rij[2]), Math.max(s.b / 100 * s.W * Math.pow(1 + s.g / 100, 2), B * Math.pow(1.05, 2)));
  }

  console.log('4. Opnamehypotheek');
  const OP = [
    { W: 550000, age: 72, O: 110000, g: 3, H: 12, rs: 80000, rr: 3.9, afl: 'avr', loop: 20, prem: 1 },
    { W: 400000, age: 80, O: 120000, g: 6, H: 20, rs: 60000, rr: 4.5, afl: 'ann', loop: 15, prem: 1 },
    { W: 300000, age: 85, O: 120000, g: -2, H: 15, rs: 100000, rr: 4, afl: 'avr', loop: 20, prem: 1.5 },
  ];
  await page.goto(URL_BASE + 'opnamehypotheek'); await page.waitForTimeout(150);
  for (const s of OP) {
    for (const [id, v] of [['o_w', s.W], ['o_age', s.age], ['o_opn', s.O], ['o_g', s.g], ['o_h', s.H], ['o_rs', s.rs], ['o_rr', s.rr], ['o_afl', s.afl], ['o_loop', s.loop], ['o_prem', s.prem], ['o_bb', 4.5], ['o_bo', 0.5]]) await setInput(page, id, v);
    const Wt = s.W * Math.pow(1 + s.g / 100, s.H);
    const rs = s.afl === 'ann' ? (s.H >= s.loop ? 0 : R.lening(s.rs, s.rr, s.loop, s.H * 12, 'ann').saldo) : s.rs;
    const claim = Math.min(Math.max(s.O / s.W * Wt, s.O * Math.pow(1.05, s.H)), Math.max(0, Wt - rs));
    const kpi = await page.evaluate(() => [...document.querySelectorAll('#o_kpis .kpi .v')].map(e => e.textContent));
    const pre = `  W ${s.W}, ${s.age} jr, groei ${s.g}%:`;
    t.near(`${pre} staffelmaximum`, R.num(kpi[0]), s.W * R.staffel(s.age) / 100);
    t.near(`${pre} netto uitkering`, R.num(await page.textContent('#o_mb1')), s.O * (1 - s.prem / 100));
    t.near(`${pre} afrekening na ${s.H} jaar`, R.num(kpi[2]), claim);
    t.near(`${pre} netto erfgenamen`, R.num(kpi[3]), Math.max(0, Wt - claim - rs));
  }

  console.log('5. Afdrukken: rekenrapporten en handouts worden zonder fouten opgebouwd');
  await page.evaluate(() => { window.__printed = []; window.open = () => { const doc = { html: '', write(h) { this.html += h; }, close() { window.__printed.push(this.html); } }; return { document: doc, focus() {}, print() {} }; }; });
  for (const [route, knop, moet] of [
    ['ingroeihypotheek', '#p-ingroei .intro .btn', ['Rekenrapport Ingroeihypotheek', 'Uitgangspunten', 'Toetsing aan de normen 2027', 'Ingroeipad', 'Aandachtspunten en compliance']],
    ['opnamehypotheek', '#p-opname .intro .btn', ['Rekenrapport Opnamehypotheek', 'Uitgangspunten', 'Scenario', 'Vergelijking met de opeethypotheek', 'Aandachtspunten en compliance']],
    ['presentatie-ingroeihypotheek', '#deck-ingroei [data-a=print]', ['Uitleg', 'Ingroeihypotheek', 'Belangrijk']],
    ['presentatie-opnamehypotheek', '#deck-opname [data-a=print]', ['Uitleg', 'Opnamehypotheek', 'Belangrijk']],
  ]) {
    await page.goto(URL_BASE + route); await page.waitForTimeout(200);
    await page.evaluate(() => { window.__printed = []; window.open = () => { const doc = { html: '', write(h) { this.html += h; }, close() { window.__printed.push(this.html); } }; return { document: doc, focus() {}, print() {} }; }; });
    await page.click(knop); await page.waitForTimeout(150);
    const html = await page.evaluate(() => window.__printed[0] || '');
    const mist = moet.filter(m => !html.includes(m));
    t.check(`  afdruk ${route}`, html.length > 2000 && mist.length === 0, mist.length ? 'ontbreekt: ' + mist.join(', ') : `${Math.round(html.length / 1024)} kB`);
    if (route.startsWith('presentatie')) { const n = (html.match(/<h4>Uitleg<\/h4>/g) || []).length; const s = await page.evaluate(r => document.querySelectorAll('#deck-' + (r.includes('ingroei') ? 'ingroei' : 'opname') + ' .slide').length, route); t.check(`  handout ${route}: uitleg bij elke dia (${n}/${s})`, n === s); }
  }

  t.check('Geen JavaScript-fouten', errors.length === 0, errors.join('; '));
  console.log(`\nRekentool: ${t.ok} geslaagd, ${t.fout} mislukt`);
  await browser.close(); process.exit(t.fout ? 1 : 0);
})();
