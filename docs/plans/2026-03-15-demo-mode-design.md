# Demo Mode Design

## Overview

A read-only demo mode that lets visitors experience the full Gallery UI without being able to modify data. An admin uploads curated photos to a dedicated demo user account, and visitors click "Try Demo" on the login page to get an authenticated read-only session.

Lives on a long-lived `demo` branch, periodically rebased/merged from `main`.

## Configuration

Three environment variables control demo mode:

```
IMMICH_DEMO_MODE=true
IMMICH_DEMO_USER_EMAIL=demo@gallery.app
IMMICH_DEMO_USER_PASSWORD=demo
```

- `IMMICH_DEMO_MODE` enables the feature (default: `false`)
- `IMMICH_DEMO_USER_EMAIL` identifies which user account is the demo account
- `IMMICH_DEMO_USER_PASSWORD` is the password for that account (used only server-side for session creation)

The demo user is a regular user created through the admin panel. No schema changes needed.

A `demoMode: boolean` field is added to the public server config endpoint (`/server/config`) so the frontend knows whether to render the "Try Demo" button. The email and password are never exposed to the client.

## Login Flow

### New Endpoint: `POST /auth/demo-login`

- Only available when `IMMICH_DEMO_MODE=true` (returns 404 otherwise)
- Takes no request body
- Server looks up the demo user by `IMMICH_DEMO_USER_EMAIL`, creates a session, returns a standard `LoginResponseDto`
- The web client handles this identically to a regular login (sets cookie, redirects to timeline)

### Login Page UI

A "Try Demo" button appears below the password form, before the OAuth section. Styled as a secondary/outlined button. Only rendered when `serverConfig.demoMode` is `true`.

On click, calls `POST /auth/demo-login` via the SDK and processes the response the same way as `handleLogin()`.

## Write Protection

### Server-Side: Demo Guard

A NestJS interceptor (`server/src/middleware/demo.guard.ts`) runs after authentication on every request. Logic:

1. If demo mode is off, short-circuit (allow)
2. If the authenticated user's email does not match `IMMICH_DEMO_USER_EMAIL`, short-circuit (allow)
3. If the request is GET, allow
4. If the request is POST to an allowlisted read-only endpoint, allow
5. Otherwise, return `403 Forbidden` with message: `"This action is not available in demo mode"`

#### POST Allowlist (read-only endpoints that use POST)

```
POST /search/metadata
POST /search/statistics
POST /search/random
POST /search/large-assets
POST /search/smart
POST /download/info
POST /download/archive
```

The guard is registered globally but has negligible performance impact due to the early short-circuit for non-demo users.

Admin routes are already blocked by existing `@Authenticated({ admin: true })` guards since the demo user is a regular (non-admin) user.

### Client-Side: UI Hiding

The `AuthManager` tracks an `isDemo` flag (set when login is initiated via `/auth/demo-login`).

Hidden/disabled for demo users:

- Upload button (top bar + drag-and-drop)
- Delete/trash buttons
- Edit actions (rotate, crop, metadata edit)
- Album create/edit/delete
- Settings page (hidden from sidebar)
- User profile edit
- Shared link creation
- "Add to album" actions

Visible for demo users:

- Timeline, map, search, explore, people, memories
- Album/space browsing (read-only)
- Asset detail view (info panel, EXIF data)
- Download

Implementation: `{#if !isDemo}` blocks in ~4-5 container components (sidebar, action bars, asset viewer toolbar). Not every individual button.

If someone navigates directly to a write route (e.g. `/admin`), redirect to timeline with a toast: "Not available in demo mode."

## Files Changed

| File                                           | Change                                       |
| ---------------------------------------------- | -------------------------------------------- |
| `server/src/repositories/config.repository.ts` | Read `IMMICH_DEMO_*` env vars into `EnvData` |
| `server/src/middleware/demo.guard.ts`          | **New file** — write-protection interceptor  |
| `server/src/services/auth.service.ts`          | Add `demoLogin()` method                     |
| `server/src/controllers/auth.controller.ts`    | Add `POST /auth/demo-login` endpoint         |
| `server/src/dtos/server-config.dto.ts`         | Add `demoMode` to public config response     |
| `web/src/routes/auth/login/+page.svelte`       | "Try Demo" button                            |
| `web/src/lib/managers/auth-manager.svelte.ts`  | `isDemo` flag                                |
| ~4-5 web layout/component files                | `{#if !isDemo}` conditionals                 |

**Not touched:** Database schema, migrations, core permission system, mobile app.

**Estimated scope:** ~10 files, ~200-300 lines added.

## Branch Strategy

- Long-lived `demo` branch based off `main`
- All changes are additive (new files + conditional blocks) — merge conflicts should be rare
- Periodically merge `main` into `demo` to pick up new features
