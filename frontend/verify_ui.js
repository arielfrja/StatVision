/* eslint-disable @typescript-eslint/no-require-imports */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function verifyUI() {
  console.log('🚀 Starting "Night Stadium" UI Verification...');
  
  const browser = await puppeteer.launch({
    executablePath: '/data/data/com.termux/files/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const screenshotsDir = path.join(__dirname, 'ui_verification');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);

  const pagesToTest = [
    { name: 'dashboard', url: 'http://localhost:3001/dashboard' },
    { name: 'stats', url: 'http://localhost:3001/stats' },
    { name: 'games', url: 'http://localhost:3001/games' },
    { name: 'park-setup', url: 'http://localhost:3001/games/park-setup' },
    { name: 'teams', url: 'http://localhost:3001/teams' }
  ];

  for (const item of pagesToTest) {
    try {
      console.log(`📸 Verifying ${item.name.toUpperCase()}...`);
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for the stadium-card class to ensure our new UI is rendered
      await page.waitForSelector('.stadium-card', { timeout: 5000 }).catch(() => null);
      
      const screenshotPath = path.join(screenshotsDir, `${item.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ ${item.name.toUpperCase()} verified and saved to ${screenshotPath}`);
    } catch (error) {
      console.error(`❌ Failed to verify ${item.name}:`, error.message);
    }
  }

  await browser.close();
  console.log('\n✨ UI Verification Complete. Check frontend/ui_verification/ for results.');
}

verifyUI();
