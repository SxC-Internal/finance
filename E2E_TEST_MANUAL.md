# Finance Dashboard E2E Testing Guide

## Test Environment Setup

- **Application**: Next.js Finance Dashboard
- **Base URL**: http://localhost:3000
- **Dev Server**: Running on port 3000
- **Testing Framework**: Playwright (E2E tests in `/e2e/dashboard.spec.ts`)

## Test Credentials

- **Finance Lead**: finance.lead@sxc.ac.id / password (Has Manager Access)
- **Admin**: admin@sxc.ac.id / admin

## Critical User Journeys to Test

### 1. Authentication & Login Flow
- User navigates to http://localhost:3000
- Login form should be visible with email and password fields
- Verify login with finance.lead@sxc.ac.id credentials
- Dashboard should load after successful authentication

### 2. Dashboard Header Verification
Expected Elements:
- User greeting text ("Welcome back")
- Active badge (indicates user is logged in)
- Manager Access badge (for finance lead and managers)
- User avatar with initials fallback
- Date Range button (calendar icon)
- Export Report button (for managers only)

### 3. Stat Cards & Metrics Display
Expected Elements (4 main stat cards):
1. **Income** - Total revenue metric
2. **Expenses** - Total expenses metric
3. **Net Profit** - Profit calculation
4. **Active Programs** - Count of active programs

Each card should display:
- Metric label
- Numeric value in Rp (Indonesian Rupiah) format
- Sparkline chart (small inline chart showing trend)
- Optional trend indicator

### 4. Performance Overview Chart
Expected Elements:
- "Performance Overview" card with dark background
- Monthly revenue vs expenses area chart
- Chart title with "Explain with AI" button
- Timeframe selector (Last 7 Days, Last 30 Days, This Quarter)
- Recharts component rendering SVG with data

### 5. AI Insights Feature
Test the "Explain with AI" toggle:
- Button initially shows "Explain with AI"
- Clicking opens animated AI Summary section
- Shows role-specific insights (Finance, Ops, Marketing, HR, Tech)
- Button text changes to "Hide Insights"
- Clicking again hides the insights section
- Animation smooth with slide-in effect

### 6. Tab Navigation
Expected Tabs:
- Overview (default active)
- Analytics
- Reports

Verify:
- Each tab is clickable
- Active tab has correct styling
- Content updates when switching tabs
- No content overlap or display errors

### 7. Responsive Layout Testing

#### Mobile (360px width)
- Header elements stack appropriately
- Stat cards display in single column layout
- Chart is readable and not cut off
- No horizontal scrolling required
- Sidebar collapses or becomes mobile menu
- Touch-friendly spacing maintained

#### Desktop (1280px width)
- Stat cards display in 4-column grid (lg:grid-cols-4)
- Header spans full width
- Chart displays at proper height (350px)
- Sidebar visible alongside main content
- No content overflow or layout breaks

### 8. Visual Quality Checks
- All icons render correctly (Lucide icons)
- Colors match design tokens:
  - Primary: #071838 (dark blue)
  - Indigo: #4f46e5
  - White text on dark backgrounds
- Typography: Font sizes and weights correct
- Spacing: Consistent padding/margins
- Shadows: Subtle shadows for depth
- Dark mode support: Colors adjust appropriately

### 9. Chart Functionality
- SVG renders with recharts library
- XAxis shows month labels
- YAxis shows numeric values
- Tooltip appears on hover
- Area chart has gradient fill
- Line stroke visible and appropriately colored

### 10. Performance & Error Checks
- No console errors during load
- No network request failures
- Page loads within 3 seconds
- Animations are smooth (no jank)
- Memory usage remains stable
- No broken image links

## Running the Tests

### Option 1: Playwright (Automated)
```bash
# Install browser dependencies (if not installed)
npx playwright install-deps

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test e2e/dashboard.spec.ts

# Run tests in headed mode (see browser)
npx playwright test --headed

# View test report
npx playwright show-report
```

### Option 2: Manual Browser Testing
1. Start dev server: `npm run dev`
2. Navigate to http://localhost:3000 in your browser
3. Follow the test scenarios above
4. Verify each requirement is met
5. Take screenshots at key points (1280px viewport)

### Option 3: Visual Testing at Specific Viewports
```bash
# Open browser DevTools
# Set custom device (360px width, 800px height for mobile)
# Set custom device (1280px width, 720px height for desktop)
# Reload page and verify layout at each size
```

## Test Results Checklist

- [ ] Login successful with correct credentials
- [ ] Dashboard loads without errors
- [ ] Header displays user greeting, badges, and avatar
- [ ] All 4 stat cards visible with sparkline charts
- [ ] Performance Overview chart renders correctly
- [ ] AI Insights toggle works (show/hide)
- [ ] All 3 tabs (Overview, Analytics, Reports) are functional
- [ ] Mobile layout (360px) responsive and usable
- [ ] Desktop layout (1280px) full featured display
- [ ] All icons and colors render correctly
- [ ] No console errors or warnings (except known React Dev warnings)
- [ ] Animations are smooth
- [ ] All buttons are clickable and functional

## Screenshots to Capture

1. **Login Page** - Initial state at 1280px
2. **Dashboard Overview** - Full layout at 1280px (primary test)
3. **Mobile View** - Dashboard at 360px width
4. **AI Insights Open** - Performance Overview with insights visible
5. **Analytics Tab** - Verify analytics content loads
6. **Reports Tab** - Verify reports content loads

## Key Metrics

- **Page Load Time**: < 3 seconds
- **First Contentful Paint (FCP)**: < 2 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Pass Rate**: 100% of critical user journeys

## Known Issues & Workarounds

If testing via Playwright in CI environment without Playwright dependencies:

1. System dependencies might not be installed
2. Use `npx playwright install-deps` with sudo
3. Or use Docker/container with pre-built Playwright image

Alternative: Use cloud-based browser testing (BrowserStack, Sauce Labs, etc.)

## Test Artifacts

- **Location**: `/test-results/` (Playwright)
- **Report Format**: HTML report in `playwright-report/`
- **Videos**: Saved on first failure in `test-results/`
- **Screenshots**: Saved on failure in `test-results/`

## Continuous Integration

For CI/CD pipeline (GitHub Actions, etc.):
1. Install dependencies: `npm install`
2. Install Playwright: `npm install -D @playwright/test`
3. Install browsers: `npx playwright install`
4. Run tests: `npx playwright test --reporter=junit`
5. Upload artifacts: JUnit XML and screenshots
6. Publish HTML report

## Related Files

- **Test File**: `/home/kenny/personal/github-clones/finance/e2e/dashboard.spec.ts`
- **Playwright Config**: `/home/kenny/personal/github-clones/finance/playwright.config.ts`
- **Dashboard Component**: `/home/kenny/personal/github-clones/finance/components/dashboard/DashboardView.tsx`
- **Overview Tab**: `/home/kenny/personal/github-clones/finance/components/dashboard/OverviewTab.tsx`
- **Stat Card**: `/home/kenny/personal/github-clones/finance/components/dashboard/StatCard.tsx`

## Contact & Support

For test failures or issues:
1. Check browser console for errors
2. Review Playwright test report
3. Verify dev server is running on port 3000
4. Ensure DATABASE_URL is set (if using Prisma features)
5. Check network tab for failed requests
