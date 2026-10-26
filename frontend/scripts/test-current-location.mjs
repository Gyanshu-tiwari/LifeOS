import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:3000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testCurrentLocation() {
  console.log('=== TESTING CURRENT LOCATION BUTTON & ROUTE FLOW ===\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Grant geolocation permissions to the page
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(FRONTEND_URL, ['geolocation']);
  // Set realistic geolocation coordinates (New Delhi)
  await page.setGeolocation({ latitude: 28.6139, longitude: 77.2090 });

  try {
    // 1. Sign up test user
    const testEmail = `currentloc.${Date.now()}@lifeos.internal`;
    const testPassword = `CurrLocPass!${Date.now()}`;
    console.log('[1] Signing up test account:', testEmail);
    await page.goto(`${FRONTEND_URL}/signup`, { waitUntil: 'networkidle0' });

    await page.type('input[placeholder="Your name"]', 'Location Tester');
    await page.type('input[placeholder="you@example.com"]', testEmail);
    const pwInputs = await page.$$('input[type="password"]');
    await pwInputs[0].type(testPassword);
    await pwInputs[1].type(testPassword);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => !window.location.pathname.includes('/signup'), { timeout: 15000 });
    await delay(1000);

    // 2. Create plan without starting location: "Trip to Jaipur"
    console.log('[2] Creating plan without departure point...');
    await page.goto(`${FRONTEND_URL}/create`, { waitUntil: 'networkidle0' });
    await delay(500);

    const textarea = await page.$('textarea');
    await textarea.type('2-Day cultural exploration trip to Jaipur with palaces, bazaars and authentic food.');

    const createBtn = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Create Plan'));
    });
    await createBtn.asElement().click();

    console.log('Waiting for plan synthesis...');
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/plans/') && !window.location.pathname.includes('/generating'),
      { timeout: 120000, polling: 1000 }
    );

    const planUrl = page.url();
    const planId = planUrl.match(/\/plans\/([^\/?#]+)/)[1];
    console.log('✓ Plan generated successfully:', planId);

    // 3. Open Journey page
    console.log('[3] Opening Journey page...');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/journey`, { waitUntil: 'networkidle0' });
    await delay(2500);

    // 4. Test clicking "Use My Current Location" button
    console.log('[4] Clicking "Use My Current Location" button...');
    const currentLocBtn = await page.$('button[data-testid="use-current-location-btn"]');
    if (!currentLocBtn) {
      throw new Error('"Use My Current Location" button not found on page!');
    }
    await currentLocBtn.click();

    // Wait for location to resolve
    console.log('Waiting for location detection & reverse geocoding...');
    await page.waitForFunction(
      () => {
        const input = document.querySelector('input[placeholder*="e.g. New Delhi"]');
        return input && input.value && input.value.trim().length > 0;
      },
      { timeout: 15000, polling: 500 }
    );

    const detectedLocation = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="e.g. New Delhi"]');
      const btn = document.querySelector('button[data-testid="use-current-location-btn"]');
      return {
        inputValue: input ? input.value : null,
        btnText: btn ? btn.innerText.replace(/\n/g, ' ') : null,
      };
    });

    console.log('✓ Location successfully detected and populated!');
    console.log('  Resolved Location:', detectedLocation.inputValue);
    console.log('  Button State:', detectedLocation.btnText);

    // 5. Submit "Plan Best Route →"
    console.log('[5] Submitting "Plan Best Route →"...');
    const submitBtn = await page.$('button[data-testid="plan-route-submit"]');
    await submitBtn.click();

    // Wait for route recalculation
    console.log('Waiting for route recalculation with detected location...');
    await page.waitForFunction(
      () => {
        const text = document.body.innerText;
        return !text.includes('Computing Best Route') &&
               (text.includes('km') || text.includes('h ')) &&
               !text.includes('-- km');
      },
      { timeout: 25000, polling: 500 }
    );
    await delay(2000);

    const routeSummary = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      const text = document.body.innerText;
      const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*km/);
      const timeMatch = text.match(/(\d+h\s*\d+m|\d+m)/);
      return {
        title: h2 ? h2.innerText : null,
        distance: kmMatch ? kmMatch[0] : null,
        duration: timeMatch ? timeMatch[0] : null,
      };
    });

    console.log('✓ Route successfully computed using current location!');
    console.log('  Route Title:', routeSummary.title);
    console.log('  Distance:', routeSummary.distance);
    console.log('  Duration:', routeSummary.duration);

    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/current_location_success.png' });
    console.log('✓ Saved screenshot: current_location_success.png');

    console.log('\n=== CURRENT LOCATION TEST PASSED! ===');
    return { success: true };
  } catch (err) {
    console.error('\n❌ CURRENT LOCATION TEST FAILED:', err.message);
    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/current_location_error.png' }).catch(() => {});
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

testCurrentLocation().then((res) => {
  process.exit(res.success ? 0 : 1);
});
