# Implementation Plan: Dashboard & Capital Management UI/UX Improvements

## Overview
This plan updates the Finance Dashboard and Capital Management views with improved UI/UX, plus prepares the data layer to transition from in-memory dummy data to a real Prisma backend. Both features will continue using dummy data in development while the codebase infrastructure supports gradual backend migration — following the existing email-blast service pattern.

## Requirements
- Improve dashboard and capital management UI components for clarity, performance, and modern design patterns
- Keep dummy data functional in development without breaking existing workflows
- Add Prisma schema definitions for finance tables (transactions, budgets) to prepare for cloud deployment
- Create a service layer following the email-blast pattern (Prisma + in-memory fallback) so backend integration is non-breaking
- Maintain role-based access control (finance manager vs. associate)
- No destructive changes to existing hooks or components; extend incrementally

## Architecture Changes
- **prisma/schema.prisma** — Add `FinanceTransaction` and `FinanceProgramBudget` models
- **lib/server/finance-service.ts** (new) — Prisma-backed service with in-memory fallback, mirrors email-blast pattern
- **app/api/finance/transactions/route.ts** (new) — API endpoints for transactions
- **app/api/finance/budgets/route.ts** and **app/api/finance/budgets/[id]/route.ts** (new) — API endpoints for budgets
- **hooks/useCapitalManagement.ts** — Refactor to call API routes instead of reading constants.ts directly
- **hooks/useDashboardViewModel.ts** — Refactor to call API routes for finance data
- **Dashboard and Capital Management components** — UI improvements (stat cards, charts, tables)

---

## Implementation Phases

### Phase 1: Database Schema & Service Layer
Goal: Lay the foundation so the backend is ready when a real database is deployed.

1. Add `FinanceTransaction` and `FinanceProgramBudget` models to `prisma/schema.prisma` — match the TypeScript types already in `types.ts`. Add indexes on `departmentId` and `createdAt`.
2. Run `npm run prisma:generate` after schema changes. Use `npm run prisma:migrate` to create a migration file (this is what gets applied when deployed to the cloud).
3. Create `lib/server/finance-service.ts` following `lib/server/email-blast-service.ts` as a template. Implement: `getTransactions()`, `createTransaction()`, `getBudgets()`, `createBudget()`, `updateBudget()`.
4. Use the same `withPrismaFallback` wrapper pattern: try Prisma first; fall back to reading from `constants.ts` when `DATABASE_URL` is missing or `ALLOW_FINANCE_MEMORY_FALLBACK=true`.
5. Include role-based access checks inside service functions: only users with `membershipRole = "manager"` can write; associates are read-only.

**Risk:** Schema must not conflict with existing email blast tables. Always generate a migration file; never manually edit the database.

---

### Phase 2: API Routes
Goal: Create REST endpoints so the frontend can talk to the backend.

1. Create `app/api/finance/transactions/route.ts`:
   - `GET` — list transactions, support optional query params: `departmentId`, `startDate`, `endDate`, `type`
   - `POST` — create transaction (managers only); validate input with Zod
2. Create `app/api/finance/budgets/route.ts` and `app/api/finance/budgets/[id]/route.ts`:
   - `GET` — list all budgets with spending totals aggregated from transactions
   - `POST` — create new budget (managers only)
   - `GET /[id]` — fetch single budget with transaction count
   - `PATCH /[id]` — update budget (managers only)
3. All routes call the service functions from Phase 1. Access control is handled in the service layer, not the route.
4. Return consistent JSON response format: `{ success, data, error }` — same pattern used in email-blast routes.

**Risk:** Make sure auth session is read from `better-auth` so the current user's role is available in route handlers.

---

### Phase 3: Hook Refactoring
Goal: Connect the existing UI hooks to the new API endpoints.

1. **`hooks/useCapitalManagement.ts`**:
   - Add `useEffect` to fetch from `/api/finance/transactions` and `/api/finance/budgets` on mount
   - Add `isLoading` and `error` state
   - Replace direct reads from `DB_FINANCE_TRANSACTIONS` / `DB_PROGRAM_BUDGETS` with API results
   - Keep all callback signatures (`addExpense`, `addIncome`, `editExpense`) unchanged — just route them through `fetch` POST instead of mutating in-memory data
   - Initialize state with dummy data as fallback while loading

2. **`hooks/useDashboardViewModel.ts`**:
   - Fetch from `/api/finance/transactions` instead of importing `DB_FINANCE_TRANSACTIONS`
   - Keep all trend calculations and aggregations in the hook (they run on the fetched data)
   - Add loading state so the dashboard shows skeletons while data loads

**Risk:** Preserve all existing hook return types exactly so parent components need zero changes.

---

### Phase 4: Dashboard UI Improvements
Goal: Make the Finance Dashboard more informative and visually polished.

