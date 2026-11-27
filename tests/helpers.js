const path = require('path');
const { pathToFileURL } = require('url');
let chromium;
try { ({ chromium } = require('playwright')); }
catch { console.error('Playwright ontbreekt. Installeer met: npm install && npx playwright install chromium'); process.exit(2); }

const URL_BASE = pathToFileURL(path.join(__dirname, '..', 'index.html')).href + '#';

async function openBrowser() {
  const opts = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  return { browser, page, errors };
}
function teller() {
  const t = { ok: 0, fout: 0 };
  t.check = (naam, goed, detail = '') => { goed ? t.ok++ : t.fout++; if (!goed || process.env.VERBOSE) console.log(`${goed ? '  OK  ' : '  FOUT'} ${naam}${detail ? ' — ' + detail : ''}`); };
  t.near = (naam, tool, ref, tol = 1) => t.check(naam, Math.abs(tool - ref) <= tol, `tool ${Math.round(tool)} / referentie ${Math.round(ref)}`);
  return t;
}
async function setInput(page, id, v) {
  await page.evaluate(([id, v]) => { const el = document.getElementById(id); if (el.type === 'checkbox') el.checked = v; else el.value = v; el.dispatchEvent(new Event('input')); }, [id, v]);
}
module.exports = { URL_BASE, openBrowser, teller, setInput };
