# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # All Jest tests
npm run test:unit    # Unit tests only (lib/server/__tests__)
npm run test:integration  # Integration tests only (app/api/__tests__)
npx jest --testPathPattern=<path>  # Single test file
npm run prisma:migrate   # Run DB migrations (requires DATABASE_URL)
npm run prisma:studio    # Open Prisma Studio
npm run prisma:generate  # Regenerate Prisma client after schema changes
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | For email blast persistence | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | For OAuth login | Google OAuth credentials |
| `EMAIL_BLAST_STORAGE_LOCAL_ROOT` | Optional | File upload root (defaults to `.tmp/email-blast-uploads`) |
| `EMAIL_BLAST_PUBLIC_BASE_URL` | Optional | Base URL for attachment public links |
| `ALLOW_EMAIL_BLAST_MEMORY_FALLBACK` | Optional | Set `"true"` in production to allow in-memory fallback |
| `RESEND_API_KEY` | For email sending | Resend email provider |

Without `DATABASE_URL`, the email blast feature automatically falls back to an in-memory store seeded from `constants.ts`.

## Architecture

This is a **single-page Next.js app**. All navigation is client-side using a `View` enum — there are no separate Next.js pages beyond `app/page.tsx`. The `lib/view.tsx` router maps `View` values to component trees, and `hooks/useAppNavigation.ts` manages the active view state.

### Two authentication systems

The codebase contains two parallel auth implementations that serve different purposes:

- **`lib/auth.ts`** — Client-side dummy auth. Looks up users from the `DB_USERS` array in `constants.ts`. Used by `useAuthState` hook and the login form. This is the active auth path in normal development.
- **`lib/auth-server.ts`** + **`lib/auth-client.ts`** — `better-auth` with Google OAuth and Prisma adapter. Wired up at `app/api/auth/[...better-auth]/route.ts`. Intended for production OAuth login.

### Data layer duality

Most features read from the **dummy DB** in `constants.ts` — large in-memory arrays (`DB_USERS`, `DB_FINANCE_TRANSACTIONS`, `DB_EMAIL_BLASTS`, etc.) that mirror the Prisma schema shapes defined in `types.ts`.

The **email blast feature** is the only one backed by real Prisma/PostgreSQL. `lib/server/email-blast-service.ts` implements a `withPrismaFallback` wrapper: it tries Prisma first and silently falls back to the in-memory store (a mutable copy of `constants.ts` data) when the DB is unreachable. The fallback is only active in `NODE_ENV=development` or when `ALLOW_EMAIL_BLAST_MEMORY_FALLBACK=true`.

### Hook / view-model pattern

Business logic lives in custom hooks in `hooks/`. Each major view has a dedicated hook (e.g., `useCapitalManagement`, `useEmailBlast`, `useDashboardViewModel`) that owns state and calls into `lib/` functions. View components receive data and handlers as props from these hooks.

### Role-based access

`UserRole` = `admin | finance | ops | marketing | hr | tech`. Roles map to departments. `admin` has cross-department access. The email blast service enforces `ensureDepartmentAccess` and `ensureManager` checks on every mutation. Demo credentials (dummy auth): `finance.lead@sxc.ac.id / password` and `admin@sxc.ac.id / admin`.

### API routes

All routes are under `app/api/`. The email blast API is the only fully implemented REST API:
- `GET/POST /api/email-blasts` — list / create
- `GET/PATCH/DELETE /api/email-blasts/[blastId]` — single blast
- `POST /api/email-blasts/[blastId]/submit|approve|reject|send|archive`
- `GET/POST /api/email-blasts/[blastId]/attachments`
- `GET/DELETE /api/email-blasts/[blastId]/attachments/[attachmentId]`
- `GET /api/email-blasts/assets/[...key]` — serve stored attachment files
- `GET /api/auth/me` — current user (uses better-auth session)

### File storage

Attachments are stored on disk under `LOCAL_ROOT` (defaults to `.tmp/email-blast-uploads/`). `lib/server/file-storage.ts` validates paths against the root to prevent traversal attacks.

### Key files

- `types.ts` — all shared TypeScript types and the `View` enum
- `constants.ts` — all dummy DB seed data (single source of truth for non-email-blast features)
- `lib/view.tsx` — view router (switch on `View` enum → component)
- `lib/server/email-blast-service.ts` — Prisma + in-memory fallback service
- `prisma/schema.prisma` — DB schema (only email blast tables + better-auth tables)
