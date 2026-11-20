# WellTrack

Symptom and wellness tracking API for people with chronic health conditions.

## Prerequisites

- Node.js 18+
- Docker (for local Postgres)

## Setup

**1. Start the database**

```bash
docker run -d --name welltrack-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=welltrack \
  -p 5432:5432 postgres:16-alpine
```

**2. Configure environment**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set secure values for production. For local dev the defaults work as-is.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Secret for signing access tokens |
| `REFRESH_TOKEN_SECRET` | Secret for signing refresh tokens |
| `PORT` | Port the server listens on (default: 3000) |

**3. Install dependencies and run migrations**

```bash
cd backend
npm install
node_modules/.bin/prisma migrate dev
```

**4. Start the dev server**

```bash
npm run dev
```

The API is available at `http://localhost:3000/api`. Verify with:

```bash
curl http://localhost:3000/api/health
```

## Testing

```bash
cd backend
npm test
```

Tests use supertest against the Express app directly — no running server needed, but the database must be reachable.

## API Reference

See [docs/api.md](docs/api.md).

## Test Accounts

These accounts are created by `backend/prisma/seed-testuser.ts` and contain 30 days of realistic data across all log types (mood, symptoms, medications, habits).

| Account | Email | Password |
|---|---|---|
| Demo user (system seed) | `demo@welltrack.dev` | `demo1234` |
| Test user (rich data) | `alex@welltrack.dev` | `WellTrack42!` |

To recreate the test user (destructive — deletes and re-seeds):

```bash
cd backend
node_modules/.bin/ts-node --transpile-only prisma/seed-testuser.ts
```
