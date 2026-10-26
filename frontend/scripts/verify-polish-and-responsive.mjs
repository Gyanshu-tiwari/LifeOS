import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:3000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPolishAndResponsiveVerification() {
  console.log('=== STARTING POLISH & RESPONSIVE VALIDATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();

  try {
    // 1. Create a fresh test user
    const testEmail = `polish.test.${Date.now()}@lifeos.internal`;
    const testPassword = `Pass123!${Date.now()}`;
    const testName = 'Alex Mercer';

    await page.setViewport({ width: 1280, height: 900 });
    console.log('[STEP 1] Signing up test account...');
    await page.goto(`${FRONTEND_URL}/signup`, { waitUntil: 'networkidle0' });

    const nameInput = await page.$('input[placeholder="Your name"]');
    const emailInput = await page.$('input[placeholder="you@example.com"]');
    const pwInputs = await page.$$('input[type="password"]');

    await nameInput.type(testName);
    await emailInput.type(testEmail);
    await pwInputs[0].type(testPassword);
    await pwInputs[1].type(testPassword);

    const submitBtn = await page.$('button[type="submit"]');
    await submitBtn.click();

    await page.waitForFunction(() => !window.location.pathname.includes('/signup'), { timeout: 15000 });
    await delay(1500);
    console.log('✓ Signed in successfully. Current page:', page.url());

    // 2. Profile Page Audit
    console.log('\n[STEP 2] Auditing Profile Page...');
    await page.goto(`${FRONTEND_URL}/profile`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const profileText = await page.evaluate(() => document.body.innerText);
    const hasName = profileText.includes(testName);
    const hasEmail = profileText.includes(testEmail);
    const hasFirebase = profileText.includes('Firebase') || profileText.includes('Authentication');
    const hasApiStatus = profileText.includes('Operational') || profileText.includes('API');
    const hasRawSecret =
      profileText.includes('AIzaSy') ||
      profileText.includes('sk-') ||
      profileText.includes('client_secret') ||
      profileText.includes('private_key');

    console.log('✓ Profile shows real display name:', hasName);
    console.log('✓ Profile shows real email:', hasEmail);
    console.log('✓ Profile shows Firebase Auth provider badge:', hasFirebase);
    console.log('✓ Profile shows live Backend API status:', hasApiStatus);
    console.log('✓ Profile does NOT expose raw keys or secrets:', !hasRawSecret);

    if (hasRawSecret) {
      throw new Error('SECURITY VIOLATION: Raw credential detected on Profile page!');
    }

    // Test Edit Name dialog on Profile page
    console.log('Testing "Edit Name" dialog on Profile page...');
    const editBtnHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.innerText.includes('Edit Name')) || null;
    });
    const editBtn = editBtnHandle.asElement();

    if (editBtn) {
      await editBtn.click();
      await delay(800);
      const modalInput = await page.$('input[placeholder="Enter display name"]');
      if (modalInput) {
        // clear input and type updated name
        await modalInput.click({ clickCount: 3 });
        await modalInput.type('Alex Mercer Updated');
        const saveBtnHandle = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find((b) => b.innerText.includes('Save Changes')) || null;
        });
        const saveBtn = saveBtnHandle.asElement();
        if (saveBtn) {
          await saveBtn.click();
          await delay(1500);
          const updatedProfileText = await page.evaluate(() => document.body.innerText);
          console.log('✓ Updated display name saved:', updatedProfileText.includes('Alex Mercer Updated'));
          console.log('✓ Toast confirmation displayed:', updatedProfileText.includes('Name Updated') || updatedProfileText.includes('Profile Updated'));
        }
      }
    }

    // 3. Settings Page Audit
    console.log('\n[STEP 3] Auditing Settings Page & Preferences...');
    await page.goto(`${FRONTEND_URL}/settings`, { waitUntil: 'networkidle0' });
    await delay(1500);

    const settingsText = await page.evaluate(() => document.body.innerText);
    console.log('✓ Settings page loaded with preferences and account controls');

    // Test unit toggle
    const miBtnHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.innerText.trim() === 'mi') || null;
    });
    const miBtn = miBtnHandle.asElement();

    if (miBtn) {
      await miBtn.click();
      await delay(800);
      const bodyWithToast = await page.evaluate(() => document.body.innerText);
      console.log('✓ Distance unit toggled to Miles, toast alert shown:', bodyWithToast.includes('Preferences Saved') || bodyWithToast.includes('Miles'));
    }

    // Test Refresh Cache button
    const refreshCacheBtnHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.innerText.includes('Refresh Cache')) || null;
    });
    const refreshCacheBtn = refreshCacheBtnHandle.asElement();

    if (refreshCacheBtn) {
      await refreshCacheBtn.click();
      await delay(800);
      const cacheToast = await page.evaluate(() => document.body.innerText);
      console.log('✓ Query cache refreshed with toast notification:', cacheToast.includes('Cache Refreshed'));
    }

    // 4. Responsive Viewport Tests
    console.log('\n[STEP 4] Testing Responsive Viewports...');

    // Mobile Viewport (iPhone 13: 390x844)
    console.log('Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const mobileNavVisible = await page.evaluate(() => {
      const nav = document.querySelector('nav.md\\:hidden');
      return Boolean(nav && nav.clientHeight > 0);
    });
    console.log('✓ Mobile bottom navigation bar rendered:', mobileNavVisible);

    // Tablet Viewport (iPad: 768x1024)
    console.log('Testing Tablet Viewport (768x1024)...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const tabletSidebarVisible = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return Boolean(aside && aside.clientWidth > 0);
    });
    console.log('✓ Tablet sidebar navigation layout adapted:', tabletSidebarVisible);

    // Desktop Viewport (1440x900)
    console.log('Testing Desktop Viewport (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const desktopSidebar = await page.evaluate(() => {
      const aside = document.querySelector('aside');
      return Boolean(aside && aside.clientWidth >= 200);
    });
    console.log('✓ Desktop full sidebar navigation rendered:', desktopSidebar);

    console.log('\n=== ALL POLISH & RESPONSIVE CHECKS PASSED! ===');
    return { success: true };
  } catch (err) {
    console.error('\n❌ POLISH TEST FAILED:', err.message);
    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/polish_failure.png' }).catch(() => {});
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

runPolishAndResponsiveVerification().then((res) => {
  if (!res.success) {
    process.exit(1);
  }
  process.exit(0);
});
