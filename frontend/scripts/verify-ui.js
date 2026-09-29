import puppeteer from 'puppeteer-core';
import fs from 'fs';

async function run() {
  console.log('Launching headless Chrome with puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: '/home/abhiboss/.local/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
  console.log('Page loaded at 390x844.');

  // 1. Initial screenshot
  await page.screenshot({ path: 'screenshot_test_initial.png' });
  console.log('Captured screenshot_test_initial.png');

  // 2. Click on the first task checkbox
  const taskCheckboxes = await page.$$('[role="checkbox"]');
  console.log(`Found ${taskCheckboxes.length} task checkboxes.`);
  if (taskCheckboxes.length > 0) {
    await taskCheckboxes[0].click();
    console.log('Clicked first task checkbox.');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: 'screenshot_test_task_checked.png' });
    console.log('Captured screenshot_test_task_checked.png');
  }

  // 3. Click on the first AI Agent card to open AgentModal
  const agentCards = await page.$$('h4');
  let researchAgentCard = null;
  for (const card of agentCards) {
    const text = await page.evaluate((el) => el.textContent, card);
    if (text && text.includes('Research')) {
      researchAgentCard = card;
      break;
    }
  }

  if (researchAgentCard) {
    await researchAgentCard.click();
    console.log('Clicked Research Agent card.');
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: 'screenshot_test_agent_modal.png' });
    console.log('Captured screenshot_test_agent_modal.png');

    // Close modal
    const closeBtn = await page.$('button[aria-label="Close"], button svg.lucide-x');
    if (closeBtn) {
      await closeBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  // 4. Click on Quick Action "Plan"
  const planButtons = await page.$$('button');
  for (const btn of planButtons) {
    const text = await page.evaluate((el) => el.textContent, btn);
    if (text && text.includes('Plan') && text.includes('Create a plan')) {
      await btn.click();
      console.log('Clicked Quick Action Plan.');
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: 'screenshot_test_plan_modal.png' });
      console.log('Captured screenshot_test_plan_modal.png');
      break;
    }
  }

  await browser.close();
  console.log('Browser tests completed successfully!');
}

run().catch((err) => {
  console.error('Error during test execution:', err);
  process.exit(1);
});
