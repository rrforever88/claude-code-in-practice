# WellTrack — Implementation Tasks

---

## Phase 1: Backend Foundation (Weeks 1–3)

### Project Setup
- [x] Initialize Node.js/Express project with TypeScript; configure `tsconfig.json`, `eslint`, and `prettier`
- [x] Add dependencies: `express`, `prisma`, `@prisma/client`, `bcrypt`, `jsonwebtoken`, `zod`, `dotenv`, `cors`
- [x] Set up PostgreSQL database (local dev) and add `DATABASE_URL` to `.env`
- [x] Initialize Prisma: run `prisma init`, write the full schema (`User`, `Symptom`, `SymptomLog`, `MoodLog`, `Medication`, `MedicationLog`, `Habit`, `HabitLog`), and run the initial migration
- [x] Add database indexes on `(user_id, logged_at)` for all log tables in the Prisma schema
- [x] Write a seed script that inserts the 11 default symptoms and 5 default habits (with `user_id = null`)

### Auth Endpoints
- [x] Implement `POST /api/auth/register` — validate input, hash password with bcrypt, create `User`, return access + refresh JWT pair
- [x] Implement `POST /api/auth/login` — verify credentials, issue JWT access token (15 min) and refresh token (7 days) stored in an httpOnly cookie or returned in body
- [x] Implement `POST /api/auth/refresh` — validate refresh token, issue new access token
- [x] Implement `POST /api/auth/logout` — invalidate refresh token
- [x] Implement `POST /api/auth/forgot-password` — generate a time-limited reset token and send reset email (use nodemailer or a transactional email service)
- [x] Implement `POST /api/auth/reset-password` — validate token, update `password_hash`
- [x] Write an `authenticateToken` middleware that verifies the JWT and attaches `req.user`

### User Endpoints
- [x] Implement `GET /api/users/me` — return the authenticated user's profile
- [x] Implement `PATCH /api/users/me` — update `display_name` and/or `timezone`; validate timezone is a valid IANA string
- [x] Implement `DELETE /api/users/me` — delete user and all associated data (cascade via Prisma relations)

