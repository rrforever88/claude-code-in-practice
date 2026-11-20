# WellTrack API Reference

Base URL: `/api`

All endpoints except `/health` and `/api/auth/*` require `Authorization: Bearer <accessToken>`.

---

## Health

### Health Check
`GET /health`

**Response: `200 OK`**
```json
{ "status": "ok" }
```

---

## Auth

### Register
`POST /api/auth/register`

**Request:**
```json
{ "email": "user@example.com", "password": "password123", "displayName": "Jane Smith" }
```

| Field | Type | Rules |
|---|---|---|
| `email` | string | Valid email |
| `password` | string | Min 8 chars |
| `displayName` | string | 1–100 chars |

**Response: `201 Created`**
```json
{
  "user": { "id": "uuid", "email": "user@example.com", "displayName": "Jane Smith", "timezone": null, "createdAt": "..." },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Errors:** `400` validation failed, `409` email already in use

---

### Login
`POST /api/auth/login`

**Request:**
```json
{ "email": "user@example.com", "password": "password123" }
```

**Response: `200 OK`**
```json
{ "accessToken": "<jwt>", "refreshToken": "<jwt>" }
```

**Errors:** `400` validation failed, `401` invalid credentials

---

### Refresh Token
`POST /api/auth/refresh`

**Request:**
```json
{ "refreshToken": "<jwt>" }
```

**Response: `200 OK`**
```json
{ "accessToken": "<jwt>" }
```

**Errors:** `400` validation failed, `401` invalid or expired refresh token

---

### Logout
`POST /api/auth/logout`

Stateless — tokens expire on their own. Returns `204 No Content`.

---

### Forgot Password
`POST /api/auth/forgot-password`

**Request:**
```json
{ "email": "user@example.com" }
```

**Response: `200 OK`**
```json
{ "message": "If that email is registered, a reset link has been sent." }
```

Always returns 200 to prevent email enumeration. Reset token is logged to console in dev.

---

### Reset Password
`POST /api/auth/reset-password`

**Request:**
```json
{ "token": "<reset-token>", "password": "newpassword123" }
```

**Response: `200 OK`**
```json
{ "message": "Password reset successfully." }
```

**Errors:** `400` validation failed or invalid/expired/used token

---

## Users

### Get Profile
`GET /api/users/me`  *(requires auth)*

**Response: `200 OK`**
```json
{ "id": "uuid", "email": "user@example.com", "displayName": "Jane Smith", "timezone": "America/New_York", "createdAt": "..." }
```

---

### Update Profile
`PATCH /api/users/me`  *(requires auth)*

**Request:**
```json
{ "displayName": "Jane", "timezone": "America/Chicago" }
```

All fields optional. `timezone` must be a valid IANA timezone string.

**Response: `200 OK`** — updated user object (same shape as GET)

**Errors:** `400` validation failed

---

### Delete Account
`DELETE /api/users/me`  *(requires auth)*

Deletes the user and all associated data via cascade. Returns `204 No Content`.

---

## Symptoms

### List Symptoms
`GET /api/symptoms`  *(requires auth)*

Returns system symptoms (`userId = null`) plus the user's own, filtered to `isActive = true`.

**Response: `200 OK`**
```json
[{ "id": "uuid", "name": "Headache", "category": "Neurological", "userId": null, "isActive": true }]
```

---

### Create Symptom
`POST /api/symptoms`  *(requires auth)*

**Request:**
```json
{ "name": "Brain fog", "category": "Neurological" }
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required, 1–100 chars |
| `category` | string | Optional |

**Response: `201 Created`** — created symptom object

**Errors:** `400` validation failed

---

### Update Symptom
`PATCH /api/symptoms/:id`  *(requires auth)*

All fields optional. Cannot modify system symptoms (`userId = null`).

**Request:**
```json
{ "name": "Migraines", "isActive": false }
```

**Response: `200 OK`** — updated symptom object

**Errors:** `400` validation failed, `403` system symptom or not owner, `404` not found

---

### Delete Symptom
`DELETE /api/symptoms/:id`  *(requires auth)*

