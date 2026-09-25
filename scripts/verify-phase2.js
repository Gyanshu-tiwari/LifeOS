import puppeteer from 'puppeteer-core';

async function run() {
  console.log('Launching Puppeteer for Phase 2 Verification...');
  const browser = await puppeteer.launch({
    executablePath: '/home/abhiboss/.local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Desktop 1440x900 - Redesigned Calendar
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4173/calendar', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_phase2_calendar.png' });
  console.log('Captured screenshot_phase2_calendar.png');

  // 2. Desktop 1440x900 - Create Goal Wizard
  await page.goto('http://localhost:4173/goals/new', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_phase2_create_goal.png' });
  console.log('Captured screenshot_phase2_create_goal.png');

  // 3. Desktop 1440x900 - Home Command Center
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_phase2_home.png' });
  console.log('Captured screenshot_phase2_home.png');

  // 4. Desktop 1440x900 - Documents Page
  await page.goto('http://localhost:4173/documents', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_phase2_documents.png' });
  console.log('Captured screenshot_phase2_documents.png');

  // 5. Mobile 390x844 - Calendar
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4173/calendar', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_phase2_mobile_calendar.png' });
  console.log('Captured screenshot_phase2_mobile_calendar.png');

  await browser.close();
  console.log('Phase 2 visual testing complete!');
}

run().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
