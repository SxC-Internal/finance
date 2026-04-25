# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Finance Dashboard >> should load login page and allow finance lead login
- Location: e2e/dashboard.spec.ts:10:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="email"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Finance Dashboard', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to login page
  6   |     await page.goto('/');
  7   |     await page.waitForLoadState('networkidle');
  8   |   });
  9   | 
  10  |   test('should load login page and allow finance lead login', async ({ page }) => {
  11  |     // Verify login form is visible
  12  |     const emailInput = page.locator('input[type="email"]');
  13  |     const passwordInput = page.locator('input[type="password"]');
  14  |     const loginButton = page.locator('button:has-text("Sign In")');
  15  | 
> 16  |     await expect(emailInput).toBeVisible();
      |                              ^ Error: expect(locator).toBeVisible() failed
  17  |     await expect(passwordInput).toBeVisible();
  18  |     await expect(loginButton).toBeVisible();
  19  | 
  20  |     // Perform login
  21  |     await emailInput.fill('finance.lead@sxc.ac.id');
  22  |     await passwordInput.fill('password');
  23  |     await loginButton.click();
  24  | 
  25  |     // Wait for dashboard to load
  26  |     await page.waitForLoadState('networkidle');
  27  | 
  28  |     // Verify we're on dashboard
  29  |     await expect(page).toHaveURL('/');
  30  |   });
  31  | 
  32  |   test('should display dashboard header with user greeting and badges', async ({ page }) => {
  33  |     // Login
  34  |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  35  |     await page.locator('input[type="password"]').fill('password');
  36  |     await page.locator('button:has-text("Sign In")').click();
  37  |     await page.waitForLoadState('networkidle');
  38  | 
  39  |     // Verify header elements
  40  |     const greeting = page.locator('h2:has-text("Welcome back")');
  41  |     await expect(greeting).toBeVisible();
  42  | 
  43  |     // Check for Active badge
  44  |     const activeBadge = page.locator('span:has-text("Active")');
  45  |     await expect(activeBadge).toBeVisible();
  46  | 
  47  |     // Check for Manager Access badge (finance lead should have it)
  48  |     const managerBadge = page.locator('text=Manager Access');
  49  |     await expect(managerBadge).toBeVisible();
  50  | 
  51  |     // Verify avatar is visible
  52  |     const avatar = page.locator('img[alt="User"]');
  53  |     await expect(avatar).toBeVisible();
  54  |   });
  55  | 
  56  |   test('should display 4 stat cards with metrics', async ({ page }) => {
  57  |     // Login
  58  |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  59  |     await page.locator('input[type="password"]').fill('password');
  60  |     await page.locator('button:has-text("Sign In")').click();
  61  |     await page.waitForLoadState('networkidle');
  62  | 
  63  |     // Wait for Overview tab to be active
  64  |     const overviewTab = page.locator('button[value="overview"]');
  65  |     await expect(overviewTab).toHaveAttribute('data-state', 'active');
  66  | 
  67  |     // Verify stat cards are present
  68  |     const statCards = page.locator('[class*="stat-card"], [class*="Card"]').filter({ has: page.locator('svg') });
  69  |     const cardCount = await statCards.count();
  70  | 
  71  |     // Should have at least 4 stat cards (Income, Expenses, Net Profit, Active Programs)
  72  |     expect(cardCount).toBeGreaterThanOrEqual(4);
  73  | 
  74  |     // Verify first card has metrics
  75  |     const firstCard = page.locator('div:has-text("Income") >> first');
  76  |     await expect(firstCard).toBeVisible();
  77  | 
  78  |     // Check for metric values (Rp format)
  79  |     const metricValue = page.locator('text=/Rp \\d+/');
  80  |     const valueCount = await metricValue.count();
  81  |     expect(valueCount).toBeGreaterThanOrEqual(4);
  82  |   });
  83  | 
  84  |   test('should display monthly revenue vs expenses chart', async ({ page }) => {
  85  |     // Login
  86  |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  87  |     await page.locator('input[type="password"]').fill('password');
  88  |     await page.locator('button:has-text("Sign In")').click();
  89  |     await page.waitForLoadState('networkidle');
  90  | 
  91  |     // Verify chart is visible
  92  |     const chartTitle = page.locator('text=Performance Overview');
  93  |     await expect(chartTitle).toBeVisible();
  94  | 
  95  |     // Verify chart container with SVG (recharts)
  96  |     const chartSvg = page.locator('svg').filter({ has: page.locator('[class*="recharts"]') });
  97  |     const svgCount = await chartSvg.count();
  98  |     expect(svgCount).toBeGreaterThan(0);
  99  | 
  100 |     // Verify AI insights button
  101 |     const aiButton = page.locator('button:has-text("Explain with AI")');
  102 |     await expect(aiButton).toBeVisible();
  103 |   });
  104 | 
  105 |   test('should toggle AI insights visibility on Performance Overview', async ({ page }) => {
  106 |     // Login
  107 |     await page.locator('input[type="email"]').fill('finance.lead@sxc.ac.id');
  108 |     await page.locator('input[type="password"]').fill('password');
  109 |     await page.locator('button:has-text("Sign In")').click();
  110 |     await page.waitForLoadState('networkidle');
  111 | 
  112 |     // Find and click AI button
  113 |     const aiButton = page.locator('button:has-text("Explain with AI")');
  114 |     await expect(aiButton).toBeVisible();
  115 | 
  116 |     // Click to show insights
```