Cannot delete system symptoms. Returns `204 No Content`.

**Errors:** `403` system symptom or not owner, `404` not found

---

## Symptom Logs

### List Symptom Logs
`GET /api/symptom-logs`  *(requires auth)*

**Query params:** `startDate`, `endDate` (ISO 8601), `limit` (default 50), `offset` (default 0)

**Response: `200 OK`**
```json
[{ "id": "uuid", "symptomId": "uuid", "severity": 7, "notes": "Started after lunch", "loggedAt": "...", "symptom": { "id": "uuid", "name": "Headache", "category": "Neurological" } }]
```

---

### Create Symptom Log
`POST /api/symptom-logs`  *(requires auth)*

**Request:**
```json
{ "symptomId": "uuid", "severity": 7, "notes": "Started after lunch", "loggedAt": "2026-11-20T14:00:00Z" }
```

| Field | Type | Rules |
|---|---|---|
| `symptomId` | string | Required UUID |
| `severity` | number | Required, 1–10 |
| `notes` | string | Optional |
| `loggedAt` | string | Optional ISO 8601, defaults to now |

**Response: `201 Created`** — created log object

**Errors:** `400` validation failed, `404` symptom not found

---

### Update Symptom Log
`PATCH /api/symptom-logs/:id`  *(requires auth)*

All fields optional. **Response: `200 OK`** — updated log object

**Errors:** `400` validation failed, `403` not owner, `404` not found

---

### Delete Symptom Log
`DELETE /api/symptom-logs/:id`  *(requires auth)*

Returns `204 No Content`. **Errors:** `403` not owner, `404` not found

---

## Mood Logs

### List Mood Logs
`GET /api/mood-logs`  *(requires auth)*

**Query params:** `startDate`, `endDate`, `limit` (default 50), `offset` (default 0)

**Response: `200 OK`**
```json
[{ "id": "uuid", "moodScore": 4, "energyLevel": 3, "stressLevel": 2, "notes": null, "loggedAt": "..." }]
```

---

### Create Mood Log
`POST /api/mood-logs`  *(requires auth)*

**Request:**
```json
{ "moodScore": 4, "energyLevel": 3, "stressLevel": 2, "notes": "Good day overall", "loggedAt": "2026-11-20T18:00:00Z" }
```

| Field | Type | Rules |
|---|---|---|
| `moodScore` | number | Required, 1–5 |
| `energyLevel` | number | Optional, 1–5 |
| `stressLevel` | number | Optional, 1–5 |
| `notes` | string | Optional |
| `loggedAt` | string | Optional ISO 8601 |

**Response: `201 Created`** — created log object

---

### Update Mood Log
`PATCH /api/mood-logs/:id`  *(requires auth)*

All fields optional. **Response: `200 OK`**. **Errors:** `403` not owner, `404` not found

---

### Delete Mood Log
`DELETE /api/mood-logs/:id`  *(requires auth)*

Returns `204 No Content`. **Errors:** `403` not owner, `404` not found

---

## Medications

### List Medications
`GET /api/medications`  *(requires auth)*

**Response: `200 OK`**
```json
[{ "id": "uuid", "name": "Lisinopril", "dosage": "10mg", "frequency": "daily", "isActive": true }]
```

---

### Create Medication
`POST /api/medications`  *(requires auth)*

