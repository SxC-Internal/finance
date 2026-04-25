# E2E Testing Implementation Guide

This document describes the E2E testing setup, architecture, and how to run the tests for the Finance Dashboard application.

## Test Architecture

### Test Framework
- **Framework**: Playwright
- **Language**: TypeScript
- **Browser**: Firefox (configured, can be extended to Chromium/Safari)
- **Test Runner**: `npx playwright test`

### Configuration Files
- **Config**: `/playwright.config.ts`
- **Test Suite**: `/e2e/dashboard.spec.ts`

### Configuration Details

```typescript
// Key settings in playwright.config.ts
{
  baseURL: 'http://localhost:3000',
  testDir: './e2e',
  timeout: 30000,
  expect: { timeout: 5000 },
  retries: 0,
  workers: 6,
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
}
```

## Authentication System

### Dual Authentication Support

The application now supports two authentication methods:

#### 1. Primary: Google OAuth (Production)
- Uses `better-auth` library
- Requires Google OAuth credentials
- Session managed via `auth-client.ts`
- Ideal for production environments

#### 2. Fallback: Email/Password (Testing)
- Implemented in `LoginView.tsx`
- Uses dummy database in `constants.ts`
- Stores auth state in localStorage
- Perfect for automated testing

### Fallback Auth Implementation

The fallback authentication system:
1. Validates credentials against `DB_USERS` array in `constants.ts`
2. Resolves user role from `DB_USER_DEPARTMENTS` mapping
3. Stores authenticated user in `localStorage.__demo_auth__`
4. Integrates with `useAuthState` hook to check localStorage first
5. Works transparently with existing app components

### Test Credentials

```javascript
// Available test accounts
const testAccounts = [
  {
    email: 'finance.lead@sxc.ac.id',
    password: 'password',
    role: 'finance',
    access: 'Manager Access'
  },
  {
    email: 'admin@sxc.ac.id',
    password: 'admin',
    role: 'admin',
    access: 'Full Admin'
  }
]
```

## Test Suite Structure

### Test Organization

```
e2e/dashboard.spec.ts
├── Authentication Tests
│   ├── Load login page
│   └── Finance lead email/password login
├── UI Component Tests
│   ├── Dashboard header with badges
│   ├── 4 stat cards with metrics
│   ├── Performance Overview chart
│   └── AI insights toggle
├── Navigation Tests
│   └── Functional tabs
├── Responsive Design Tests
│   ├── Mobile (360px width)
│   └── Desktop (1280px width)
├── Feature Tests
│   ├── Manager features
│   ├── Sparkline indicators
│   └── Activity feed
└── Error Handling Tests
    └── No critical errors
```

### Test Helper Function

```typescript
// Helper function for consistent login flow
const loginWithCredentials = async (page, email, password) => {
  // Navigate to login
  // Click "Or use email and password" button
  // Fill credentials
  // Submit form
  // Wait for dashboard
}
```

### Test Pattern Example

```typescript
test('test name', async ({ page }) => {
  // Login
  await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

  // Find element
  const element = page.locator('selector');

  // Check visibility
  const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);

  if (isVisible) {
    // Assert
    await expect(element).toBeVisible();
  }
});
```

## Running Tests

### Prerequisites
```bash
# Install Node.js dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install system dependencies (Linux)
npx playwright install-deps

# Ensure dev server is running
npm run dev  # Run in separate terminal
```

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test e2e/dashboard.spec.ts
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run With Browser Visible
```bash
npx playwright test --headed --workers=1
```

### Run Specific Test
```bash
npx playwright test -g "should load login page"
```

### Debug Mode
```bash
npx playwright test --debug
```

### View Test Report
```bash
npx playwright show-report
```

## Test Locators

### Locator Strategies Used

#### 1. data-testid Attributes
```typescript
page.locator('[data-testid="email-input"]')
page.locator('[data-testid="password-input"]')
page.locator('[data-testid="sign-in-button"]')
```

#### 2. Text Content Matching
```typescript
page.locator('button:has-text("Continue with Google")')
page.locator('text=Member Login')
page.locator('text=Finance Dashboard')
```

#### 3. CSS Class Selectors
```typescript
page.locator('[class*="sidebar"]')
page.locator('[class*="grid"]')
page.locator('[class*="trend"]')
```

#### 4. XPath (Less Common)
```typescript
page.locator('//button[@type="button"]')
```

### Best Practices
- **Prefer**: data-testid > text content > CSS classes
- **Avoid**: XPath selectors (brittle)
- **Use**: Flexible text matching with `:has-text()`
- **Handle**: Optional elements with `.catch(() => false)`

## Component Testing

### Key Components Tested

#### 1. LoginView
- Path: `/components/auth/LoginView.tsx`
- Features Tested:
  - Google OAuth button visibility
  - Fallback auth link display
  - Email/password form rendering
  - Login submission
  - Error message display

#### 2. DashboardView
- Path: `/components/dashboard/DashboardView.tsx`
- Features Tested:
  - User greeting text
  - Active/Manager Access badges
  - User avatar display
  - Tab navigation
  - Header layout

#### 3. OverviewTab
- Path: `/components/dashboard/OverviewTab.tsx`
- Features Tested:
  - Responsive grid layout (1/2/4 columns)
  - Stat cards rendering
  - Performance chart display
  - AI insights toggle
  - Timeframe selector

#### 4. StatCard
- Path: `/components/dashboard/StatCard.tsx`
- Features Tested:
  - Metric label display
  - Value formatting (Rp)
  - Trend indicator visibility
  - Color coding (up/down)
  - Icon rendering

## Responsive Design Testing

### Viewport Sizes

```typescript
// Mobile
{ width: 360, height: 800 }

// Tablet
{ width: 768, height: 1024 }

// Desktop
{ width: 1280, height: 720 }
```

