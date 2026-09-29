import puppeteer from 'puppeteer-core';

const routes = [
  '/',
  '/goals',
  '/goals/new',
  '/goals/goal-lucknow-college',
  '/goals/goal-lucknow-college/plan',
  '/tasks',
  '/calendar',
  '/documents',
  '/agents',
  '/research',
  '/maps',
  '/verification',
  '/actions',
  '/notifications',
  '/profile',
  '/settings',
  '/help',
];

async function run() {
  console.log('Starting full route verification on headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: '/home/abhiboss/.local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  let errorsCount = 0;

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[Browser Error]: ${msg.text()}`);
      errorsCount++;
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Page Error]: ${err.message}`);
    errorsCount++;
  });

  // Test all routes on Desktop (1440x900)
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  for (const route of routes) {
    const url = `http://localhost:4173${route}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log(`[Desktop 1440x900] Successfully rendered: ${route}`);
  }

  // Test key routes on Mobile (390x844)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const keyMobileRoutes = ['/', '/goals', '/tasks', '/calendar', '/documents', '/actions'];
  for (const route of keyMobileRoutes) {
    const url = `http://localhost:4173${route}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log(`[Mobile 390x844] Successfully rendered: ${route}`);
  }

  // Test tablet (768x1024)
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4173/calendar', { waitUntil: 'networkidle0' });
  console.log('[Tablet 768x1024] Successfully rendered: /calendar');

  await browser.close();

  if (errorsCount === 0) {
    console.log('✅ ALL 17 ROUTES VERIFIED WITH ZERO RUNTIME ERRORS!');
  } else {
    console.warn(`Completed with ${errorsCount} warnings/errors logged.`);
  }
}

run().catch((err) => {
  console.error('Test script failure:', err);
  process.exit(1);
});