**Request:**
```json
{ "name": "Lisinopril", "dosage": "10mg", "frequency": "daily" }
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required |
| `dosage` | string | Optional |
| `frequency` | string | Optional |

**Response: `201 Created`**. **Errors:** `400` validation failed

---

### Update Medication
`PATCH /api/medications/:id`  *(requires auth)*

All fields optional. **Response: `200 OK`**. **Errors:** `403` not owner, `404` not found

---

### Delete Medication
`DELETE /api/medications/:id`  *(requires auth)*

Returns `204 No Content`. **Errors:** `403` not owner, `404` not found

---

## Medication Logs

### List Medication Logs
`GET /api/medication-logs`  *(requires auth)*

**Query params:** `startDate`, `endDate`, `limit` (default 50), `offset` (default 0)

**Response: `200 OK`**
```json
[{ "id": "uuid", "medicationId": "uuid", "taken": true, "takenAt": null, "notes": null, "medication": { "id": "uuid", "name": "Lisinopril", "dosage": "10mg" } }]
```

---

### Create Medication Log
`POST /api/medication-logs`  *(requires auth)*

**Request:**
```json
{ "medicationId": "uuid", "taken": true, "takenAt": "2026-11-20T08:00:00Z", "notes": null }
```

| Field | Type | Rules |
|---|---|---|
| `medicationId` | string | Required UUID |
| `taken` | boolean | Required |
| `takenAt` | string | Optional ISO 8601 |
| `notes` | string | Optional |

**Response: `201 Created`**. **Errors:** `400` validation failed, `403` medication belongs to different user, `404` medication not found

---

### Update Medication Log
`PATCH /api/medication-logs/:id`  *(requires auth)*

All fields optional. **Response: `200 OK`**. **Errors:** `403` not owner, `404` not found

---

### Delete Medication Log
`DELETE /api/medication-logs/:id`  *(requires auth)*

Returns `204 No Content`. **Errors:** `403` not owner, `404` not found

---

## Habits

### List Habits
`GET /api/habits`  *(requires auth)*

Returns system habits (`userId = null`) plus the user's own, filtered to `isActive = true`.

**Response: `200 OK`**
```json
[{ "id": "uuid", "name": "Exercise", "trackingType": "BOOLEAN", "unit": null, "userId": null, "isActive": true }]
```

---

### Create Habit
`POST /api/habits`  *(requires auth)*

**Request:**
```json
{ "name": "Water intake", "trackingType": "NUMERIC", "unit": "glasses" }
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | Required |
| `trackingType` | string | Required: `BOOLEAN`, `NUMERIC`, or `DURATION` |
| `unit` | string | Optional |

**Response: `201 Created`**. **Errors:** `400` validation failed

---

### Update Habit
`PATCH /api/habits/:id`  *(requires auth)*

Cannot modify system habits. All fields optional. **Response: `200 OK`**. **Errors:** `403` system habit or not owner, `404` not found

---

### Delete Habit
`DELETE /api/habits/:id`  *(requires auth)*

Cannot delete system habits. Returns `204 No Content`. **Errors:** `403` system habit or not owner, `404` not found

---

## Habit Logs

### List Habit Logs
`GET /api/habit-logs`  *(requires auth)*

**Query params:** `startDate`, `endDate`, `limit` (default 50), `offset` (default 0)

**Response: `200 OK`**
```json
[{ "id": "uuid", "habitId": "uuid", "valueBoolean": true, "valueNumeric": null, "valueDuration": null, "loggedAt": "...", "habit": { "id": "uuid", "name": "Exercise", "trackingType": "BOOLEAN", "unit": null } }]
```

---

### Create Habit Log
`POST /api/habit-logs`  *(requires auth)*

**Request:**
```json
{ "habitId": "uuid", "valueBoolean": true, "notes": null, "loggedAt": "2026-11-20T07:00:00Z" }
```

| Field | Type | Rules |
|---|---|---|
| `habitId` | string | Required UUID |
| `valueBoolean` | boolean | Required if `trackingType = BOOLEAN` |
| `valueNumeric` | number | Required if `trackingType = NUMERIC` |
| `valueDuration` | number | Required if `trackingType = DURATION` (minutes) |
| `notes` | string | Optional |
| `loggedAt` | string | Optional ISO 8601 |

**Response: `201 Created`**. **Errors:** `400` validation failed or wrong value type, `404` habit not found

---

### Update Habit Log
`PATCH /api/habit-logs/:id`  *(requires auth)*

All fields optional. **Response: `200 OK`**. **Errors:** `403` not owner, `404` not found

---

### Delete Habit Log
`DELETE /api/habit-logs/:id`  *(requires auth)*

Returns `204 No Content`. **Errors:** `403` not owner, `404` not found
