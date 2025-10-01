const pw = require('playwright');
(async () => {
  const url = process.argv[2] || 'http://localhost:5173/';
  const b = await pw.chromium.launch();
  const p = await b.newPage();
  try {
    await p.goto(url, { waitUntil: 'networkidle' });
    await p.waitForTimeout(400);
    try {
      const html = await p.$eval('#root', el => el.innerHTML);
      console.log('ROOT_HTML_START:\n' + html.slice(0, 2000));
    } catch (e) {
      console.log('ERR_GET_ROOT:', e.message);
    }
  } catch (e) {
    console.error('PAGE_NAV_ERROR:', e.message);
  }
  await b.close();
})();
