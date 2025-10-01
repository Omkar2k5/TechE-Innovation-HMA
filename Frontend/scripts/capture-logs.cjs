const { chromium } = require('playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:5174/';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => {
    try { logs.push({type: 'console', text: msg.text(), args: msg.args().map(a=>a.toString())}); } catch(e){}
  });
  page.on('pageerror', err => logs.push({type: 'pageerror', text: err.message}));
  page.on('requestfailed', req => logs.push({type: 'requestfailed', url: req.url(), err: req.failure() && req.failure().errorText}));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(e=>logs.push({type:'goto_error', text: e.message}));
  // wait a bit for app runtime to run
  await page.waitForTimeout(1200);

  // gather captured logs from the overlay array if present
  const captured = await page.evaluate(() => {
    return window.__capturedLogs__ ? window.__capturedLogs__.slice(-500) : [];
  }).catch(e=>({evalError: e.message}));

  console.log('---playwright-captured---');
  console.log(JSON.stringify({logs, captured}, null, 2));

  await browser.close();
})();
