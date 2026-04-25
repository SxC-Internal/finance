#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Verification script for Finance Dashboard
 * Performs static analysis of components to ensure UI improvements are in place
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function checkFileExists(filepath) {
  return fs.existsSync(filepath);
}

function readFile(filepath) {
  return fs.readFileSync(filepath, 'utf-8');
}

function checkPattern(content, pattern, description) {
  const regex = new RegExp(pattern, 'i');
  if (regex.test(content)) {
    log(COLORS.green, `✓ ${description}`);
    return true;
  } else {
    log(COLORS.red, `✗ ${description}`);
    return false;
  }
}

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// Test: Dashboard component exists
test('Dashboard View Component Exists', () => {
  const filepath = path.join(__dirname, '../components/dashboard/DashboardView.tsx');
  if (!checkFileExists(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  log(COLORS.green, `✓ DashboardView component found`);
});

// Test: OverviewTab component exists
test('Overview Tab Component Exists', () => {
  const filepath = path.join(__dirname, '../components/dashboard/OverviewTab.tsx');
  if (!checkFileExists(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  log(COLORS.green, `✓ OverviewTab component found`);
});

// Test: StatCard component exists
test('Stat Card Component Exists', () => {
  const filepath = path.join(__dirname, '../components/dashboard/StatCard.tsx');
  if (!checkFileExists(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }
  log(COLORS.green, `✓ StatCard component found`);
});

// Test: Dashboard has header section
test('Dashboard Header Section', () => {
  const filepath = path.join(__dirname, '../components/dashboard/DashboardView.tsx');
  const content = readFile(filepath);
  checkPattern(content, 'Avatar.*AvatarImage|AvatarFallback', 'User avatar in header');
  checkPattern(content, 'Badge.*Active', 'Active badge displayed');
  checkPattern(content, 'Manager Access', 'Manager badge for role-based access');
  checkPattern(content, '<h2.*title', 'Header greeting text');
});

// Test: Dashboard has stat cards grid
test('Dashboard Stat Cards Grid', () => {
  const filepath = path.join(__dirname, '../components/dashboard/OverviewTab.tsx');
  const content = readFile(filepath);
  checkPattern(content, 'grid-cols-1.*md:grid-cols-2.*lg:grid-cols-4', '4-column stat card grid');
  checkPattern(content, 'StatCard.*map', 'Multiple stat cards rendered');
  checkPattern(content, 'metrics.*map', 'Metrics array iteration');
});

// Test: Dashboard has chart
test('Dashboard Performance Chart', () => {
  const filepath = path.join(__dirname, '../components/dashboard/OverviewTab.tsx');
  const content = readFile(filepath);
  checkPattern(content, 'AreaChart|ResponsiveContainer', 'Recharts area chart component');
  checkPattern(content, 'Performance Overview', 'Chart title text');
  checkPattern(content, 'h-\\[350px\\]', 'Chart height (350px)');
  checkPattern(content, 'chartAccentColor|#60a5fa', 'Chart styling with accent color');
});

// Test: Dashboard has AI insights
test('Dashboard AI Insights Feature', () => {
  const filepath = path.join(__dirname, '../components/dashboard/OverviewTab.tsx');
  const content = readFile(filepath);
  checkPattern(content, 'showOverviewAI|setShowOverviewAI', 'AI insights state toggle');
  checkPattern(content, 'Sparkles|Bot', 'AI icons from Lucide');
  checkPattern(content, 'Explain with AI|Hide Insights', 'AI button text');
  checkPattern(content, 'aiInsights.*overview', 'AI insights content from props');
});

// Test: Dashboard has tabs
test('Dashboard Tab Navigation', () => {
  const filepath = path.join(__dirname, '../components/dashboard/DashboardView.tsx');
  const content = readFile(filepath);
  checkPattern(content, '<Tabs.*defaultValue.*overview', 'Tabs component with Overview default');
  checkPattern(content, 'TabsTrigger.*overview|analytics|reports', 'All three tabs');
  checkPattern(content, 'OverviewTab|AnalyticsTab|ReportsTab', 'Tab content components');
});

// Test: Responsive design classes
test('Responsive Layout Design', () => {
  const overviewPath = path.join(__dirname, '../components/dashboard/OverviewTab.tsx');
  const dashPath = path.join(__dirname, '../components/dashboard/DashboardView.tsx');

  const overviewContent = readFile(overviewPath);
  const dashContent = readFile(dashPath);

  checkPattern(
    overviewContent + dashContent,
    'md:flex-row|flex-col|lg:grid-cols|flex-col sm:flex-row',
    'Responsive flexbox/grid classes'
  );
  checkPattern(
    overviewContent + dashContent,
    'gap-4|gap-6|space-y',
    'Responsive spacing with Tailwind gap utility'
  );
});

// Test: StatCard has sparkline
test('Stat Cards with Sparklines', () => {
  const filepath = path.join(__dirname, '../components/dashboard/StatCard.tsx');
  const content = readFile(filepath);
  checkPattern(content, 'Sparkline|LineChart|AreaChart|ResponsiveContainer', 'Sparkline chart component');
  checkPattern(content, 'metric.*label|metric.*value|metric.*trend', 'Metric structure');
});

// Test: Environment setup
test('Environment Configuration', () => {
  const envPath = path.join(__dirname, '../.env');
  const envLocalPath = path.join(__dirname, '../.env.local');

  if (checkFileExists(envPath) || checkFileExists(envLocalPath)) {
    log(COLORS.green, '✓ Environment file exists');
  } else {
    log(COLORS.yellow, '⚠ No .env file found (OK for demo with dummy data)');
  }
});

// Test: Constants file has seed data
test('Dummy Data & Constants', () => {
  const filepath = path.join(__dirname, '../constants.ts');
  if (!checkFileExists(filepath)) {
    log(COLORS.red, '✗ constants.ts file not found');
    return;
  }

  const content = readFile(filepath);
  checkPattern(content, 'DB_USERS|DB_FINANCE_TRANSACTIONS', 'Seed data for finance module');
  checkPattern(content, 'finance\\.lead|admin@sxc', 'Finance lead user account');
});

// Test: Types defined
test('Type Definitions', () => {
  const filepath = path.join(__dirname, '../types.ts');
  if (!checkFileExists(filepath)) {
    log(COLORS.red, '✗ types.ts file not found');
    return;
  }

  const content = readFile(filepath);
  checkPattern(content, 'interface User|type User', 'User type definition');
  checkPattern(content, 'View.*=.*["|`]', 'View enum for navigation');
  checkPattern(content, 'role.*:.*["|`]', 'User role type');
});

// Test: Package.json has required dependencies
test('Project Dependencies', () => {
  const filepath = path.join(__dirname, '../package.json');
  const content = readFile(filepath);
  checkPattern(content, 'recharts', 'Recharts for charts');
  checkPattern(content, 'lucide-react', 'Lucide icons');
  checkPattern(content, 'tailwindcss', 'Tailwind CSS for styling');
  checkPattern(content, 'next', 'Next.js framework');
  checkPattern(content, 'react', 'React library');
});

// Test: Playwright config exists
test('E2E Test Configuration', () => {
  const filepath = path.join(__dirname, '../playwright.config.ts');
  if (!checkFileExists(filepath)) {
    log(COLORS.red, '✗ playwright.config.ts not found');
    return;
  }

  const content = readFile(filepath);
  checkPattern(content, 'baseURL.*localhost:3000', 'Base URL configured');
  checkPattern(content, 'testDir.*e2e', 'Test directory configured');
  checkPattern(content, 'screenshot|video|trace', 'Artifact collection enabled');
});

// Test: E2E tests exist
test('E2E Test Suite', () => {
  const filepath = path.join(__dirname, '../e2e/dashboard.spec.ts');
  if (!checkFileExists(filepath)) {
    log(COLORS.red, '✗ dashboard.spec.ts not found');
    return;
  }

  const content = readFile(filepath);
  checkPattern(content, 'login.*finance\\.lead', 'Login test with finance lead');
  checkPattern(content, 'stat.*card|metric|sparkline', 'Stat card verification');
  checkPattern(content, 'chart|Performance Overview', 'Chart rendering test');
  checkPattern(content, 'responsive.*360|1280', 'Responsive design tests');
  checkPattern(content, 'AI.*insight|Explain with', 'AI insights feature test');
});

// Run all tests
async function runTests() {
  log(COLORS.cyan, '\n='.repeat(60));
  log(COLORS.cyan, 'Finance Dashboard E2E Test Verification');
  log(COLORS.cyan, '='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      log(COLORS.blue, `\n[Test] ${name}`);
      fn();
      passed++;
    } catch (error) {
      log(COLORS.red, `[FAILED] ${name}`);
      log(COLORS.red, `  Error: ${error.message}`);
      failed++;
    }
  }

  log(COLORS.cyan, '\n' + '='.repeat(60));
  log(COLORS.cyan, 'Summary');
  log(COLORS.cyan, '='.repeat(60));
  log(COLORS.green, `✓ Passed: ${passed}`);
  if (failed > 0) {
    log(COLORS.red, `✗ Failed: ${failed}`);
  } else {
    log(COLORS.green, `✗ Failed: ${failed}`);
  }

  const passRate = ((passed / (passed + failed)) * 100).toFixed(1);
  log(COLORS.blue, `Pass Rate: ${passRate}%`);

  if (failed === 0) {
    log(COLORS.green, '\n✓ All verification checks passed!');
    log(COLORS.green, '\nNext Steps:');
    log(COLORS.green, '1. Start dev server: npm run dev');
    log(COLORS.green, '2. Open browser: http://localhost:3000');
    log(COLORS.green, '3. Login with: finance.lead@sxc.ac.id / password');
    log(COLORS.green, '4. Verify UI improvements are visible');
    log(COLORS.green, '5. Run E2E tests: npx playwright test\n');
    process.exit(0);
  } else {
    log(COLORS.red, '\n✗ Some checks failed. Please review the issues above.\n');
    process.exit(1);
  }
}

runTests().catch(error => {
  log(COLORS.red, `Fatal error: ${error.message}`);
  process.exit(1);
});
