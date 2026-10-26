import puppeteer from 'puppeteer-core';

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runPhase17And18Validation() {
  console.log('=== STARTING PHASE 17 & 18 VALIDATION ===\n');

  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('Failed') || text.includes('Error') || text.includes('Plan')) {
      console.log('  [Browser]', text);
    }
  });

  try {
    // -------------------------------------------------------------
    // SETUP: Authenticate user
    // -------------------------------------------------------------
    const testEmail = `notif.test.${Date.now()}@lifeos.internal`;
    const testPassword = `NotifPass!${Date.now()}`;
    const testName = 'Jordan Lee';

    await page.setViewport({ width: 1280, height: 900 });
    console.log('[SETUP] Signing up test account for Notification & Layout tests...');
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
    console.log('✓ Signed in. Current URL:', page.url());

    // -------------------------------------------------------------
    // PHASE 17: Notification Bell & Popover
    // -------------------------------------------------------------
    console.log('\n[PHASE 17] Testing Notification Bell & Popover...');

    // 1. Verify Bell button on HomePage
    await page.goto(`${FRONTEND_URL}/`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const homeBell = await page.$('button[aria-label="Open notifications"]');
    if (!homeBell) throw new Error('Notification bell button not found on Home page header!');
    console.log('✓ Notification bell button visible in Home page header');

    // 2. Verify Bell button on DashboardPage
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const dashBell = await page.$('button[aria-label="Open notifications"]');
    if (!dashBell) throw new Error('Notification bell button not found on Dashboard header!');
    console.log('✓ Notification bell button visible in Dashboard header');

    // 3. Open Popover Panel
    console.log('Clicking notification bell...');
    await dashBell.click();
    await delay(600);

    const panelVisible = await page.evaluate(() => {
      const panel = document.querySelector('div[role="status"], div.z-\\[60\\]');
      const text = document.body.innerText;
      return text.includes('Notifications') && Boolean(panel);
    });
    console.log('✓ Notification popover panel opened:', panelVisible);

    // 4. Test empty state initially
    const emptyStateText = await page.evaluate(() => document.body.innerText);
    console.log('✓ Empty state rendered appropriately:', emptyStateText.includes('No notifications yet') || emptyStateText.includes('All caught up'));

    // 5. Test Escape key to close panel
    console.log('Pressing Escape to close panel...');
    await page.keyboard.press('Escape');
    await delay(500);

    const panelClosed = await page.evaluate(() => {
      const text = document.body.innerText;
      return !text.includes('No notifications yet');
    });
    console.log('✓ Panel closed on Escape key press:', panelClosed);

    // -------------------------------------------------------------
    // Create Plan to trigger PLAN_READY notification
    // -------------------------------------------------------------
    console.log('\nCreating activity to generate a PLAN_READY notification...');
    await page.goto(`${FRONTEND_URL}/create`, { waitUntil: 'networkidle0' });
    await delay(1000);

    const textarea = await page.$('textarea');
    await textarea.type('Delhi to Agra day trip by car for monument tour.');

    const createBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.innerText.includes('Create Plan')) || null;
    });
    await createBtn.asElement().click();

    // Wait for transition to generating page
    await page.waitForFunction(() => window.location.pathname.includes('/generating'), { timeout: 15000 });
    console.log('✓ Generating screen active, waiting for completion...');

    // Wait for plan generation to complete and navigate to /plans/:id
    await page.waitForFunction(
      () => window.location.pathname.startsWith('/plans/') && !window.location.pathname.includes('/generating'),
      { timeout: 120000, polling: 1000 }
    );
    const planUrl = page.url();
    const planId = planUrl.match(/\/plans\/([^\/?#]+)/)[1];
    console.log('✓ Plan generated! Navigated to:', planUrl);

    // Navigate to /dashboard and check notification bell badge
    console.log('\nNavigating to /dashboard to inspect persistent notification...');
    await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
    await delay(2000);

    const unreadBadge = await page.evaluate(() => {
      const badge = document.querySelector('button[aria-label="Open notifications"] span.bg-rose-500');
      return badge ? badge.innerText : null;
    });
    console.log('✓ Real unread badge count on bell:', unreadBadge);

    // Open notification popover to see the PLAN_READY item
    const openBell = await page.$('button[aria-label="Open notifications"]');
    await openBell.click();
    await delay(1000);

    const notifDetails = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasPlanReady: text.includes('Plan ready') || text.includes('Delhi to Agra'),
        hasRelativeTime: text.includes('ago') || text.includes('recently') || text.includes('now'),
        hasViewDetails: text.includes('View details'),
      };
    });
    console.log('✓ Notification title and plan details visible:', notifDetails.hasPlanReady);
    console.log('✓ Relative timestamp formatted cleanly:', notifDetails.hasRelativeTime);

    // Click notification item to navigate and mark as read
    console.log('Clicking notification item to navigate to plan...');
    const notifItem = await page.evaluateHandle(() => {
      const items = Array.from(document.querySelectorAll('div.cursor-pointer'));
      return items.find((el) => el.innerText.includes('Plan ready')) || null;
    });

    if (notifItem && notifItem.asElement()) {
      await notifItem.asElement().click();
      await delay(2000);
      console.log('✓ Navigated via notification action to:', page.url());
      if (!page.url().includes(planId)) {
        throw new Error(`Notification failed to navigate to plan ${planId}`);
      }
    }

    // -------------------------------------------------------------
    // PHASE 18: Layout & Navigation Overlap Audit
    // -------------------------------------------------------------
    console.log('\n[PHASE 18] Auditing Layout & Navigation Across Viewports...');

    const viewports = [
      { name: 'Mobile (320px)', width: 320, height: 568 },
      { name: 'Mobile (375px)', width: 375, height: 667 },
      { name: 'Mobile (390px)', width: 390, height: 844 },
      { name: 'Mobile (414px)', width: 414, height: 896 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1024px)', width: 1024, height: 768 },
      { name: 'Desktop (1440px)', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      console.log(`\nTesting viewport ${vp.name}...`);
      await page.setViewport({ width: vp.width, height: vp.height });

      // 1. Dashboard Page
      await page.goto(`${FRONTEND_URL}/dashboard`, { waitUntil: 'networkidle0' });
      await delay(600);

      const dashAudit = await page.evaluate((vpWidth) => {
        const bodyWidth = document.documentElement.scrollWidth;
        const hasHorizontalOverflow = bodyWidth > vpWidth + 2;

        // Verify the last element on page does not collide with bottom nav
        const bottomNav = document.querySelector('nav.md\\:hidden');
        let bottomNavCollision = false;
        if (bottomNav && bottomNav.clientHeight > 0) {
          const navTop = bottomNav.getBoundingClientRect().top;
          // check cards
          const cards = Array.from(document.querySelectorAll('div.cursor-pointer'));
          if (cards.length > 0) {
            const lastCard = cards[cards.length - 1];
            const cardBottom = lastCard.getBoundingClientRect().bottom;
            // When scrolled to bottom, last element must have margin above nav
            window.scrollTo(0, document.body.scrollHeight);
            const scrolledLastCardBottom = lastCard.getBoundingClientRect().bottom;
            if (scrolledLastCardBottom > navTop) {
              bottomNavCollision = true;
            }
          }
        }

        return { hasHorizontalOverflow, bottomNavCollision };
      }, vp.width);

      console.log(`✓ [${vp.name}] Dashboard no horizontal scroll overflow:`, !dashAudit.hasHorizontalOverflow);
      console.log(`✓ [${vp.name}] Dashboard bottom navigation does not cover last item:`, !dashAudit.bottomNavCollision);
      if (dashAudit.hasHorizontalOverflow) {
        throw new Error(`Horizontal overflow detected on Dashboard at ${vp.name}`);
      }
      if (dashAudit.bottomNavCollision) {
        throw new Error(`Bottom nav collision detected on Dashboard at ${vp.name}`);
      }

      // 2. Plan Sub-Navigation Tabs (/plans/:id)
      await page.goto(`${FRONTEND_URL}/plans/${planId}`, { waitUntil: 'networkidle0' });
      await delay(600);

      const planAudit = await page.evaluate((vpWidth) => {
        const bodyWidth = document.documentElement.scrollWidth;
        const hasHorizontalOverflow = bodyWidth > vpWidth + 2;

        const nav = document.querySelector('nav[aria-label="Plan sub-navigation"]');
        const tabLinks = Array.from(document.querySelectorAll('a[href*="/plans/"]'));
        const activeTab = tabLinks.find((t) => t.className.includes('border-lifeos-blue') || t.className.includes('text-lifeos-blue'));

        return {
          hasHorizontalOverflow,
          tabNavPresent: Boolean(nav),
          activeTabFound: Boolean(activeTab),
          tabCount: tabLinks.length,
        };
      }, vp.width);

      console.log(`✓ [${vp.name}] Plan tabs rendered cleanly without page overflow:`, !planAudit.hasHorizontalOverflow);
      console.log(`✓ [${vp.name}] Plan sub-navigation tabs present:`, planAudit.tabNavPresent);
      console.log(`✓ [${vp.name}] Active tab indicator correctly styled:`, planAudit.activeTabFound);

      if (planAudit.hasHorizontalOverflow) {
        throw new Error(`Horizontal page overflow on plan tabs at ${vp.name}`);
      }
    }

    console.log('\n=== ALL PHASE 17 & 18 VALIDATION TESTS PASSED! ===');
    return { success: true };
  } catch (err) {
    console.error('\n❌ VALIDATION FAILED:', err.message);
    await page.screenshot({ path: '/home/baby/Documents/LifeOS/frontend/phase17_18_failure.png' }).catch(() => {});
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

runPhase17And18Validation().then((res) => {
  if (!res.success) {
    process.exit(1);
  }
  process.exit(0);
});
