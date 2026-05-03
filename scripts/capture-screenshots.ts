import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const baseUrl = 'http://127.0.0.1:3004';

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);

    // 1: HUD Overview
    await page.screenshot({ path: 'public/screenshots/aicodestudio-hud-overview.png', fullPage: false });
    console.log('✅ HUD overview');

    // 2: Agent Control - click AI Assistant in activity bar
    try {
      const activityButtons = await page.locator('nav button').all();
      for (const btn of activityButtons) {
        const label = await btn.getAttribute('aria-label');
        if (label && label.includes('AI')) {
          await btn.click();
          await page.waitForTimeout(1500);
          break;
        }
      }
    } catch {}
    await page.screenshot({ path: 'public/screenshots/aicodestudio-agent-control.png', fullPage: false });
    console.log('✅ Agent Control');

    // 3: Explorer
    try {
      const activityButtons = await page.locator('nav button').all();
      for (const btn of activityButtons) {
        const label = await btn.getAttribute('aria-label');
        if (label && label.includes('Explorer')) {
          await btn.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    } catch {}
    await page.screenshot({ path: 'public/screenshots/aicodestudio-editor-terminal.png', fullPage: false });
    console.log('✅ Editor/Terminal');

    // 4: Settings/Runtime
    try {
      const activityButtons = await page.locator('nav button').all();
      for (const btn of activityButtons) {
        const label = await btn.getAttribute('aria-label');
        if (label && label.includes('Settings')) {
          await btn.click();
          await page.waitForTimeout(1500);
          break;
        }
      }
    } catch {}
    await page.screenshot({ path: 'public/screenshots/aicodestudio-runtime-status.png', fullPage: false });
    console.log('✅ Runtime Status');

    // 5: Welcome (reload)
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'public/screenshots/aicodestudio-welcome.png', fullPage: false });
    console.log('✅ Welcome');

    console.log('\n🎉 All screenshots captured!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
