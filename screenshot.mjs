import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  // Wait for Vue to render
  await page.waitForTimeout(2000);
  
  // Screenshot
  await page.screenshot({ path: 'app_screenshot.png', fullPage: true });
  
  console.log('✓ Screenshot saved: app_screenshot.png');
  await browser.close();
})();
