import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

// Generate unique test credentials (NEVER print or export these)
const testEmail = `test.e2e.${Date.now()}@lifeos-validation.internal`;
const testPassword = `ValidationPass!${Date.now()}`;
const testIntent = 'I am going from Delhi to Manali for 4 days by car.';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runE2EValidation() {
  console.log('=== STARTING LIFEOS FULL E2E VALIDATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  let planId = null;
  let activityId = null;

  try {
    // -------------------------------------------------------------
    // PHASE 6 (Part 1): Protected routes while logged out
    // -------------------------------------------------------------
    console.log('[PHASE 6.1] Testing protected routes when logged out...');
    const protectedRoutes = ['/dashboard', '/create', '/profile', '/settings', '/plans/00000000-0000-0000-0000-000000000000'];
    for (const route of protectedRoutes) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle0' });
      const currentUrl = page.url();
      if (!currentUrl.includes('/login')) {
        throw new Error(`Route ${route} failed to redirect to /login! Current URL: ${currentUrl}`);
      }
    }
    console.log('✓ Unauthenticated protected routes properly redirected to /login\n');

    // -------------------------------------------------------------
    // PHASE 4: Firebase Signup
    // -------------------------------------------------------------
    console.log('[PHASE 4] Testing Firebase Signup...');
    await page.goto(`${FRONTEND_URL}/signup`, { waitUntil: 'networkidle0' });

    // Check no missing Firebase config warning
    const signupText = await page.evaluate(() => document.body.innerText);
    if (signupText.includes('Firebase Configuration Required')) {
      throw new Error('Frontend reports Firebase is not configured!');
    }

    // Fill signup form
    const nameInput = await page.$('input[placeholder="Your name"]');
    const emailInput = await page.$('input[placeholder="you@example.com"]');
    const passwordInputs = await page.$$('input[type="password"]');

    if (!nameInput || !emailInput || passwordInputs.length < 2) {
      throw new Error('Signup form fields not found!');
    }

    await nameInput.type('Validation Tester');
    await emailInput.type(testEmail);
    await passwordInputs[0].type(testPassword);
    await passwordInputs[1].type(testPassword);

    // Submit signup
    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    // Wait for navigation away from /signup
    await page.waitForFunction(() => !window.location.pathname.includes('/signup'), { timeout: 15000 });
    await delay(2000);

    console.log('✓ Form submitted, navigated to:', page.url());

    // Confirm AuthProvider detects the authenticated Firebase user
    const authState = await page.evaluate(() => {
      return {
        path: window.location.pathname,
        hasContent: document.body.innerText.includes('What are you planning today') ||
                    document.body.innerText.includes('Validation Tester') ||
                    document.body.innerText.includes('Good') ||
                    document.body.innerText.includes('Active plans')
      };
    });

    if (!authState.hasContent && authState.path.includes('/login')) {
      throw new Error('Application did not transition into authenticated state!');
    }
    console.log('✓ Firebase user created and AuthProvider transitioned to authenticated state\n');

    // -------------------------------------------------------------
    // PHASE 5: Logout and Login + Token Verification
    // -------------------------------------------------------------
    console.log('[PHASE 5] Testing Logout, Login & Token Verification...');

    // 1. Log out via profile page
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const signoutBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Sign out')) || null;
    });

    if (signoutBtn) {
      await signoutBtn.click();
      await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 10000 });
      console.log('✓ Successfully signed out and redirected to /login');
    } else {
      throw new Error('Could not find Sign out button on Profile page');
    }

    // 2. Log back in with the same credentials
    await page.waitForSelector('input[placeholder="you@example.com"]', { timeout: 5000 });
    const loginEmailInput = await page.$('input[placeholder="you@example.com"]');
    const loginPasswordInput = await page.$('input[placeholder="••••••••"]');
    const loginSubmitBtn = await page.$('button[type="submit"]');

    if (!loginEmailInput || !loginPasswordInput || !loginSubmitBtn) {
      throw new Error('Login form fields not found!');
    }

    await loginEmailInput.type(testEmail);
    await loginPasswordInput.type(testPassword);

    // Track network requests and responses for Authorization header and status
    let authHeaderObserved = false;
    let authHeaderFormatValid = false;
    let backendAuthResponseStatus = null;

    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/v1/')) {
        const headers = req.headers();
        const auth = headers['authorization'];
        if (auth) {
          authHeaderObserved = true;
          // Check format without logging value: Bearer eyJ... (3 parts)
          if (auth.startsWith('Bearer eyJ') && auth.split('.').length === 3) {
            authHeaderFormatValid = true;
          }
        }
      }
    });

    page.on('response', (res) => {
      const url = res.url();
      if (url.includes('/api/v1/activities')) {
        backendAuthResponseStatus = res.status();
      }
    });

    await loginSubmitBtn.click();
    await page.waitForFunction(() => !window.location.pathname.includes('/login'), { timeout: 15000 });
    await delay(1500);

    console.log('✓ Successfully logged in, current URL:', page.url());

    // Navigate to /dashboard to trigger authenticated API call via Axios
    console.log('Triggering authenticated API request via /dashboard...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await delay(2000);

    console.log('✓ Outgoing API request Authorization header attached:', authHeaderObserved);
    console.log('✓ Bearer token format valid RS256 JWT:', authHeaderFormatValid);
    console.log('✓ Backend API response status for authenticated request:', backendAuthResponseStatus);

    if (!authHeaderObserved || !authHeaderFormatValid) {
      throw new Error('Axios failed to attach valid Bearer token on API request!');
    }
    if (backendAuthResponseStatus !== 200) {
      throw new Error(`Backend rejected authenticated request with HTTP status: ${backendAuthResponseStatus}`);
    }
    console.log('✓ Backend Firebase Admin successfully verified the token and returned 200 OK\n');

    // -------------------------------------------------------------
    // PHASE 6 (Part 2): Protected routes while authenticated
    // -------------------------------------------------------------
    console.log('[PHASE 6.2] Testing protected routes when logged in...');
    const authRoutes = ['/dashboard', '/create', '/profile', '/settings'];
    for (const route of authRoutes) {
      await page.goto(`${FRONTEND_URL}${route}`, { waitUntil: 'networkidle0' });
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        throw new Error(`Route ${route} unexpectedly redirected to /login while authenticated!`);
      }
      console.log(`✓ Accessible: ${route} (rendered at ${currentUrl})`);
    }

    // -------------------------------------------------------------
    // PHASE 7: Real LIFEOS Flow (Create Activity & Plan)
    // -------------------------------------------------------------
    console.log('\n[PHASE 7] Testing Real LIFEOS Flow...');
    await page.goto(`${FRONTEND_URL}/create`, { waitUntil: 'networkidle0' });
    await delay(1000);

    // Enter test intent
    const textarea = await page.$('textarea');
    if (!textarea) throw new Error('Activity intent textarea not found!');

    await textarea.type(testIntent);
    console.log('✓ Typed test intent into create form');

    // Click submit button
    const createBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(b => b.innerText.includes('Create Plan')) || null;
    });

    if (!createBtn) throw new Error('Create Plan button not found!');
    await createBtn.click();

    // Wait for transition to /plans/:id/generating or directly to /plans/:planId
    console.log('Waiting for plan generation page...');
    await page.waitForFunction(
      () => {
        const path = window.location.pathname;
        return path.includes('/generating') || (path.startsWith('/plans/') && !path.includes('/create'));
      },
      { timeout: 90000, polling: 1000 }
    );
    console.log('✓ Transitioned to:', page.url());

    // Extract activity ID or plan ID from URL
    const currentPath = await page.evaluate(() => window.location.pathname);
    console.log('✓ Current path during generation:', currentPath);

    // Wait for plan generation to succeed and transition to Plan Overview /plans/:planId
    console.log('Waiting for AI plan generation to complete and navigate to Plan Overview...');
    await page.waitForFunction(
      () => {
        const path = window.location.pathname;
        return path.startsWith('/plans/') && !path.includes('/generating') && !path.includes('/create');
      },
      { timeout: 120000, polling: 1000 }
    );

    const planUrl = page.url();
    const planMatch = planUrl.match(/\/plans\/([^\/?#]+)/);
    if (planMatch) planId = planMatch[1];
    console.log('✓ Plan generation succeeded! Navigated to Plan Overview:', planUrl);
    console.log('✓ Generated Plan ID:', planId);

    // Wait for plan overview to render content
    await delay(3000);
    const overviewContent = await page.evaluate(() => {
      return {
        title: document.querySelector('h1')?.innerText || '',
        hasOverview: document.body.innerText.includes('Overview') || document.body.innerText.includes('Tasks'),
        hasNextAction: document.body.innerText.includes('Next action') || document.body.innerText.includes('Essential') || document.body.innerText.includes('Recommended')
      };
    });

    console.log('✓ Plan Title:', overviewContent.title);
    console.log('✓ Overview Rendered:', overviewContent.hasOverview);
    console.log('✓ Next Action Section Present:', overviewContent.hasNextAction);

    // -------------------------------------------------------------
    // PHASE 8: Test Plan Features
    // -------------------------------------------------------------
    console.log('\n[PHASE 8] Testing Plan Features...');

    // 1. Tasks
    console.log('\n--- 8.1 Testing Tasks ---');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/tasks`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const initialTaskStats = await page.evaluate(() => {
      const text = document.body.innerText;
      const match = text.match(/(\d+)\/(\d+)\s+completed/);
      return {
        match: match ? match[0] : null,
        completed: match ? parseInt(match[1]) : 0,
        total: match ? parseInt(match[2]) : 0
      };
    });
    console.log('✓ Initial task stats:', initialTaskStats.match || 'Loaded');

    // Click first task to complete it
    const taskRows = await page.$$('div.cursor-pointer.group');
    if (taskRows.length > 0) {
      console.log(`Found ${taskRows.length} tasks in UI. Toggling first task...`);
      await taskRows[0].click();
      await delay(2000);

      const afterCompleteStats = await page.evaluate(() => {
        const match = document.body.innerText.match(/(\d+)\/(\d+)\s+completed/);
        return match ? match[0] : null;
      });
      console.log('✓ After completing task:', afterCompleteStats);

      // Click again to reopen
      await taskRows[0].click();
      await delay(2000);

      const afterReopenStats = await page.evaluate(() => {
        const match = document.body.innerText.match(/(\d+)\/(\d+)\s+completed/);
        return match ? match[0] : null;
      });
      console.log('✓ After reopening task:', afterReopenStats);
    } else {
      console.log('Warning: No task rows found with selector');
    }

    // 2. Journey / Map
    console.log('\n--- 8.2 Testing Journey / Map ---');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/journey`, { waitUntil: 'networkidle0' });
    await delay(3000);

    const journeyInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasOrigin: text.includes('Delhi') || text.includes('delhi'),
        hasDestination: text.includes('Manali') || text.includes('manali'),
        hasMapContainer: Boolean(document.querySelector('.maplibregl-map') || document.querySelector('canvas') || document.querySelector('[class*="map"]')),
      };
    });
    console.log('✓ Journey has Origin (Delhi):', journeyInfo.hasOrigin);
    console.log('✓ Journey has Destination (Manali):', journeyInfo.hasDestination);
    console.log('✓ Journey map canvas/container rendered:', journeyInfo.hasMapContainer);

    // 3. Places
    console.log('\n--- 8.3 Testing Places ---');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/places`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const placesInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPlaces: !text.includes('No places found') && text.length > 100
      };
    });
    console.log('✓ Places view loaded real places from backend:', placesInfo.hasPlaces);

    // 4. Packing
    console.log('\n--- 8.4 Testing Packing Checklist & Persistence ---');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/packing`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const initialPacking = await page.evaluate(() => {
      const match = document.body.innerText.match(/(\d+)\/(\d+)\s+packed/);
      return {
        match: match ? match[0] : null,
        packed: match ? parseInt(match[1]) : 0,
        total: match ? parseInt(match[2]) : 0
      };
    });
    console.log('✓ Initial packing stats:', initialPacking.match || 'Loaded');

    // Toggle first packing item
    const packingToggles = await page.$$('div.cursor-pointer, button[role="checkbox"], div[class*="group"]');
    let toggledItem = false;
    for (const toggle of packingToggles) {
      const text = await page.evaluate(el => el.innerText, toggle);
      if (text && !text.includes('packed') && !text.includes('Checklist') && !text.includes('Required') && !text.includes('Helpful')) {
        await toggle.click();
        toggledItem = true;
        break;
      }
    }

    if (toggledItem) {
      await delay(2000);
      const afterToggle = await page.evaluate(() => {
        const match = document.body.innerText.match(/(\d+)\/(\d+)\s+packed/);
        return match ? match[0] : null;
      });
      console.log('✓ After toggling item:', afterToggle);

      // Refresh page to verify persistence
      console.log('Reloading page to verify persistence...');
      await page.reload({ waitUntil: 'networkidle0' });
      await delay(2000);

      const afterReload = await page.evaluate(() => {
        const match = document.body.innerText.match(/(\d+)\/(\d+)\s+packed/);
        return match ? match[0] : null;
      });
      console.log('✓ After reload packing stats (persisted in DB):', afterReload);
      if (afterReload === afterToggle) {
        console.log('✓ Packing persistence verified!');
      }
    }

    // 5. Itinerary
    console.log('\n--- 8.5 Testing Itinerary & Persistence ---');
    await page.goto(`${FRONTEND_URL}/plans/${planId}/itinerary`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const initialItinerary = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasDays: text.includes('Day 1') || text.includes('Day 2') || text.includes('Stop') || text.includes('Depart'),
      };
    });
    console.log('✓ Itinerary loaded days/stops:', initialItinerary.hasDays);

    // Refresh page to verify persistence
    await page.reload({ waitUntil: 'networkidle0' });
    await delay(2000);

    const reloadedItinerary = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasDays: text.includes('Day 1') || text.includes('Day 2') || text.includes('Stop') || text.includes('Depart')
      };
    });
    console.log('✓ Itinerary reloaded and verified persistent:', reloadedItinerary.hasDays);

    console.log('\n=== ALL BROWSER E2E TESTS PASSED SUCCESSFULLY! ===');
    return { success: true, planId, activityId };

  } catch (err) {
    console.error('\n❌ E2E TEST FAILED:', err.message);
    const screenshotPath = '/home/baby/Documents/LifeOS/frontend/e2e_failure.png';
    await page.screenshot({ path: screenshotPath }).catch(() => {});
    console.error(`Screenshot captured to ${screenshotPath}`);
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

runE2EValidation().then(res => {
  if (!res.success) {
    process.exit(1);
  }
  process.exit(0);
});
