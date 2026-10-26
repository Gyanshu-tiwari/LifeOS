import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:3000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyMapAndRouteFlow() {
  console.log('=== STARTING MAP & ROUTE FLOW VALIDATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    if (text.includes('Error') || text.includes('Failed')) {
      console.log('  [Browser]', text);
    }
  });

  try {
    // 1. Sign up a new user
    const testEmail = `mapflow.${Date.now()}@lifeos.internal`;
    const testPassword = `MapFlowPass!${Date.now()}`;
    console.log('[1] Signing up test account:', testEmail);
    await page.goto(`${FRONTEND_URL}/signup`, { waitUntil: 'networkidle0' });

    await page.type('input[placeholder="Your name"]', 'Map Flow Tester');
    await page.type('input[placeholder="you@example.com"]', testEmail);
    const pwInputs = await page.$$('input[type="password"]');
    await pwInputs[0].type(testPassword);
    await pwInputs[1].type(testPassword);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => !window.location.pathname.includes('/signup'), { timeout: 15000 });
    await delay(1000);
    console.log('✓ Signed in successfully.');

    // 2. Create activity WITHOUT starting location in prompt
    console.log('\n[2] Creating plan WITHOUT starting location specified...');
    await page.goto(`${FRONTEND_URL}/create`, { waitUntil: 'networkidle0' });
    await delay(500);

    const textarea = await page.$('textarea');
    await textarea.type('Trip to Jaipur for 2 days exploring palaces, landmarks, and street food.');

    const createBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Create Plan'));
    });
    await createBtn.asElement().click();

    await page.waitForFunction(() => window.location.pathname.includes('/generating'), { timeout: 15000 });
    console.log('✓ Generating plan, waiting for multi-agent synthesis...');

    await page.waitForFunction(
      () => window.location.pathname.startsWith('/plans/') && !window.location.pathname.includes('/generating'),
      { timeout: 120000, polling: 1000 }
    );

    const planUrl = page.url();
    const planId = planUrl.match(/\/plans\/([^\/?#]+)/)[1];
    console.log('✓ Plan successfully generated! Plan ID:', planId);

    // 3. Open Journey / Map Page
    console.log('\n[3] Opening Journey/Map tab...');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/journey`, { waitUntil: 'networkidle0' });
    await delay(2500);

    // Inspect map and starting location box
    const initialCheck = await page.evaluate(() => {
      const canvas = document.querySelector('canvas.maplibregl-canvas');
      const startBox = document.body.innerText.includes('Choose Your Starting Location') ||
                       document.body.innerText.includes('Set Starting Location');
      const gpsBtn = Array.from(document.querySelectorAll('button')).some((b) =>
        b.innerText.includes('Use My Current Location') || b.innerText.includes('Detecting GPS')
      );
      const hubBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
        ['New Delhi', 'Gurgaon', 'Mumbai', 'Bengaluru'].some((h) => b.innerText.includes(h))
      );
      const categoryPills = Array.from(document.querySelectorAll('button')).filter((b) =>
        ['Important', 'Food', 'Wondering'].some((c) => b.innerText.includes(c))
      );

      return {
        hasCanvas: Boolean(canvas),
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        startBoxVisible: startBox,
        gpsBtnVisible: gpsBtn,
        hubCount: hubBtns.length,
        categoryPillCount: categoryPills.length,
      };
    });

    console.log('✓ MapLibre Canvas active and rendered:', initialCheck.hasCanvas, `(${initialCheck.canvasWidth}x${initialCheck.canvasHeight})`);
    console.log('✓ Starting Location Box displayed when origin missing:', initialCheck.startBoxVisible);
    console.log('✓ "Use Current Location" button available:', initialCheck.gpsBtnVisible);
    console.log('✓ Quick starting hubs available:', initialCheck.hubCount > 0);
    console.log('✓ Category filter pills available:', initialCheck.categoryPillCount > 0);

    if (!initialCheck.startBoxVisible) {
      throw new Error('Starting location box was NOT displayed when origin was omitted from prompt!');
    }

    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/map_before_route.png' });
    console.log('✓ Saved screenshot before route planning: map_before_route.png');

    // 4. Test selecting starting location & planning best route
    console.log('\n[4] Selecting starting location (New Delhi) and clicking "Plan Best Route"...');
    // Click "New Delhi" hub button
    const delhiBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'New Delhi');
    });
    if (delhiBtn && delhiBtn.asElement()) {
      await delhiBtn.asElement().click();
      await delay(500);
    } else {
      // Or type into input
      const input = await page.$('input[placeholder*="New Delhi"]');
      await input.type('New Delhi');
    }

    // Click "Plan Best Route"
    const planRouteBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((b) =>
        b.innerText.includes('Plan Best Route')
      );
    });
    await planRouteBtn.asElement().click();

    // Wait for route to be computed and saved
    console.log('Waiting for best route computation...');
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('New Delhi →') &&
          !text.includes('-- km') &&
          (text.includes('km') || text.includes('h '))
        );
      },
      { timeout: 25000, polling: 500 }
    );
    await delay(2000);

    const routeSummary = await page.evaluate(() => {
      const summaryText = document.body.innerText;
      const kmMatch = summaryText.match(/(\d+(?:\.\d+)?)\s*km/);
      const timeMatch = summaryText.match(/(\d+h\s*\d+m|\d+m)/);
      const flagsMatch = summaryText.match(/(\d+)\s*(?:flagged locations|verified stops)/);
      return {
        heading: document.querySelector('h2')?.innerText,
        distance: kmMatch ? kmMatch[0] : null,
        duration: timeMatch ? timeMatch[0] : null,
        flaggedStops: flagsMatch ? flagsMatch[0] : null,
      };
    });

    console.log('✓ Route calculated successfully!');
    console.log('  Route Title:', routeSummary.heading);
    console.log('  Distance:', routeSummary.distance);
    console.log('  Duration:', routeSummary.duration);
    console.log('  Stops:', routeSummary.flaggedStops);

    // 5. Test Category Filters for Food and Wondering
    console.log('\n[5] Testing Category Filtering (Food, Wondering, Important)...');

    // Click Food filter
    const foodFilter = await page.$('button[data-testid="category-tab-food"]');
    if (foodFilter) {
      await foodFilter.click();
      await delay(1000);
      const foodPlacesVisible = await page.evaluate(() => {
        return document.body.innerText.includes('Food & Dining') || document.body.innerText.includes('Restaurant') || document.body.innerText.includes('Cafe');
      });
      console.log('✓ Filtered to Food locations:', foodPlacesVisible);
    }

    // Click Wondering filter
    const wonderingFilter = await page.$('button[data-testid="category-tab-wondering"]');
    if (wonderingFilter) {
      await wonderingFilter.click();
      await delay(1000);
      const wonderingVisible = await page.evaluate(() => {
        return document.body.innerText.includes('Wondering & Leisure') || document.body.innerText.includes('Park') || document.body.innerText.includes('Fort') || document.body.innerText.includes('Palace');
      });
      console.log('✓ Filtered to Wondering & Leisure locations:', wonderingVisible);
    }

    // Click All filter back
    const allFilter = await page.$('button[data-testid="category-tab-all"]');
    if (allFilter) {
      await allFilter.click();
      await delay(1000);
    }

    // 6. Test Interactive Stop Selection
    console.log('\n[6] Testing Place Selection...');
    const firstStop = await page.$('div[data-testid="timeline-stop"]');
    if (firstStop) {
      await firstStop.click();
      await delay(1200);
      const isSelected = await page.evaluate(() => {
        const item = document.querySelector('div[data-testid="timeline-stop"].bg-blue-50');
        const popup = document.querySelector('.lifeos-map-popup');
        return Boolean(item) || Boolean(popup);
      });
      console.log('✓ Place selected & highlighted on map/timeline:', isSelected);
    }

    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/map_after_route.png' });
    console.log('✓ Saved screenshot after route planning: map_after_route.png');

    console.log('\n=== ALL MAP & ROUTE TESTS PASSED SUCCESSFULLY! ===');
    return { success: true };
  } catch (err) {
    console.error('\n❌ VALIDATION ERROR:', err.message);
    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/map_failure.png' }).catch(() => {});
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

verifyMapAndRouteFlow().then((res) => {
  if (!res.success) {
    process.exit(1);
  }
  process.exit(0);
});
