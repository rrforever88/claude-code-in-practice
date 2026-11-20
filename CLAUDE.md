# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WellTrack is a symptom and wellness tracking application for people with chronic health conditions. Users can log symptoms, moods, medications, and daily habits, then view trends to identify patterns.

## Tech Stack

- **Frontend:** React with TypeScript, Tailwind CSS (not yet implemented)
- **Backend:** Node.js + Express with TypeScript
- **Database:** PostgreSQL with Prisma ORM 7
- **Auth:** JWT with refresh tokens (planned)
- **Validation:** Zod
- **Testing:** Vitest + supertest

## Commands

All commands run from the `backend/` directory:

```bash
# Development
npm run dev          # Start dev server with ts-node (requires .env)

# Build
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled code from dist/

# Testing
npm test                          # Run all tests (vitest run)
npm run test:watch                # Run tests in watch mode
npm run test:coverage             # Run tests with coverage report

# Run a single test file
node_modules/.bin/vitest run src/__tests__/app.test.ts
# Run tests matching a pattern
node_modules/.bin/vitest run --reporter=verbose -t "health"

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint errors
npm run format       # Format code with Prettier
```

### Prisma CLI

**Always use the local Prisma binary** — `npx prisma` pulls Prisma 8 RC from the registry and breaks everything:

```bash
node_modules/.bin/prisma migrate dev --name <name>   # create + apply new migration
node_modules/.bin/prisma db seed                     # run seed script
node_modules/.bin/prisma generate                    # regenerate client after schema changes
node_modules/.bin/prisma studio                      # GUI browser
```

## Local Postgres

Postgres runs in Docker. Start it with:

```bash
docker run -d --name welltrack-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=welltrack \
  -p 5432:5432 postgres:16-alpine
```

Copy `backend/.env.example` to `backend/.env` before first run. The default `DATABASE_URL` matches this container.

## Architecture

### Backend Structure

```
backend/src/
├── index.ts        # Server entry point (loads env, starts server)
├── app.ts          # Express app configuration (middleware, routes, error handlers)
├── lib/
│   └── prisma.ts   # Singleton Prisma client (driver adapter pattern)
├── routes/         # Route handlers (planned)
├── controllers/    # Request handlers (planned)
├── services/       # Business logic (planned)
├── middleware/     # Custom middleware (planned)
└── utils/          # Shared utilities (planned)
```

### Frontend Structure (planned)

```
frontend/src/
├── pages/          # Route components
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── api/            # API client functions
└── types/          # TypeScript type definitions
```

### Key Patterns

- **App/Server separation:** `app.ts` exports the Express app for testing; `index.ts` handles server startup. Tests import `app` directly via supertest without starting a server on a port.
- **Prisma client singleton:** `src/lib/prisma.ts` exports the one and only `PrismaClient` instance, wired through `PrismaPg` driver adapter. Import it everywhere DB access is needed — never instantiate `PrismaClient` directly elsewhere. Prisma 7 dropped native connectors; `new PrismaClient()` with no options throws at runtime.
- **Tests location:** Tests live in `src/__tests__/` using `.test.ts` suffix.
- **Environment:** Uses dotenv; `index.ts` imports `dotenv/config` at startup. Create `backend/.env` from `.env.example` (not committed).

### Prisma 7 quirks

- The connection URL lives in `prisma7.config.ts`, not in `schema.prisma` (the datasource block has no `url` field).
- `prisma/seed.ts` runs with `ts-node --transpile-only` because `tsconfig.json`'s `rootDir: ./src` excludes `prisma/`. Type checking is intentionally skipped there.
- `tsconfig.json` covers `src/` only — files in `prisma/` are not checked by `tsc`.

### Other toolchain quirks

- **ESLint 10 flat config:** configured in `eslint.config.cjs` (CommonJS). The old `.eslintrc.*` format is not supported.
- **Vitest pinned to 2.1.9:** Vitest 5.x crashes on Node 24 (`describe()` can't access internal suite context). Do not upgrade past 2.x until confirmed fixed.

## API Endpoints

Base URL: `/api`

Current:
- `GET /health` — Health check

Planned (see [Requirements.md](Requirements.md)):
- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Symptoms/Logs: `/api/symptoms/*`, `/api/symptom-logs/*`
- Moods: `/api/mood-logs/*`
- Medications: `/api/medications/*`, `/api/medication-logs/*`
- Habits: `/api/habits/*`, `/api/habit-logs/*`
- Insights/Export: `/api/insights/*`, `/api/export/*`

## Data Model

See [Requirements.md](Requirements.md) for the complete schema. Key entities:

- **User** — email, passwordHash, displayName, timezone (IANA)
- **Symptom / SymptomLog** — severity 1–10; `userId` nullable (null = system default)
- **MoodLog** — moodScore, energyLevel, stressLevel all 1–5
- **Medication / MedicationLog** — taken boolean, optional takenAt
- **Habit / HabitLog** — trackingType enum (`BOOLEAN | NUMERIC | DURATION`); HabitLog stores value in the matching nullable column; the other two are null
- All log tables have a composite index on `(userId, loggedAt)` for date-range queries

## Git Workflow

When completing tasks from TASKS.md:

1. Create a new branch: `feature/<task-number>-<brief-description>`
2. Make atomic commits using conventional commit messages:
   - `feat:` new features
   - `fix:` bug fixes
   - `docs:` documentation
   - `test:` tests
   - `refactor:` refactoring
3. Open a PR via the GitHub CLI (the `gh` binary is **not in PATH** on this machine):
   ```bash
   "/c/Program Files/GitHub CLI/gh.exe" pr create --title "..." --body "..." --base master
   ```
4. Update the task checkbox in TASKS.md to mark it complete.

**Merge order matters.** When multiple branches modify `package.json`, rebase each onto master after the previous PR merges. Force-push with `git push --force-with-lease`.

## Testing Requirements

Before marking any task complete:

1. Write tests for new functionality.
2. Run the full test suite: `npm test`
3. If tests fail — fix the code (not the tests, unless the tests are wrong), then re-run until all pass.
4. For API endpoints, include integration tests that verify:
   - Success responses with valid input
   - Authentication requirements (401 without token, 403 for wrong owner)
   - Edge cases and validation errors (400 with structured field messages)

## Documentation Requirements

### Code Comments

Add a comment when:
- The *why* isn't obvious from the code
- There's a non-obvious edge case being handled
- You're working around a bug or limitation

Don't add comments when the code is self-explanatory or you'd just be restating what it does.

For exported functions, use JSDoc:

```typescript
/**
 * Creates a new symptom log for the authenticated user.
 * @param userId - The ID of the user creating the log
 * @param data - The symptom log data
 * @returns The created symptom log with ID
 * @throws AppError 404 if symptom doesn't exist
 */
```

### API Documentation

Maintain a simple API reference in `docs/api.md`. Format:

```
### Create Symptom Log
POST /api/symptom-logs  (requires auth)

Request:
{ "symptomId": "uuid", "severity": 7, "notes": "Started after lunch" }

Response: 201 Created
{ "id": "uuid", "symptomId": "uuid", "severity": 7, ... }
```
