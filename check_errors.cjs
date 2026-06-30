const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

  console.log('Navigating to /menu/123...');
  await page.goto('http://localhost:5173/menu/123', { waitUntil: 'networkidle2' });
  
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  console.log('BODY HTML CONTENT:', bodyHtml);
  
  await browser.close();
})();
