# WellTrack API Reference

Base URL: `/api`

---

## Auth

### Register
`POST /api/auth/register`

Creates a new user account and returns tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "Jane Smith"
}
```

| Field | Type | Rules |
|---|---|---|
| `email` | string | Valid email format |
| `password` | string | Minimum 8 characters |
| `displayName` | string | 1–100 characters |

**Response: `201 Created`**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "Jane Smith",
    "timezone": null,
    "createdAt": "2026-11-20T15:00:00.000Z"
  },
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Errors:**

| Status | Body | Condition |
|---|---|---|
| `400` | `{ "error": "Validation failed", "details": { "email": [...] } }` | Invalid input |
| `409` | `{ "error": "Email already in use" }` | Duplicate email |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |
