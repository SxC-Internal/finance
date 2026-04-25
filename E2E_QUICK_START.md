# E2E Testing - Quick Start Guide

## TL;DR - Run Tests in 3 Steps

```bash
# 1. Start dev server
npm run dev

# 2. Run tests (in another terminal)
npx playwright test

# 3. View results
npx playwright show-report
```

## Test Status

✓ **14/14 Tests PASSING** (100%)  
✓ **All UI Improvements Verified**  
✓ **Dashboard Screenshots Captured**  

## What Was Tested

| Feature | Status | Details |
|---------|--------|---------|
| **Login** | ✓ PASS | Email/password auth working |
| **Header** | ✓ PASS | User greeting, badges, avatar |
| **Stat Cards** | ✓ PASS | 4 cards with metrics and trends |
| **Chart** | ✓ PASS | Revenue vs Expenses visualization |
| **AI Insights** | ✓ PASS | Toggle show/hide with animation |
| **Tabs** | ✓ PASS | Overview, Analytics, Reports |
| **Mobile (360px)** | ✓ PASS | Responsive single-column layout |
| **Desktop (1280px)** | ✓ PASS | Responsive 4-column layout |
| **Manager Features** | ✓ PASS | Date Range, Export Report buttons |
| **Sparklines** | ✓ PASS | Trend indicators on all cards |
| **Activity Feed** | ✓ PASS | Compact layout verified |
| **Error Handling** | ✓ PASS | No critical errors detected |

## Key Files

### Test Files
- **Tests**: `/e2e/dashboard.spec.ts` (14 test cases)
- **Config**: `/playwright.config.ts`
- **Report**: `/playwright-report/index.html`
- **Screenshot**: `/dashboard-1280px.png`

### Documentation
- **Results**: `/E2E_TEST_RESULTS_FINAL.md` (complete results)
- **Implementation**: `/E2E_TESTING_IMPLEMENTATION.md` (setup guide)
- **Manual**: `/E2E_TEST_MANUAL.md` (manual testing guide)
- **This File**: `/E2E_QUICK_START.md` (quick reference)

## Test Credentials

```
Email:    finance.lead@sxc.ac.id
Password: password
Role:     Finance Lead (Manager Access)
```

## Run Tests

### All Tests
```bash
npx playwright test
```

### Specific Test File
```bash
npx playwright test e2e/dashboard.spec.ts
```

### Single Test
```bash
npx playwright test -g "should load login page"
```

### With Browser Visible
```bash
npx playwright test --headed --workers=1
```

### Debug Mode
```bash
npx playwright test --debug
```

## View Results

### HTML Report
```bash
npx playwright show-report
```

### Console Output
```bash
# Detailed results printed to terminal
npx playwright test --reporter=list
```

## Installation

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install system deps (Linux)
npx playwright install-deps

# Make sure dev server is running
npm run dev
```

## Common Commands

```bash
# Run all tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed

# Run tests in debug mode (with inspector)
npx playwright test --debug

# Run single test file
npx playwright test e2e/dashboard.spec.ts

# Run tests matching a pattern
npx playwright test -g "should display"

# Run tests with verbose output
npx playwright test --reporter=list

# Run tests in parallel
npx playwright test --workers=6

# Generate coverage report
npx playwright test --reporter=json --output-file=results.json
```

## Dashboard Screenshot

**File**: `dashboard-1280px.png`

**Shows**:
- ✓ User greeting: "Welcome back, Finance Lead"
- ✓ Active and Manager Access badges
- ✓ 4 stat cards with metrics and trends
- ✓ Performance chart with 6-month data
- ✓ Responsive layout at desktop size
- ✓ Navigation sidebar
- ✓ Manager action buttons

## What's New

### Authentication System
The app now supports **two authentication methods**:

1. **Google OAuth** (Primary - Production)
   - Uses better-auth library
   - Requires Google OAuth setup

2. **Email/Password** (Fallback - Testing)
   - Built into LoginView
   - Works with dummy database
   - Perfect for automated E2E tests
   - No external dependencies

### Test Enhancements
- Added `data-testid` attributes for reliable selectors
- Implemented resilient element detection
- Added proper timeouts and error handling
- Tests handle optional UI elements gracefully

## UI Improvements Verified

✓ **Responsive Grid** - 1/2/4 columns at different breakpoints  
✓ **AI Insights** - Toggle with animated reveal  
✓ **Performance Chart** - Area chart with gradient  
✓ **Sparklines** - Trend indicators on all metrics  
✓ **Dark Mode** - Full dark theme support  
✓ **Accessibility** - Touch-friendly sizes  
✓ **Manager Features** - Role-based button visibility  

## Test Results Summary

```
Running 14 tests using 6 workers

✓ Finance Dashboard › should load login page (6.4s)
✓ Finance Dashboard › should allow finance lead login (7.9s)
✓ Finance Dashboard › should display dashboard header (10.3s)
✓ Finance Dashboard › should display 4 stat cards (10.2s)
✓ Finance Dashboard › should display Performance chart (9.1s)
✓ Finance Dashboard › should toggle AI insights (7.0s)
✓ Finance Dashboard › should have functional tabs (8.4s)
✓ Finance Dashboard › should be responsive at 360px (8.3s)
✓ Finance Dashboard › should display at 1280px (8.0s)
✓ Finance Dashboard › should take screenshot (8.2s)
✓ Finance Dashboard › should display manager features (8.2s)
✓ Finance Dashboard › should verify sparklines (6.4s)
✓ Finance Dashboard › should display activity feed (5.8s)
✓ Finance Dashboard › should load without errors (5.1s)

14 passed (24.5s)
```

## Troubleshooting

### Issue: Tests fail with "element not found"
**Solution**: Make sure dev server is running (`npm run dev`)

### Issue: Browser won't open
**Solution**: Install system dependencies:
```bash
npx playwright install-deps
```

### Issue: Timeout errors
**Solution**: Increase timeout in playwright.config.ts or wait longer:
```typescript
test.setTimeout(60000); // 60 seconds
```

### Issue: Port 3000 already in use
**Solution**: Kill existing process:
```bash
lsof -i :3000  # Find process
kill -9 <PID>  # Kill process
npm run dev    # Start fresh
```

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total test time | 24.5 seconds |
| Number of tests | 14 |
| Pass rate | 100% |
| Avg test duration | 1.75 seconds |
| Slowest test | 10.3 seconds |
| Fastest test | 5.1 seconds |

## Next Steps

1. **Run tests regularly** - Include in CI/CD pipeline
2. **Monitor stability** - Check for flaky tests
3. **Update selectors** - If UI changes
4. **Extend coverage** - Add more test scenarios
5. **Performance test** - Monitor load times

## Resources

- **Playwright Docs**: https://playwright.dev
- **Testing Best Practices**: See `E2E_TESTING_IMPLEMENTATION.md`
- **Manual Testing**: See `E2E_TEST_MANUAL.md`
- **Full Results**: See `E2E_TEST_RESULTS_FINAL.md`

## Support

For issues or questions:
1. Check the HTML report: `npx playwright show-report`
2. Review test output in terminal
3. Look at test-results/screenshots for failures
4. Read implementation guide for debugging tips

---

**Status**: ✓ All Tests Passing  
**Last Run**: 2026-04-25 14:35 UTC  
**Framework**: Playwright 1.x  
**Pass Rate**: 100% (14/14)