### Symptoms & Symptom Logs
- [x] Implement `GET /api/symptoms` — return all system symptoms (`user_id = null`) plus the user's custom ones, filtered by `is_active`
- [x] Implement `POST /api/symptoms` — create a custom symptom for the authenticated user
- [x] Implement `PATCH /api/symptoms/:id` — update name, category, or `is_active`; enforce ownership (can't edit system symptoms)
- [x] Implement `DELETE /api/symptoms/:id` — soft-delete or hard-delete custom symptoms; prevent deleting system symptoms
- [x] Implement `GET /api/symptom-logs` — return logs for the authenticated user with `startDate`, `endDate`, `limit`, `offset` query params
- [x] Implement `POST /api/symptom-logs` — create a log entry; validate `severity` is 1–10
- [x] Implement `PATCH /api/symptom-logs/:id` — update severity, notes, or `logged_at`; enforce ownership
- [x] Implement `DELETE /api/symptom-logs/:id` — delete a log entry; enforce ownership

### Mood Logs
- [x] Implement `GET /api/mood-logs` — return mood logs with date range filtering
- [x] Implement `POST /api/mood-logs` — validate `mood_score` (1–5), `energy_level` (1–5, optional), `stress_level` (1–5, optional)
- [x] Implement `PATCH /api/mood-logs/:id` — update fields; enforce ownership
- [x] Implement `DELETE /api/mood-logs/:id` — enforce ownership

### Medications & Medication Logs
- [x] Implement `GET /api/medications` — return the user's active medications
- [x] Implement `POST /api/medications` — create a medication record
- [x] Implement `PATCH /api/medications/:id` — update name, dosage, frequency, or `is_active`
- [x] Implement `DELETE /api/medications/:id` — enforce ownership
- [x] Implement `GET /api/medication-logs` — return logs with date range filtering
- [x] Implement `POST /api/medication-logs` — log whether a medication was taken
- [x] Implement `PATCH /api/medication-logs/:id` — update `taken`, `taken_at`, or notes
- [x] Implement `DELETE /api/medication-logs/:id` — enforce ownership

### Habits & Habit Logs
- [x] Implement `GET /api/habits` — return system habits plus the user's custom ones
- [x] Implement `POST /api/habits` — create a custom habit; validate `tracking_type` is one of `boolean | numeric | duration`
- [x] Implement `PATCH /api/habits/:id` — update name, unit, or `is_active`; enforce ownership for custom habits
- [x] Implement `DELETE /api/habits/:id` — enforce ownership
- [x] Implement `GET /api/habit-logs` — return logs with date range filtering
- [x] Implement `POST /api/habit-logs` — accept `value_boolean`, `value_numeric`, or `value_duration` depending on the habit's `tracking_type`
- [x] Implement `PATCH /api/habit-logs/:id` — update value and notes; enforce ownership
- [x] Implement `DELETE /api/habit-logs/:id` — enforce ownership

### Validation & Error Handling
- [x] Add Zod schemas for all request bodies; return structured `400` errors with field-level messages
- [x] Add a global error handler middleware that returns consistent `{ error: string }` JSON for unhandled errors
- [x] Return `401` for missing/invalid JWT, `403` for ownership violations, `404` for missing resources

---

## Phase 2: Frontend Foundation (Weeks 4–6)

### Project Setup
- [ ] Bootstrap React app with Vite + TypeScript; install and configure Tailwind CSS
- [ ] Install dependencies: `react-router-dom`, `axios` (or `fetch` wrapper), `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] Set up folder structure: `pages/`, `components/`, `hooks/`, `api/`, `types/`
- [ ] Create an Axios instance (or fetch wrapper) that attaches the JWT from local storage and handles 401 → redirect to login
- [ ] Define TypeScript types mirroring the backend data models

### Auth Pages
- [ ] Build `/register` page — email, password, display name fields; call `POST /api/auth/register`; redirect to dashboard on success
- [ ] Build `/login` page — email + password; call `POST /api/auth/login`; store token; redirect to dashboard
- [ ] Build `/forgot-password` page — email input; call `POST /api/auth/forgot-password`; show confirmation message
- [ ] Build `/reset-password` page — read token from URL query param; new password form; call `POST /api/auth/reset-password`
- [ ] Create a `ProtectedRoute` component that redirects unauthenticated users to `/login`
- [ ] Set up `react-router-dom` with routes: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/history`, `/trends`, `/settings`

### Dashboard (Home Screen)
- [ ] Build the dashboard layout: today's date header, four section cards (Symptoms, Mood, Medications, Habits)
- [ ] Fetch and display a summary of today's logs in each section card
- [ ] Add a "days logged this week" or streak indicator
- [ ] Add quick-add buttons per section that open the appropriate log modal

### Logging Modals
- [ ] Build a `LogSymptomModal` — symptom picker (dropdown from `GET /api/symptoms`), severity slider (1–10), optional notes, date picker defaulting to now
- [ ] Build a `LogMoodModal` — mood score (1–5 button group), optional energy and stress sliders, optional notes, date picker
- [ ] Build a `LogMedicationModal` — medication picker, taken/not taken toggle, optional `taken_at` time, notes, date picker
- [ ] Build a `LogHabitModal` — habit picker, input type driven by `tracking_type` (checkbox, number input, or duration input), notes, date picker
- [ ] Add optimistic UI updates or refetch after save so the dashboard reflects new entries without a full page reload

---

## Phase 3: Full Features (Weeks 7–9)

### History View
- [ ] Build `/history` page — scrollable list of log entries grouped by day, newest first
- [ ] Implement filter bar to show/hide by type (symptoms, mood, medications, habits)
- [ ] Make each entry expandable in-place; show an edit icon that opens the appropriate log modal pre-populated
- [ ] Add delete with a confirmation prompt

### Trend Charts
- [ ] Install a charting library (e.g., Recharts or Chart.js)
- [ ] Build the `/trends` page with a date range selector (7 / 30 / 90 day presets)
- [ ] Render a line chart of symptom severity over time using `GET /api/symptom-logs`; allow toggling individual symptoms on/off
- [ ] Render mood, energy, and stress level line charts using `GET /api/mood-logs`
- [ ] Implement `GET /api/insights/trends` on the backend — aggregate daily averages per symptom and mood fields for the requested date range and `type`

### Calendar Heatmap
- [ ] Build a calendar heatmap component showing which days had at least one log entry; use a soft color scale (e.g., sage green intensity)
- [ ] Wire it to a backend query or derive it client-side from fetched log data

### Settings Screen
- [ ] Build `/settings` page with sections: Profile, Symptoms, Habits, Medications, Export, Danger Zone
- [ ] Profile section: edit `display_name` and `timezone`; call `PATCH /api/users/me`
- [ ] Symptoms section: list user's symptoms; toggle system symptoms active/inactive; add custom symptom form; delete custom symptoms
- [ ] Habits section: same pattern as symptoms — toggle, add, delete
- [ ] Medications section: list medications with active toggle; add new medication form (name, dosage, frequency); delete
- [ ] Export section: date range picker + "Download CSV" button that calls `GET /api/export/csv`
- [ ] Danger Zone: "Delete account" button with confirmation modal; calls `DELETE /api/users/me` and clears local auth state

### CSV Export
- [ ] Implement `GET /api/export/csv` on the backend — query all log types for the user in the date range, flatten to rows, and stream a CSV response with appropriate headers

---

## Phase 4: Polish & Launch (Weeks 10–12)

### Testing
- [ ] Write integration tests for all auth endpoints (register, login, refresh, logout, forgot/reset password)
- [ ] Write integration tests for CRUD on symptom logs, mood logs, medication logs, and habit logs (happy path + ownership enforcement)
- [ ] Write basic React component tests for the login form, log modals, and dashboard summary cards

### Performance
- [ ] Add database indexes if any are missing; run `EXPLAIN ANALYZE` on the most common queries (log fetches by date range)
- [ ] Add server-side pagination to `GET /api/symptom-logs` and `GET /api/habit-logs` and confirm the frontend uses `limit`/`offset`
- [ ] Lazy-load the charts component (dynamic import) to keep the initial bundle small

### Mobile Responsiveness
- [ ] Audit all pages at 375px width; fix any overflow, cramped tap targets, or hard-coded widths
- [ ] Ensure log modals are full-screen on mobile and scrollable when content is tall
- [ ] Test on iOS Safari and Chrome Android (or use browser dev tools device emulation)

### Deployment
- [ ] Choose a hosting provider (Vercel for frontend, Railway or Render for backend + Postgres)
- [ ] Add environment variable docs (`DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `EMAIL_*`) to a `.env.example` file
- [ ] Set up the production database, run migrations, and run the seed script
- [ ] Configure CORS on the backend to allow only the production frontend origin
- [ ] Verify HTTPS is enforced end-to-end

### Beta Launch
- [ ] Create a simple onboarding checklist for new users (add a symptom, log your first entry, check the dashboard)
- [ ] Manually test the full user flow end-to-end: register → log all four types → view history → view trends → export CSV → delete account
- [ ] Set up basic error logging (e.g., Sentry free tier) on both frontend and backend
- [ ] Send invite emails to the 50 beta users with login instructions
