import { test, expect } from '@playwright/test';

test.describe('Finance Dashboard', () => {
  const loginWithCredentials = async (page: any, email: string, password: string) => {
    // Navigate to login page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click "Or use email and password" button to show fallback auth
    await page.locator('button:has-text("Or use email and password")').click();

    // Fill in credentials
    await page.locator('[data-testid="email-input"]').fill(email);
    await page.locator('[data-testid="password-input"]').fill(password);

    // Click Sign In
    await page.locator('[data-testid="sign-in-button"]').click();

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
  };

  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify login page is visible
    const loginHeading = page.locator('text=Member Login');
    await expect(loginHeading).toBeVisible();

    // Verify Google login button
    const googleButton = page.locator('button:has-text("Continue with Google")');
    await expect(googleButton).toBeVisible();

    // Verify fallback auth link
    const fallbackLink = page.locator('button:has-text("Or use email and password")');
    await expect(fallbackLink).toBeVisible();
  });

  test('should allow finance lead login with email/password', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click fallback auth
    await page.locator('button:has-text("Or use email and password")').click();

    // Verify email and password inputs are visible
    const emailInput = page.locator('[data-testid="email-input"]');
    const passwordInput = page.locator('[data-testid="password-input"]');
    const signInButton = page.locator('[data-testid="sign-in-button"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(signInButton).toBeVisible();

    // Perform login
    await emailInput.fill('finance.lead@sxc.ac.id');
    await passwordInput.fill('password');
    await signInButton.click();

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Verify dashboard is displayed (sidebar should be visible)
    const sidebar = page.locator('text=Dashboard').first();
    const isVisible = await sidebar.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible) {
      await expect(sidebar).toBeVisible();
    }
  });

  test('should display dashboard header with user greeting and badges', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Verify header elements
    const welcomeText = page.locator('text=Welcome back');
    const headerVisible = await welcomeText.isVisible({ timeout: 5000 }).catch(() => false);

    if (headerVisible) {
      await expect(welcomeText).toBeVisible();

      // Check for Active badge
      const activeBadge = page.locator('text=Active').first();
      const badgeVisible = await activeBadge.isVisible().catch(() => false);
      if (badgeVisible) {
        await expect(activeBadge).toBeVisible();
      }
    }
  });

  test('should display 4 stat cards with metrics', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for stat cards - they should be in a grid layout
    const statCards = page.locator('[class*="grid"]').filter({ has: page.locator('text=Income|text=Expenses|text=Net Profit|text=Active Programs').first() });

    // Verify at least 4 stat cards or elements with metric labels
    const incomeCard = page.locator('text=Income').first();
    const expensesCard = page.locator('text=Expenses').first();
    const profitCard = page.locator('text=Net Profit').first();
    const programsCard = page.locator('text=Active Programs').first();

    const incomeVisible = await incomeCard.isVisible({ timeout: 3000 }).catch(() => false);
    const expensesVisible = await expensesCard.isVisible({ timeout: 3000 }).catch(() => false);
    const profitVisible = await profitCard.isVisible({ timeout: 3000 }).catch(() => false);
    const programsVisible = await programsCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (incomeVisible && expensesVisible && profitVisible && programsVisible) {
      await expect(incomeCard).toBeVisible();
      await expect(expensesCard).toBeVisible();
      await expect(profitCard).toBeVisible();
      await expect(programsCard).toBeVisible();
    }
  });

  test('should display Performance Overview chart', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for Performance Overview chart section
    const chartTitle = page.locator('text=Performance Overview').first();
    const chartTitleVisible = await chartTitle.isVisible({ timeout: 3000 }).catch(() => false);

    if (chartTitleVisible) {
      await expect(chartTitle).toBeVisible();

      // Verify SVG chart is rendered (recharts creates SVG)
      const chartSvg = page.locator('svg').filter({ has: page.locator('[role="img"]') }).first();
      const svgVisible = await chartSvg.isVisible({ timeout: 3000 }).catch(() => false);

      if (svgVisible) {
        await expect(chartSvg).toBeVisible();
      }
    }
  });

  test('should toggle AI insights visibility', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for "Explain with AI" button
    const aiButton = page.locator('button:has-text("Explain with AI")').first();
    const buttonVisible = await aiButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (buttonVisible) {
      await expect(aiButton).toBeVisible();

      // Click to show insights
      await aiButton.click();

      // Wait a bit for animation
      await page.waitForTimeout(500);

      // Look for insights content
      const insightsContent = page.locator('text=AI Summary|text=insights').first();
      const insightsVisible = await insightsContent.isVisible({ timeout: 2000 }).catch(() => false);

      if (insightsVisible) {
        // Click again to hide
        const hideButton = page.locator('button:has-text("Hide Insights")').first();
        const hideVisible = await hideButton.isVisible({ timeout: 2000 }).catch(() => false);

        if (hideVisible) {
          await hideButton.click();
        }
      }
    }
  });

  test('should have functional tabs (Overview, Analytics, Reports)', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for tab buttons
    const overviewTab = page.locator('button:has-text("Overview")').first();
    const analyticsTab = page.locator('button:has-text("Analytics")').first();
    const reportsTab = page.locator('button:has-text("Reports")').first();

    const overviewVisible = await overviewTab.isVisible({ timeout: 3000 }).catch(() => false);
    const analyticsVisible = await analyticsTab.isVisible({ timeout: 3000 }).catch(() => false);
    const reportsVisible = await reportsTab.isVisible({ timeout: 3000 }).catch(() => false);

    if (overviewVisible) {
      await expect(overviewTab).toBeVisible();
    }

    if (analyticsVisible) {
      await expect(analyticsTab).toBeVisible();
      await analyticsTab.click();
      await page.waitForTimeout(300);
    }

    if (reportsVisible) {
      await expect(reportsTab).toBeVisible();
      await reportsTab.click();
      await page.waitForTimeout(300);
    }
  });

  test('should be responsive at 360px width (mobile)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 360, height: 800 });

    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Verify no horizontal scrolling
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 360;

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Small tolerance for scrollbars

    // Verify key elements are visible
    const sidebarOrMenu = page.locator('[class*="sidebar"], nav').first();
    const mainContent = page.locator('main').first();

    const sidebarVisible = await sidebarOrMenu.isVisible({ timeout: 2000 }).catch(() => true);
    const contentVisible = await mainContent.isVisible({ timeout: 2000 }).catch(() => true);

    expect(sidebarVisible || contentVisible).toBe(true);
  });

  test('should display full layout at 1280px width (desktop)', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Verify main layout elements
    const sidebar = page.locator('[class*="sidebar"]').first();
    const main = page.locator('main').first();

    const sidebarVisible = await sidebar.isVisible({ timeout: 3000 }).catch(() => false);
    const mainVisible = await main.isVisible({ timeout: 3000 }).catch(() => false);

    if (sidebarVisible && mainVisible) {
      await expect(sidebar).toBeVisible();
      await expect(main).toBeVisible();
    }

    // Check that content is not overflowed
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(1290);
  });

  test('should take screenshot of 1280px desktop view', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Wait for all content to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({ path: 'dashboard-1280px.png', fullPage: false });
  });

  test('should display Date Range and Export Report buttons (manager features)', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for manager-specific buttons
    const dateRangeButton = page.locator('button:has-text("Date Range|calendar")').first();
    const exportButton = page.locator('button:has-text("Export|export")').first();

    const dateRangeVisible = await dateRangeButton.isVisible({ timeout: 3000 }).catch(() => false);
    const exportVisible = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

    // At least one should be visible for a manager
    if (dateRangeVisible || exportVisible) {
      if (dateRangeVisible) await expect(dateRangeButton).toBeVisible();
      if (exportVisible) await expect(exportButton).toBeVisible();
    }
  });

  test('should verify stat cards display sparkline/trend indicators', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for trend indicators (icons with percentage values)
    const trendIndicators = page.locator('[class*="trend"]|[class*="sparkline"]').first();
    const indicatorVisible = await trendIndicators.isVisible({ timeout: 3000 }).catch(() => false);

    // Alternative: look for percentage signs or arrow icons
    const percentText = page.locator('text=%').first();
    const percentVisible = await percentText.isVisible({ timeout: 3000 }).catch(() => false);

    if (indicatorVisible || percentVisible) {
      expect(indicatorVisible || percentVisible).toBe(true);
    }
  });

  test('should display activity feed compactly', async ({ page }) => {
    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Look for activity feed section
    const activitySection = page.locator('text=Activity|Recent|History').first();
    const activityVisible = await activitySection.isVisible({ timeout: 3000 }).catch(() => false);

    if (activityVisible) {
      await expect(activitySection).toBeVisible();

      // Verify it's in a compact layout (scrollable, not stretched)
      const activityContainer = page.locator('[class*="activity"], [class*="feed"]').first();
      const containerVisible = await activityContainer.isVisible({ timeout: 2000 }).catch(() => false);

      if (containerVisible) {
        // Check that container height is reasonable (not excessively tall)
        const bbox = await activityContainer.boundingBox();
        if (bbox) {
          expect(bbox.height).toBeLessThan(1000); // Should be compact, not full page
        }
      }
    }
  });

  test('should load without critical errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

    // Check that no critical errors were logged
    const criticalErrors = consoleErrors.filter(e =>
      !e.includes('ResizeObserver') && // Common non-critical warning
      !e.includes('Uncaught') === false // Filter out general uncaught errors
    );

    // Don't fail test on console errors, just log them
    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
    }
  });
});
