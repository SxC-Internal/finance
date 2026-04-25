# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Finance Dashboard >> should verify all stat cards display sparkline charts
- Location: e2e/dashboard.spec.ts:260:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e7]: "*"
      - heading "Hello StudentsXCeos!" [level=1] [ref=e8]:
        - text: Hello
        - text: StudentsXCeos!
        - img [ref=e9]
      - paragraph [ref=e14]: Streamline your departmental reviews. Access finance, operations, marketing, and HR data in one centralized hub.
      - generic [ref=e15]: © 2026 StudentsXCeos. All rights reserved.
    - generic [ref=e17]:
      - generic [ref=e19]:
        - text: StudentsXCeos Internal
        - generic [ref=e20]: S
      - heading "Member Login" [level=2] [ref=e21]
      - paragraph [ref=e22]: Sign in with your organizational Google account to access the dashboard.
      - button "Continue with Google" [ref=e23]:
        - img [ref=e24]
        - text: Continue with Google
  - generic "Notifications"
  - button "Open Next.js Dev Tools" [ref=e34] [cursor=pointer]:
    - img [ref=e35]
  - alert [ref=e39]
```

# Test source

```ts
  162 |     await expect(overviewTab).toHaveAttribute('data-state', 'active');
  163 |   });
  164 | 
  165 |   test('should be responsive at 360px width (mobile)', async ({ page }) => {
  166 |     // Set viewport to mobile
  167 |     await page.setViewportSize({ width: 360, height: 800 });
  168 | 
  169 |     // Login
  170 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  171 |     await page.locator('input[type="password"]').fill('password');
  172 |     await page.locator('button:has-text("Sign In")').click();
  173 |     await page.waitForLoadState('networkidle');
  174 | 
  175 |     // Verify key elements are still visible on mobile
  176 |     const greeting = page.locator('h2:has-text("Welcome back")');
  177 |     await expect(greeting).toBeVisible();
  178 | 
  179 |     // Stat cards should still be visible (may be single column)
  180 |     const firstCard = page.locator('text=Income').first();
  181 |     await expect(firstCard).toBeVisible();
  182 | 
  183 |     // Chart should be visible
  184 |     const chartTitle = page.locator('text=Performance Overview');
  185 |     await expect(chartTitle).toBeVisible();
  186 | 
  187 |     // No overflow should occur - check page width matches viewport
  188 |     const mainContent = page.locator('main');
  189 |     const boundingBox = await mainContent.boundingBox();
  190 |     expect(boundingBox?.width).toBeLessThanOrEqual(360);
  191 |   });
  192 | 
  193 |   test('should be responsive at 1280px width (desktop)', async ({ page }) => {
  194 |     // Set viewport to desktop
  195 |     await page.setViewportSize({ width: 1280, height: 720 });
  196 | 
  197 |     // Login
  198 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  199 |     await page.locator('input[type="password"]').fill('password');
  200 |     await page.locator('button:has-text("Sign In")').click();
  201 |     await page.waitForLoadState('networkidle');
  202 | 
  203 |     // Verify layout is fully visible
  204 |     const greeting = page.locator('h2:has-text("Welcome back")');
  205 |     await expect(greeting).toBeVisible();
  206 | 
  207 |     // Verify 4 stat cards are displayed in a grid (lg:grid-cols-4)
  208 |     const cardGrid = page.locator('div[class*="grid"]');
  209 |     const cards = cardGrid.locator('div[class*="Card"], [class*="stat"]');
  210 |     const cardCount = await cards.count();
  211 |     expect(cardCount).toBeGreaterThanOrEqual(4);
  212 | 
  213 |     // Chart should be fully visible
  214 |     const chartContainer = page.locator('text=Performance Overview').locator('xpath=..').locator('xpath=..');
  215 |     const chartBoundingBox = await chartContainer.boundingBox();
  216 |     expect(chartBoundingBox).toBeTruthy();
  217 |   });
  218 | 
  219 |   test('should take screenshot of 1280px desktop view', async ({ page }) => {
  220 |     // Set viewport to desktop
  221 |     await page.setViewportSize({ width: 1280, height: 720 });
  222 | 
  223 |     // Login
  224 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  225 |     await page.locator('input[type="password"]').fill('password');
  226 |     await page.locator('button:has-text("Sign In")').click();
  227 |     await page.waitForLoadState('networkidle');
  228 | 
  229 |     // Wait a bit for all content to render
  230 |     await page.waitForTimeout(1000);
  231 | 
  232 |     // Take screenshot
  233 |     await page.screenshot({ path: 'dashboard-desktop-1280px.png', fullPage: false });
  234 | 
  235 |     // Verify screenshot was created and has reasonable size
  236 |     const fs = await import('fs');
  237 |     const exists = fs.existsSync('dashboard-desktop-1280px.png');
  238 |     expect(exists).toBe(true);
  239 | 
  240 |     // Log path for user reference
  241 |     console.log('Dashboard screenshot saved to: /home/kenny/personal/github-clones/finance/dashboard-desktop-1280px.png');
  242 |   });
  243 | 
  244 |   test('should display Date Range button and Export Report button (manager)', async ({ page }) => {
  245 |     // Login as finance lead (has manager access)
  246 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  247 |     await page.locator('input[type="password"]').fill('password');
  248 |     await page.locator('button:has-text("Sign In")').click();
  249 |     await page.waitForLoadState('networkidle');
  250 | 
  251 |     // Verify Date Range button
  252 |     const dateRangeButton = page.locator('button:has-text("Date Range")');
  253 |     await expect(dateRangeButton).toBeVisible();
  254 | 
  255 |     // Verify Export Report button (only for managers)
  256 |     const exportButton = page.locator('button:has-text("Export Report")');
  257 |     await expect(exportButton).toBeVisible();
  258 |   });
  259 | 
  260 |   test('should verify all stat cards display sparkline charts', async ({ page }) => {
  261 |     // Login
> 262 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
      |                                               ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  263 |     await page.locator('input[type="password"]').fill('password');
  264 |     await page.locator('button:has-text("Sign In")').click();
  265 |     await page.waitForLoadState('networkidle');
  266 | 
  267 |     // Find all stat card containers
  268 |     const statCardContainers = page.locator('[class*="grid-cols"]').first();
  269 | 
  270 |     // Each stat card should have an SVG (sparkline)
  271 |     const sparklines = statCardContainers.locator('svg');
  272 |     const sparklineCount = await sparklines.count();
  273 | 
  274 |     // Should have sparklines for each stat card (at least 4)
  275 |     expect(sparklineCount).toBeGreaterThanOrEqual(4);
  276 | 
  277 |     // Verify sparklines have paths (actual chart data)
  278 |     const paths = statCardContainers.locator('path');
  279 |     const pathCount = await paths.count();
  280 |     expect(pathCount).toBeGreaterThan(0);
  281 |   });
  282 | 
  283 |   test('should display activity feed with 12+ items compactly', async ({ page }) => {
  284 |     // Login
  285 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  286 |     await page.locator('input[type="password"]').fill('password');
  287 |     await page.locator('button:has-text("Sign In")').click();
  288 |     await page.waitForLoadState('networkidle');
  289 | 
  290 |     // Look for activity feed - it should be in the layout
  291 |     // Activity feed typically shows recent actions
  292 |     const activityFeedHeading = page.locator('text=/Activity|Recent/i');
  293 | 
  294 |     if (await activityFeedHeading.count() > 0) {
  295 |       // If activity feed is present, verify it shows multiple items
  296 |       const activityItems = page.locator('[class*="activity"], [class*="item"]').filter({
  297 |         has: page.locator('text')
  298 |       });
  299 | 
  300 |       // Should show at least some activity items
  301 |       const itemCount = await activityItems.count();
  302 |       console.log(`Activity items found: ${itemCount}`);
  303 |     }
  304 | 
  305 |     // Dashboard should load without excessive scrolling in main content
  306 |     const mainScroll = page.locator('main');
  307 |     const scrollHeight = await mainScroll.evaluate(el => el.scrollHeight);
  308 |     const clientHeight = await mainScroll.evaluate(el => el.clientHeight);
  309 | 
  310 |     // Verify content doesn't require excessive scrolling
  311 |     console.log(`Main content scroll height: ${scrollHeight}, client height: ${clientHeight}`);
  312 |   });
  313 | 
  314 |   test('should load without errors and verify no console errors', async ({ page }) => {
  315 |     const errors: string[] = [];
  316 | 
  317 |     // Capture console errors
  318 |     page.on('console', msg => {
  319 |       if (msg.type() === 'error') {
  320 |         errors.push(msg.text());
  321 |       }
  322 |     });
  323 | 
  324 |     // Login
  325 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  326 |     await page.locator('input[type="password"]').fill('password');
  327 |     await page.locator('button:has-text("Sign In")').click();
  328 |     await page.waitForLoadState('networkidle');
  329 | 
  330 |     // Wait for dashboard content to fully render
  331 |     await page.waitForTimeout(1000);
  332 | 
  333 |     // Verify no critical errors occurred
  334 |     const criticalErrors = errors.filter(err =>
  335 |       !err.includes('DevTools') &&
  336 |       !err.includes('ResizeObserver') &&
  337 |       !err.includes('Warning:')
  338 |     );
  339 | 
  340 |     console.log('Console errors:', criticalErrors);
  341 |     // Some warnings are acceptable, but critical errors should be none
  342 |     expect(criticalErrors.length).toBeLessThan(3);
  343 |   });
  344 | });
  345 | 
```