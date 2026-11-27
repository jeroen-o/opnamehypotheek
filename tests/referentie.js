// Onafhankelijke referentieberekeningen (normen 2027) voor de tests.
// Bewust los geschreven van index.html, zodat de tests de rekentool echt controleren.
const path = require('path');
const FL = require(path.join(__dirname, '..', 'data', 'trhk-2027-financieringslastpercentages.json'));

const RENTEGRENZEN = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5];
const LABEL = { 'E, F, G': 0, 'C, D': 5000, 'A, B': 10000, 'A+, A++': 20000, 'A+++': 25000, 'A++++': 30000 };
const EBV = { 'E, F, G': 20000, 'C, D': 15000, 'A, B': 10000, 'A+, A++': 10000, 'A+++': 0, 'A++++': 0 };
const BRUTERING = [1.05, 1.05, 1.10, 1.15, 1.20, 1.20, 1.25, 1.30, 1.30, 1.35, 1.40, 1.40];
const TAX = { g1: 39337, t1: 0.3584, g2: 80819, t2: 0.3802, t3: 0.495, hillen: 0.70, ewf: 0.0035 };

function kolom(r) { const rr = Math.round(r * 1000) / 1000; const c = RENTEGRENZEN.findIndex(g => rr <= g); return c < 0 ? 11 : c; }
function flPct(tab, ink, r) { let row = FL[tab][0]; for (const x of FL[tab]) if (x[0] > 0 && ink >= x[0]) row = x; return row[kolom(r) + 1]; }
function annF(r, n) { const i = r / 1200; return i / (1 - Math.pow(1 + i, -n)); }
function maxHyp({ ink, aow = false, single = false, rente, rvp, label = 'E, F, G', ebv = 0, studie = 0 }) {
  const tr = rvp >= 10 ? rente : Math.max(rente, 5);
  const p = flPct(aow ? 2 : 1, ink, tr);
  const maxLast = ink * p / 1200;
  const net = Math.max(0, maxLast - studie * BRUTERING[kolom(tr)]);
  return { max: net / annF(tr, 360) + ((single && ink > 31000) ? 18000 : 0) + LABEL[label] + Math.min(ebv, EBV[label]), maxLast, p, tr };
}
// saldo na `maanden` + rente/aflossing in jaar 1
function lening(P, r, jaren, maanden, vorm) {
  const i = r / 1200, n = jaren * 12, pmt = P * i / (1 - Math.pow(1 + i, -n)); let b = P, ri = 0, afl = 0;
  for (let m = 0; m < maanden; m++) { const int = b * i; const a = Math.min(vorm === 'ann' ? pmt - int : vorm === 'lin' ? P / n : 0, b); if (m < 12) { ri += int; afl += a; } b -= a; }
  return { saldo: b, rente1: ri, aflossing1: afl };
}
function fiscaalVoordeel(renteJaar, woz, hoogsteInkomen) {
  const marg = hoogsteInkomen > TAX.g2 ? TAX.t3 : hoogsteInkomen > TAX.g1 ? TAX.t2 : TAX.t1;
  const tax = Math.min(marg, TAX.t2), ewf = woz * TAX.ewf;
  return renteJaar >= ewf ? renteJaar * tax - ewf * marg : -(ewf - renteJaar) * (1 - TAX.hillen) * marg;
}
function staffel(age) { return age < 70 ? 20 : age < 75 ? 25 : age < 80 ? 30 : age < 85 ? 35 : 40; }

const NF0 = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 });
const eur = n => (n < 0 ? '− ' : '') + '€ ' + NF0.format(Math.abs(Math.round(n)));
const pct = (n, d) => new Intl.NumberFormat('nl-NL', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n) + '%';
const num = s => { const neg = /−|-/.test(s); const v = parseFloat(String(s).replace(/[^\d,]/g, '').replace(',', '.')); return neg ? -v : v; };

module.exports = { FL, maxHyp, annF, lening, fiscaalVoordeel, staffel, eur, pct, num, TAX };
