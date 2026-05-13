const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[BROWSER PAGE ERROR] ${error.message}`);
  });

  console.log("Navigating to http://localhost:3001/ ...");
  
  try {
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle', timeout: 15000 });
  } catch (e) {
    console.log("Navigation error:", e.message);
  }

  // Wait a bit to let client-side JS run
  await page.waitForTimeout(3000);

  const bodyHTML = await page.evaluate(() => document.body.innerHTML);
  console.log("\n[BODY HTML LENGTH]:", bodyHTML.length);
  if (bodyHTML.length < 500) {
    console.log("[BODY HTML (truncated)]:", bodyHTML);
  }

  await browser.close();
})();
