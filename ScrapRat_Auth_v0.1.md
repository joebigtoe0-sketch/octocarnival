# ScrapRats — Authentication & Account System v0.1

## Overview

ScrapRats uses email + password authentication backed by the Node.js/Express backend.
Progress is always saved to `localStorage` first (guest mode), and optionally synced to the backend database when the player is logged in.

---

## User States

| State | Description |
|-------|-------------|
| **Guest** | Default. Progress lives in `localStorage` under `scraprats.save.v4`. No account required. |
| **Logged in** | `userId` + `username` stored in Zustand + persisted. Backend syncs save on each auto-save tick. |

---

## Auth Endpoints (Backend)

All routes live under `/api/auth/`.

### `POST /api/auth/email`

Register or log in with email + password.

**Body:**
```json
{
  "email": "rat@sewer.net",
  "password": "s3cr3t",
  "register": true,        // true = create new account
  "username": "RatLord420" // only required when register = true
}
```

**Response (success):**
```json
{
  "userId": "uuid-...",
  "username": "RatLord420",
  "token": "JWT..."
}
```

**Response (error):**
```json
{ "error": "Email already in use" }
```

The JWT is set as an `httpOnly` cookie (`scraprats_token`) and is also returned in the response body for clients that prefer header-based auth. The cookie has `SameSite=Strict; Secure` in production.

---

### `POST /api/auth/logout`

Clears the auth cookie.

---

### `GET /api/auth/me`

Returns the current user if a valid token cookie is present. Used on page load to restore session silently.

**Response:**
```json
{
  "userId": "uuid-...",
  "username": "RatLord420"
}
```

Returns `401` if not authenticated.

---

### `POST /api/auth/guest-merge`

Merges a guest's `localStorage` save into the authenticated account after login/register. Call this immediately after a successful auth when the player had existing guest progress.

**Body:**
```json
{ "saveData": { ... } }   // raw Zustand persisted state
```

---

## Frontend Flow

### On Page Load

1. `Game.jsx` mounts → `authApi.me()` is called silently.
2. If a valid session cookie exists, `store.setUser(userId, username)` is called and `store.isGuest` becomes `false`.
3. If no session, the player continues as a guest.

> **Note:** The silent `me()` call is not yet wired in this version. Add it to the `useEffect` on mount in `Game.jsx` when the backend is deployed.

### Opening the Auth Modal

- **Settings** → "REGISTER" / "LOGIN" buttons call `ui.openAuth('register' | 'login')`.
- **HUD guest CTA** ("SAVE PROGRESS" pill under the EXP plate) calls `ui.openAuth('register')`.
- **Timed prompts** appear at 3 minutes and 30 minutes of guest play, offering Register and Login buttons.

### After Successful Auth

1. `store.setUser(userId, username)` is called.
2. `store.isGuest` becomes `false` — the guest prompts and CTA button disappear.
3. If the player had guest progress, `authApi.guestMerge(saveData)` should be called to push it to the server.

---

## Token Storage

| Where | What |
|-------|------|
| `httpOnly` cookie | JWT (`scraprats_token`) — set by the backend, invisible to JS |
| Zustand + `localStorage` | `userId`, `username` — used to display the username in Settings |

The game save itself (`scraprats.save.v4`) always lives in `localStorage` and is additionally synced to PostgreSQL via `gameApi.saveState()` when the player is authenticated.

---

## Guest Prompts

Two timed prompts appear for guest players:

| Trigger | Message |
|---------|---------|
| 3 minutes of play | "Your progress isn't saved! Create a free account." |
| 30 minutes of play | "Don't lose your progress! You've been playing for 30 minutes as a guest." |

Both show **Create Account** and **Log in** buttons. They can be dismissed with the ✕ button. The timers are reset if the player logs in before the trigger fires.

---

## Future Work

- Google OAuth (`POST /api/auth/google`)  
- Password reset email flow  
- Silent `me()` call on mount to auto-restore sessions  
- Server-side save conflict resolution (server wins if newer `lastTickTime`)  
- Account deletion  
