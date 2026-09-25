import puppeteer from 'puppeteer-core';

async function run() {
  console.log('Launching Puppeteer for Responsive Web Testing...');
  const browser = await puppeteer.launch({
    executablePath: '/home/abhiboss/.local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  // 1. Desktop 1440x900 - Home
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_desktop_home.png' });
  console.log('Captured screenshot_desktop_home.png');

  // 2. Desktop 1440x900 - Goals
  await page.goto('http://localhost:4173/goals', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_desktop_goals.png' });
  console.log('Captured screenshot_desktop_goals.png');

  // 3. Desktop 1440x900 - Goal Details
  await page.goto('http://localhost:4173/goals/goal-lucknow-college', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_desktop_goal_details.png' });
  console.log('Captured screenshot_desktop_goal_details.png');

  // 4. Desktop 1440x900 - Plan Review
  await page.goto('http://localhost:4173/goals/goal-lucknow-college/plan', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_desktop_plan.png' });
  console.log('Captured screenshot_desktop_plan.png');

  // 5. Desktop 1440x900 - Agents Operations Center
  await page.goto('http://localhost:4173/agents', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_desktop_agents.png' });
  console.log('Captured screenshot_desktop_agents.png');

  // 6. Tablet 768x1024 - Home
  await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_tablet_home.png' });
  console.log('Captured screenshot_tablet_home.png');

  // 7. Mobile 390x844 - Home
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: 'screenshot_mobile_home.png' });
  console.log('Captured screenshot_mobile_home.png');

  await browser.close();
  console.log('All responsive web screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Testing error:', err);
  process.exit(1);
});