1. **Stat cards**: Redesign as a clean 4-column grid. Each card shows the metric, a color-coded trend indicator (up/down arrow + %), and a small sparkline chart for the past 6 months.
2. **Monthly area chart**: Improve tooltip design, add clearer legend, make the chart responsive on mobile.
3. **Activity Feed**: Each row should show amount, a status badge (Approved / Pending / Rejected), and the program name. Compact design that can show 8+ items without scrolling.
4. **Pending Actions Panel**: Group items by department. Show action buttons inline. Prioritize by the current user's department access.

**Risk:** Use Tailwind responsive classes (`sm:`, `md:`, `lg:`) throughout. Test at 360dp and 1280dp widths.

---

### Phase 5: Capital Management UI Improvements
Goal: Make budgets and transactions easier to read and manage.

1. **Budget progress cards**: Add a visual progress bar per budget. Color it green (< 70% used), yellow (70–90%), red (> 90%). Show utilization % and amount remaining.
2. **Expense breakdown chart**: Add a pie or donut chart showing spending by category (Marketing, Venue, Catering, etc.).
3. **Transaction table**: Make columns sortable (click to sort by date or amount). Add a search/filter bar. Add pagination if the list exceeds 50 rows.
4. **Inline editing for managers**: Let managers click a row to edit transaction details (amount, category, note) without a separate modal. Show input validation feedback inline.
5. **Budget allocation form**: Simplify the form layout — group related fields, use clear labels, show validation errors next to each field (not at the top of the form).

**Risk:** If transactions list is large, paginate at the API level (add `page` and `limit` params to GET /api/finance/transactions).

---

### Phase 6: Testing & Validation
Goal: Confirm both development (fallback) and production (Prisma) paths work correctly.

1. Run the app with `DATABASE_URL` unset — dummy data from constants.ts should load without errors.
2. Run the app with `DATABASE_URL` pointing to a real test database — Prisma data should be used instead.
3. Verify role-based access in both modes: associate cannot POST transactions; manager can.
4. Add integration tests for all new API routes (happy path + invalid input + unauthorized access).
5. Update existing hook tests to mock the fetch calls to `/api/finance/*` instead of importing constants.
6. Add unit tests for finance-service.ts covering the Prisma path and the fallback path.

**Risk:** Silent fallback can mask a misconfigured `DATABASE_URL`. Add a console warning in development when falling back to in-memory data.

---

## Risks Summary

| Risk | Severity | Mitigation |
|------|----------|------------|
| Schema migration conflicts with existing tables | High | Always run `prisma migrate dev`; never edit DB manually |
| Fallback silently masks missing database | Medium | Log warning in dev; require explicit flag in prod |
| Large transaction list causes slow API | Medium | Add pagination and DB indexes |
| Role access inconsistent in fallback vs Prisma path | Medium | Enforce checks in service layer, tested for both paths |
| UI changes break existing component contracts | Low | Keep hook return types and callback signatures unchanged |

---

## Success Criteria
- [ ] Prisma schema includes `FinanceTransaction` and `FinanceProgramBudget` with indexes and a migration file
- [ ] `lib/server/finance-service.ts` created with Prisma + fallback pattern; all functions unit tested
- [ ] All API routes implemented and returning consistent `{ success, data, error }` responses
- [ ] Hooks fetch from API routes; loading and error states are handled in the UI
- [ ] Dashboard shows improved stat cards with sparklines, better activity feed, and grouped pending actions
- [ ] Capital Management shows color-coded budget progress bars, expense pie chart, and sortable/filterable transaction table
- [ ] App works correctly with `DATABASE_URL` unset (uses dummy data) and set (uses Prisma)
- [ ] 80%+ test coverage on new service and API route code
- [ ] No hardcoded secrets; all env vars validated at startup

---

## Implementation Order
1. **Phase 1** — Schema + Service (blocks everything else; do first)
2. **Phase 2** — API Routes (blocks hook refactoring)
3. **Phase 3** — Hook Refactoring (can begin once Phase 2 is done)
4. **Phase 4 & 5** — UI improvements (can run in parallel with Phase 3)
5. **Phase 6** — Testing (run throughout; do a final pass at the end)

---

## Notes for the Implementer
- Use `lib/server/email-blast-service.ts` as the direct template for `finance-service.ts` — copy the `withPrismaFallback` pattern exactly.
- Use Zod for validating POST/PATCH request bodies in the API routes — see email-blast routes for examples.
- When updating hooks, only change where data is fetched from — do not refactor state logic or rename returned values.
- Add `isLoading` skeleton states in the components so the UI doesn't flash on mount.
- Test role access with both the `finance.lead@sxc.ac.id` (manager) and a non-manager account from `constants.ts`.