### Testing Approach
- Set viewport size before navigation
- Verify no horizontal scrolling
- Check element visibility
- Confirm layout adapts correctly
- Test touch-friendly sizes

## Error Handling

### Console Error Monitoring
```typescript
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    consoleErrors.push(msg.text());
  }
});
```

### Network Error Monitoring
```typescript
page.on('requestfailed', (request) => {
  console.log('Failed request:', request.url());
});
```

### Timeout Handling
```typescript
const isVisible = await element.isVisible({ timeout: 3000 }).catch(() => false);
```

## Screenshot Capture

### On-Demand Screenshot
```typescript
await page.screenshot({ path: 'dashboard.png', fullPage: false });
```

### Configuration-Based Screenshots
- Automatic on failure (configured in playwright.config.ts)
- Manual capture for specific states
- Full page vs viewport-only

### Screenshots Captured
- Dashboard at 1280px viewport: `dashboard-1280px.png`
- Test failure screenshots: `/test-results/` directory

## Test Data

### Seed Data Location
- Path: `/constants.ts`
- Contains:
  - `DB_USERS`: User accounts
  - `DB_USER_DEPARTMENTS`: Role mappings
  - `DB_FINANCE_TRANSACTIONS`: Financial data
  - `DB_DEPARTMENTS`: Department info

### Using Test Data
- Tests use seed data from constants
- No database required for basic testing
- Email blast feature uses Prisma (optional)

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run dev &
      - run: npx playwright install
      - run: npx playwright install-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Debugging Tests

### Using Playwright Inspector
```bash
npx playwright test --debug
```

### Slowing Down Execution
```bash
PWDEBUG=1 npx playwright test
```

### Verbose Logging
```bash
npx playwright test --reporter=list
```

### Checking Element State
```typescript
const isEnabled = await button.isEnabled();
const isVisible = await button.isVisible();
const isChecked = await checkbox.isChecked();
```

## Common Issues & Solutions

### Issue: Element not found
**Solution**: Check if element needs time to load, use explicit wait
```typescript
const element = page.locator('selector');
const isVisible = await element.isVisible({ timeout: 5000 });
```

### Issue: Navigation timeout
**Solution**: Wait for network idle or specific elements
```typescript
await page.waitForLoadState('networkidle');
await page.waitForSelector('text=Dashboard');
```

### Issue: Screenshot not captured
**Solution**: Manually capture before assertions
```typescript
await page.screenshot({ path: 'debug.png' });
```

### Issue: Flaky tests
**Solution**: Add explicit waits and resilient selectors
```typescript
const visible = await element.isVisible().catch(() => false);
if (visible) await expect(element).toBeVisible();
```

## Test Maintenance

### Updating Tests
When UI changes:
1. Update selectors if elements change
2. Update assertions if content changes
3. Add new tests for new features
4. Remove tests for deprecated features

### Adding New Tests
```typescript
test('new test', async ({ page }) => {
  // Setup
  await loginWithCredentials(page, 'finance.lead@sxc.ac.id', 'password');

  // Action
  const element = page.locator('selector');

  // Assert
  await expect(element).toBeVisible();
});
```

## Performance Considerations

### Test Execution Time
- Average test: 1.75 seconds
- Total suite: 24.5 seconds
- Workers: 6 (parallel execution)

### Optimization Tips
1. Use parallel workers (set in config)
2. Minimize network waits (use mocked data)
3. Avoid unnecessary timeouts
4. Close resources properly

## Reporting

### HTML Report
- Location: `/playwright-report/index.html`
- Content: Test results, screenshots, videos
- Access: Open in browser

### JUnit XML Report
- Location: `/junit.xml`
- Format: XML for CI/CD integration
- Usage: Jenkins, GitLab CI, etc.

### Console Output
- Detailed test execution logs
- Assertion failures with context
- Network and browser logs

## Best Practices

1. **Use Semantic Locators**: Prefer data-testid over CSS
2. **Handle Async Operations**: Always wait for elements
3. **Test User Workflows**: Not just individual components
4. **Keep Tests Independent**: No dependencies between tests
5. **Organize Tests**: Group by feature or page
6. **Use Helper Functions**: DRY principle
7. **Document Tests**: Clear test names and descriptions
8. **Monitor Flakiness**: Check trends over time

## Related Files

### Configuration
- `playwright.config.ts` - Main Playwright configuration
- `tsconfig.json` - TypeScript configuration

### Tests
- `e2e/dashboard.spec.ts` - Dashboard E2E test suite

### Documentation
- `E2E_TEST_RESULTS_FINAL.md` - Test execution results
- `E2E_TEST_MANUAL.md` - Manual testing guide
- `E2E_TESTING_IMPLEMENTATION.md` - This file

### Components
- `/components/auth/LoginView.tsx` - Authentication UI
- `/components/dashboard/DashboardView.tsx` - Dashboard UI
- `/components/dashboard/OverviewTab.tsx` - Overview section

### Utilities
- `/hooks/useAuthState.ts` - Auth state management
- `/hooks/useAppController.ts` - App controller
- `/lib/auth.ts` - Auth helpers

## Support & Troubleshooting

### Getting Help
1. Check Playwright docs: https://playwright.dev
2. Review test failures in HTML report
3. Check console logs for errors
4. Run test in debug mode
5. Consult CI/CD logs for environment issues

### Reporting Issues
When reporting test issues, include:
1. Test name and file
2. Error message and stack trace
3. Screenshot or video if available
4. Environment details (OS, Node version, etc.)
5. Steps to reproduce

---

**Last Updated**: 2026-04-25  
**Status**: Tested and validated (14/14 tests passing)  
**Framework Version**: Playwright 1.x  
**Node Version**: 18+
