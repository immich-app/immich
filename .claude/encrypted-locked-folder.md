# Encrypted-at-rest Locked Folder — Design & Progress Notes

## Goal

Immich already has a "Locked Folder" concept: assets can be flagged `AssetVisibility.Locked`
(`server/src/enum.ts`), hidden from the normal timeline, and only become visible again for a limited time
after the user unlocks their session with a PIN code (`server/src/services/auth.service.ts`:
`setupPinCode` / `changePinCode` / `resetPinCode` / `unlockSession` / `lockSession`,
`server/src/controllers/auth.controller.ts`: `POST /auth/pin-code`, `PUT /auth/pin-code`,
`DELETE /auth/pin-code`, `POST /auth/session/unlock`, `POST /auth/session/lock`).

**Today this is purely a visibility flag — the underlying asset files are not encrypted at rest.** The goal of
this work is to make locked-folder assets *actually* encrypted on disk, so that someone with raw filesystem/backup
access can't view them without the user's credentials.

**Hard constraint: no frontend/API contract changes.** Web/mobile clients must keep working exactly as they do
today — same login request/response shape, same PIN-unlock UX, same asset endpoints. Everything below is designed
to be implementable purely as internal server changes.

## Terminology

- **DEK (Data Encryption Key)** — a random symmetric key that will (eventually) encrypt/decrypt the actual asset
  file bytes for locked-folder assets. Generated once per user.
- **KEK (Key Encryption Key)** — a key derived from the user's password via a slow KDF (`scrypt`) plus a per-user
  random salt. **Never stored** — it's re-derived from the password on demand.
- **Wrapping** — encrypting the DEK with a KEK (AES-256-GCM). The result (the "wrapped DEK") is what actually
  gets persisted; the plaintext DEK is not.
- **Session-KEK** — a *second*, independent KEK derived from a session's own raw access token (not the
  password), used to give an active login session standing access to the DEK for its lifetime, without needing
  the password again on every request. See "Session-scoped DEK caching" below.

## Client authentication model (confirmed, informs the design below)

Traced through `server/src/services/auth.service.ts` (`validate`, `validateSession`, `getBearerToken`,
`getCookieToken`), `mobile/lib` (auth provider/services, `NetworkRepository`), and `web`'s account settings:

- **Web and mobile use the exact same session-token mechanism**, just carried differently: web relies on an
  httpOnly cookie (`respondWithCookie`), mobile takes the raw `accessToken` from `LoginResponseDto` and attaches
  it as a header on every request. Both resolve through the identical `validateSession(token, headers)` server
  code path — hash the raw token, look up the same `session` row, check the same `pinExpiresAt`. No
  client-specific handling is needed anywhere in this design; whichever transport carried the token, the server
  sees the same raw value before hashing it.
- **The password is never persisted client-side, on either platform.** It lives only in the login form's
  in-memory state for the duration of a single `/auth/login` request, then is discarded. The only thing
  persisted long-term is the random `accessToken` (mobile: `Store`/secure widget storage; web: httpOnly cookie).
  This is not an implementation detail — it's *why* the session-scoped DEK caching design (below) has to exist:
  the server gets exactly one opportunity to ever see the plaintext password (login, or a password-set/change
  request), and must stash any password-derived result somewhere that survives using only what the client does
  keep and resend — the access token.
- One related but distinct persisted client-side secret: the mobile app *does* store the Locked Folder **PIN**
  in secure storage (`kSecuredPinCode`) to support biometric convenience unlock. This is unrelated to DEK/KEK —
  it's used purely to silently resubmit the PIN to `unlockSession` after a successful biometric check.
- Mobile has no API-key-based auth path at all; it only ever goes through the same `login()`/`callback()` flows
  as web.

## Current schema (implemented)

`server/src/schema/tables/user.table.ts` — three nullable `character varying` columns on `user`:

| Column       | Contents                                                                          |
| ------------ | ---------------------------------------------------------------------------------- |
| `wrappedDek` | base64: AES-256-GCM ciphertext of the DEK, with the auth tag appended             |
| `kekSalt`    | base64: random salt used to derive the KEK from the password via `scrypt`        |
| `kekNonce`   | base64: the AES-GCM nonce/IV used when wrapping the DEK                          |

Migration: `server/src/schema/migrations/1787748624454-AddWrappedDekFieldsToUsers.ts`.

`server/src/schema/tables/session.table.ts` — two nullable `character varying` columns on `session`:

| Column       | Contents                                                                                    |
| ------------ | --------------------------------------------------------------------------------------------- |
| `wrappedDek` | base64: AES-256-GCM ciphertext of the DEK, re-wrapped under this session's own session-KEK   |
| `dekNonce`   | base64: the AES-GCM nonce/IV used for that session-level wrap                                |

Migration: `server/src/schema/migrations/1787749000000-AddWrappedDekFieldsToSessions.ts`.

All user-level DEK columns are only selected by `userRepository.getByEmail(email, { withPassword: true })` and
`userRepository.getForChangePassword(id)` (i.e. bundled with contexts that already handle the plaintext
password), not by default — see the "sensitive columns" convention in `server/CLAUDE.md`.

## Crypto primitives (implemented)

`server/src/repositories/crypto.repository.ts`:

- `generateDek()` — `randomBytes(32)`.
- `generateKekSalt()` — `randomBytes(16)`.
- `deriveKek(password, salt)` — `scryptSync(password, salt, 32)`. Chose `scrypt` over Argon2id because it's
  built into Node's `node:crypto` with no new dependency; revisit if a stronger KDF is desired later.
- `wrapDek(dek, kek)` — AES-256-GCM encrypt; returns `{ wrappedDek: ciphertext+authTag, nonce }`.
- `unwrapDek(wrappedDek, nonce, kek)` — inverse of the above; throws if the KEK/nonce/ciphertext don't match
  (GCM auth tag verification).
- `deriveSessionKek(token)` — `hashSha256('immich-session-dek:' + token)`. Domain-separated from the plain
  `hashSha256(token)` already used elsewhere as the session's DB lookup hash, so the same value is never reused
  as both a lookup key and encryption key material. No `scrypt` needed — the token already has 256 bits of
  CSPRNG entropy, unlike a human password.

Corresponding hand-written test mocks added to `server/test/repositories/crypto.repository.mock.ts` — required
for every method above, see "Unit test mocks" note in `server/CLAUDE.md`.

## Decided & implemented: session-scoped DEK caching (resolves the password-vs-PIN question)

Previously flagged as an open question: the Locked Folder UX unlocks with a **PIN**, not the password, but the
DEK is wrapped using the password. Resolution — **these stay fully separate, not unified**:

- **PIN stays exactly as it is today** — a pure authorization/visibility gate
  (`session.pinExpiresAt` / `hasElevatedPermission`), completely unchanged. It already only gates *whether an
  already-authenticated session may see `AssetVisibility.Locked` assets at all* — see
  `server/src/utils/access.ts` (`checkOtherAccess`) and `server/src/repositories/access.repository.ts`
  (`AssetAccess.checkOwnerAccess`, `AssetFileAccess.checkOwnerAccess`), which both gate strictly on
  `auth.session?.hasElevatedPermission`.
- **The password's job is solely to make the DEK available for the lifetime of a login session**, via a second,
  independent wrapping keyed off of that session's own raw access token (the session-KEK):
  1. At `POST /auth/login`, after password verification, `login()` ends up with the plaintext DEK in hand either
     way — freshly generated (first login ever) or unwrapped from the user's stored `wrappedDek` using the
     just-verified password (every other login). `createLoginResponse()` derives a session-KEK from the fresh
     raw session token it generates, wraps the DEK with it, and stores the result on the new `session` row.
  2. On every subsequent authenticated request, the server already has the raw token and already looks the
     session row up by its hash (`validateSession`) — it can derive the same session-KEK and unwrap
     `session.wrappedDek` on demand. No additional user interaction, no new request/response fields.
  3. Deleting a session (logout, `invalidateAll`, `cleanup`) automatically discards its session-wrapped DEK.
  4. Changing the password only re-wraps the **user-level** `wrappedDek` — the DEK's plaintext bytes never
     change, so existing sessions' session-level wraps remain valid across a password change.

**Security framing:** this doesn't meaningfully change Immich's threat model. `hasElevatedPermission` (and
therefore all Locked Folder access) is *already* restricted to real session-token logins — API keys and shared
links have no `auth.session` at all and are already unconditionally denied `AssetVisibility.Locked` access today.

### What was implemented

- `server/src/services/auth.service.ts`:
  - `login()` now always ends up with the plaintext DEK in hand: generates one (as before) if the user has none
    yet, or **unwraps the existing one using the just-verified password** if they do (new — previously this path
    did nothing). Unwrap failures are caught and logged rather than failing the login (see "Known cost" below).
  - `generateUserDek()` now returns the plaintext `Buffer` it generated (previously void).
  - New `unwrapUserDek(user, password)` helper, shared by `login()` and `changePassword()`.
  - `createLoginResponse()` signature changed from positional `(user, loginDetails, oauthSid?, oauthBearerToken?)`
    to `(user, loginDetails, options?: { oauthSid?, oauthBearerToken?, dek? })`. When a `dek` is passed, it
    derives a session-KEK from the session's own fresh raw token, wraps the DEK, and persists
    `session.wrappedDek`/`session.dekNonce` alongside the new session row. `LoginResponseDto`'s shape is
    unchanged. The OAuth `callback()` call site was updated to the new options-object form but never passes a
    `dek` (see OAuth limitations below) — OAuth-created sessions simply get `wrappedDek: null`.
- `server/src/repositories/user.repository.ts`: `getForChangePassword()` now also selects `wrappedDek`,
  `kekSalt`, `kekNonce` (needed by `changePassword()`'s re-wrap, below).
- Schema/migrations for the new `session.wrappedDek`/`session.dekNonce` columns (see schema section above).

### Known cost

Every password login for a returning user now runs one extra `scrypt` derivation (to unwrap the existing DEK),
where previously DEK-related crypto only ran once ever, on a user's very first login. Same cost class as the
`bcrypt` check that already happens on every login.

## Fixed as a hard prerequisite of the above: `changePassword()` DEK re-wrap

This was previously tracked as a standalone "nice to have" (TODO #1), but implementing session-scoped DEK
caching turned it into a **blocking correctness requirement**, not an optional follow-up:

Before this fix, `login()` never touched an existing `wrappedDek` at all, so a stale `kekSalt`/`kekNonce` left
over from before a password change was simply inert — the DEK became unrecoverable, but nothing ever tried to
unwrap it, so login itself kept working. Once `login()` started unconditionally trying to unwrap the existing
DEK on every login (needed for session-scoped caching), an un-rewrapped DEK after a password change would cause
`unwrapDek`'s AES-GCM auth tag check to fail on every subsequent login — turning a silent, contained bug (DEK
inaccessible) into a much worse one (an exception on every login attempt, caught defensively in `login()` so it
doesn't actually break auth, but this would have been the moment a real bug turned into a real incident).

**Implemented in `changePassword()`:** before persisting the new password hash, if the user has an existing
`wrappedDek`, it's unwrapped using a KEK derived from the *old* (just-verified) password, then immediately
re-wrapped using a KEK derived from the *new* password + a fresh `kekSalt`/`kekNonce`, and all three columns are
updated in the same `userRepository.update()` call as the password hash. This does not touch any already-issued
session's `session.wrappedDek` — those remain valid as-is, unaffected by the user-level re-wrap (see point 4
above).

## The OAuth problem (investigated, not fully solved — documented limitation)

Two distinct populations, with different severity:

**1. Pure OAuth users (`password === null`, never set one) — currently a hard, unresolved gap.**
`callback()`'s auto-registration path never sets a password, so `user.password` stays `null` forever unless
something explicitly sets it. Checked whether the *existing, already-shipped* UI could bootstrap one without any
new UI: it can't. `web/src/routes/(user)/user-settings/ChangePasswordSettings.svelte` is shown unconditionally to
every user (not gated on `oauthId`), but it only ever calls `POST /auth/change-password`
(`AuthService.changePassword`), whose `validateSecret()` immediately returns `false` if `existingHash` (i.e.
`user.password`) is falsy — so *any* value a password-less user types as "current password" is rejected. There is
no self-service path in the currently-shipped clients for a pure-OAuth user to set an initial password. (The one
endpoint that could, `PUT /users/me` / `updateMe`, sets `password` unconditionally without checking an old one —
but no shipped UI calls it for this purpose; it's what the *admin* "reset a user's password" flow uses today.)

**2. Hybrid users (have a password, but exclusively use the OAuth login button in practice) — solvable with zero
UI changes, not yet implemented.** These users already have `wrappedDek` capability, but the DEK
bootstrap/unwrap in this design only runs inside password `login()`. If they never use the password form, it
never triggers, even though nothing is actually blocking them. Fix: also trigger bootstrap-or-rewrap from
`changePassword()`/`updateMe()` — anywhere the server legitimately holds the plaintext password already, not
just `/auth/login`. **Not implemented in this pass** — `changePassword()`'s new logic only *re-wraps an existing*
DEK; it does not *generate* one for a user who doesn't have one yet. That's a small, well-scoped follow-up.

Options considered for population 1, from least to most invasive (see conversation history for full pros/cons
table): (A) accept the limitation, pure-OAuth accounts keep today's unencrypted-but-functional Locked Folder
behavior; (B) repurpose the existing admin "reset password" UI as an admin-driven bootstrap; (C) derive a KEK
from the PIN instead, for password-less accounts only (materially weaker — PINs are low-entropy); (D) a
recovery-key model shown once to the user (the "textbook correct" fix, but requires new UI, which is explicitly
out of scope for this pass). **Recommendation, not yet acted on:** ship (A) for now — no regression, nothing
new required — and revisit (B)/(C)/(D) as a deliberate, separate decision later.

## Implemented: TODO #3 — encrypting/decrypting asset bytes at rest

The biggest open item was "nothing actually encrypts/decrypts asset bytes yet." Implementing it surfaced a new
architectural constraint not previously documented, which then drove the design below.

### The background-job DEK problem (discovered, resolved by design choice)

Background job processors (thumbnail generation, metadata extraction, video transcoding, face
detection/ML, etc.) run fully decoupled from any HTTP request — they're identified only by `assetId`, with no
`auth`/session in scope at all. The session-scoped DEK design (above) means the plaintext DEK is *only* ever
recoverable from an active request that has a real session token — so a job processor has no way to get it.
This matters because if encryption were applied at upload time (synchronously in `uploadAsset()`, which does
have a session), every downstream job that reads `asset.originalPath` directly and hands it to an external
process (`exiftool`, `ffmpeg`, `sharp`) — `MetadataService.handleMetadataExtraction`,
`MediaService.handleGenerateThumbnails`, `MediaService.handleVideoConversion`, live photo/motion-photo
extraction, face detection, smart search/CLIP — would immediately start failing to parse ciphertext as media,
since those jobs run asynchronously, after the request that had the DEK has already returned.

**Resolution: encrypt at the moment an asset transitions into `AssetVisibility.Locked`, not at upload time.**
`AssetService.updateAll()` is itself an authenticated request — the session making the "lock this asset" call
already has (or can derive) its own DEK, same as any other request. By the time a Timeline asset is later moved
into the Locked Folder, all of its derivatives (thumbnail, preview, fullsize, transcoded video, extracted
metadata) already exist on disk from when it was a normal asset — nothing downstream needs to re-read the
original in the common case. This sidesteps the background-job DEK problem entirely for the *initial* encryption
step, at the cost of not covering later *reprocessing* of an already-encrypted asset (see guards below) or
bulk-locking assets uploaded directly as Locked with no prior Timeline period followed by a job run before the
lock (out of scope for this pass — see TODO #8).

### What was implemented

- **`CryptoRepository`** (`server/src/repositories/crypto.repository.ts`): two new streaming primitives,
  `createEncryptStream(dek)` (fresh AES-256-GCM cipher + random nonce) and `createDecryptStream(dek, nonce,
  authTag)` (matching decipher, auth tag set up front so it can be used as a plain Transform stream). Chose
  streaming over whole-buffer encrypt/decrypt (unlike `wrapDek`/`unwrapDek`, which are fine for a 32-byte DEK)
  because asset files can be arbitrarily large (multi-GB video) — buffering a whole file in memory to
  encrypt/decrypt it would be a real problem.
- **Schema**: two new nullable columns on `asset`, migration
  `server/src/schema/migrations/1787750000000-AddEncryptionFieldsToAssets.ts`:
  | Column               | Contents                                                                          |
  | -------------------- | ---------------------------------------------------------------------------------- |
  | `encryptionNonce`    | base64 AES-GCM nonce/IV used to encrypt `originalPath`, when non-null            |
  | `encryptionAuthTag`  | base64 AES-GCM auth tag for the ciphertext at `originalPath`, when non-null      |

  Presence of `encryptionNonce` is the "is this asset's original encrypted at rest" flag — no separate boolean,
  consistent with the `user.wrappedDek`/`session.wrappedDek` presence-based pattern. Unlike the DEK-wrapping
  columns, these are **not** treated as sensitive (a GCM nonce/tag is public information in AEAD schemes; only
  the key is secret) — they're included in `columns.asset`/`columns.searchAsset`/`MapAsset` without any opt-in
  gating, and are selected wherever the relevant job-repository queries already select `originalPath`.
- **`AuthSession.rawToken`** (`server/src/database.ts`): the session's own raw (unhashed) access token, now
  carried on `AuthDto.session` for the lifetime of a single request (populated in
  `AuthService.validateSession()`). Named `rawToken`, not `token`, specifically to avoid colliding with the DB
  `session.token` column (which stores only the hash) — test factories build `AuthDto.session` directly from
  DB `Session` rows in places, and a same-named field with an incompatible type (`Buffer` vs `string`) breaks
  the type-check. Never persisted or serialized to any response DTO.
- **`BaseService.resolveSessionDek(auth)`** (`server/src/services/base.service.ts`): the lazy, opt-in DEK
  resolution helper anticipated in the original TODO. Looks up `session.wrappedDek`/`dekNonce` via
  `sessionRepository.get(id, { withDek: true })` (new opt-in option, mirrors the `withPassword`/`withDek`
  convention), derives the session-KEK from `auth.session.rawToken`, and unwraps. Returns `null` (never throws)
  if there's no session, no wrapped DEK yet, or unwrapping fails — callers must treat `null` as "this
  asset/session isn't encrypted," not as an error. Placed on `BaseService` (rather than a new
  `AssetService → AuthService` dependency) since `sessionRepository`/`cryptoRepository` are already available
  to every service.
- **`AssetService.encryptLockedAssets()`** (called from `updateAll()` when `visibility === Locked`): resolves
  the current session's DEK; if unavailable, logs and returns without blocking the visibility change (same
  best-effort philosophy as `login()`'s DEK bootstrap) — Locked Folder keeps working exactly as before for that
  case, just unencrypted, matching today's behavior. Otherwise, for each newly-locked asset that isn't already
  encrypted (`encryptionNonce` already set → skipped, handles re-locking/duplicate calls), streams
  `originalPath` through the cipher to a `.encrypting` temp file, then renames it over the original — an
  encrypt-in-place with a single atomic rename, no window where a half-written file has the final name.
  Persists `encryptionNonce`/`encryptionAuthTag` via `assetRepository.update()`. Errors for one asset are caught
  and logged per-asset, not fatal to the batch.
- **`AssetMediaService.downloadOriginal()`**: if the resolved asset's original is encrypted (and the edited
  derivative isn't being served instead — edits are never encrypted, see below), resolves the *current* request's
  session DEK and builds a decrypt transform; if no DEK is available for this session, throws
  `ForbiddenException` rather than ever serving raw ciphertext as if it were the real file (silently degrading
  here would be a data-corruption bug for the client, not a graceful fallback — differs from the "best effort"
  philosophy used at encryption time). This is also a soft second factor in practice: `hasElevatedPermission`
  (PIN) already gates all Locked access, and now decrypting the bytes additionally requires a password-login
  session with its own resolvable DEK.
- **`ImmichFileResponse`/`sendFile()`** (`server/src/utils/file.ts`): new optional `decrypt?: (cipherStream:
  Readable) => Readable` field. When set, `sendFile` pipes the raw file bytes through it instead of delegating
  to `res.sendFile()`. Originally shipped with no HTTP Range/seek support; **Range support was added in a later
  pass** (see "Thumbnail/preview/video-derivative encryption" below) once this turned out to actually break
  video playback outright, not just scrubbing — see the Range-support bullet there.
- **Reprocessing guards**: `MediaService.handleGenerateThumbnails`, `MediaService.handleVideoConversion`, and
  `MetadataService.handleMetadataExtraction` all now check `asset.encryptionNonce` first and return
  `JobStatus.Skipped` (same pattern already used for `AssetVisibility.Hidden`) rather than attempting to hand
  ciphertext to `sharp`/`ffmpeg`/`exiftool`. This is what makes it safe that these jobs have no DEK: they simply
  decline to touch an encrypted original at all, rather than needing one. Practical effect: if a user later
  triggers "Refresh metadata" or "Regenerate thumbnails" for an asset that was encrypted after those derivatives
  already existed, the job is a no-op — existing derivatives are left as-is, nothing crashes. Added
  `'asset.encryptionNonce'` to the corresponding `AssetJobRepository` query selects
  (`getForGenerateThumbnailJob`, `getForVideoConversion`; `getForMetadataExtraction` already picked it up via
  `columns.asset`).
- **`DownloadService.downloadArchive()`** (bulk zip download): originally skipped encrypted-original assets with
  a warning log rather than zipping up raw ciphertext under the asset's real filename/extension. **Fixed in a
  later pass** (see "Bulk zip download now decrypts encrypted assets" below) — no longer skipped.

### Not yet implemented / explicitly deferred in this pass

- **Thumbnails/preview/fullsize/transcoded-video files are now also encrypted** at lock time and decrypted at
  unlock time, alongside `asset.originalPath` — see "Thumbnail/preview/video-derivative encryption" below
  (formerly TODO #8, now done). Range/seek support for video playback (noted below) is also now implemented.
- **`viewThumbnail`/`playbackVideo` now both decrypt** derivative files when encrypted (see below) — no longer
  deferred. **Range/seek support has been added** to the `decrypt` transform path in `sendFile()`
  (`server/src/utils/file.ts`) — see "Range support for encrypted streaming responses" below for how, and its
  performance trade-off.
- **Bulk zip download (`DownloadService`) now decrypts encrypted assets** rather than skipping them — see "Bulk
  zip download now decrypts encrypted assets" below (formerly TODO #9, now done).
- **Assets that were `Locked` before this feature shipped, or ones locked without a resolvable session DEK,
  stay unencrypted indefinitely** — nothing ever retries. See TODO #4 (unchanged from before).

### Thumbnail/preview/video-derivative encryption (formerly TODO #8, now done)

- **Schema**: `AssetFileTable` (`server/src/schema/tables/asset-file.table.ts`) has nullable
  `encryptionNonce`/`encryptionAuthTag` columns, mirroring the `asset` table's pair, since one asset can have
  several `asset_file` rows (thumbnail, preview, fullsize, encoded video, sidecar, ...).
- **`AssetService.encryptLockedAssets()`/`decryptUnlockedAssets()`** loop over
  `assetFileRepository.search({ assetId })` for every asset being locked/unlocked and encrypt/decrypt each row's
  `path` in place, reusing the same `encryptOriginalFile`/`decryptOriginalFile` streaming helpers used for
  `asset.originalPath`. This transparently covers the transcoded video file too, since `encodedVideoPath` was
  migrated to live as an `asset_file` row (type `encoded_video`) rather than a column on `asset` — see
  `1773242919341-EncodedVideoAssetFiles.ts`.
- **`AssetRepository.getForThumbnail()`** selects `asset_file.encryptionNonce`/`encryptionAuthTag` alongside
  `path`; **`AssetMediaService.viewThumbnail()`** resolves the session DEK and sets `ImmichFileResponse.decrypt`
  when those are present, exactly like `downloadOriginal()`.
- **`AssetRepository.getForVideo()`** now left-joins `asset_file` (type `encoded_video`) and selects both the
  original's and the encoded video's nonce/authTag separately (`originalEncryptionNonce`/`originalEncryptionAuthTag`
  vs `encodedVideoEncryptionNonce`/`encodedVideoEncryptionAuthTag`), since playback may fall back to
  `originalPath` if no encoded video exists yet, and each has its own independent encryption state.
  **`AssetMediaService.playbackVideo()`** picks whichever pair matches the path actually being served and
  decrypts accordingly. **Bug found and fixed in this pass**: `playbackVideo()` previously never decrypted
  anything at all — it was the reason a locked video's thumbnail rendered fine (via `viewThumbnail`) but the
  video itself failed to play (server was serving raw AES-256-GCM ciphertext bytes as if they were an MP4).
- Tests: `asset-media.service.spec.ts` has decrypt-success/`ForbiddenException`-without-DEK cases for both
  `viewThumbnail` and `playbackVideo`, mirroring the existing `downloadOriginal` ones.

### Range support for encrypted streaming responses (fixes video playback breaking outright, not just scrubbing)

- **Root cause of "thumbnail shows but video won't play" after locking**: fixing `playbackVideo()`'s decrypt
  support (above) turned out to be necessary but not sufficient. Live devcontainer logs showed the same URL
  going from `206 Partial Content` (pre-lock) to `200 OK` (post-lock, same byte range requested) — browsers'
  `<video>` elements issue real `Range` requests even for "play from the start", and `sendFile()`'s `decrypt`
  path (`server/src/utils/file.ts`) ignored `Range` headers entirely, always responding `200` with the full body
  from byte 0. Getting back the wrong response type broke playback outright.
- **Fix**: added `parseByteRange()`, `ByteRangeTransform`, and `sendFileWithDecrypt()` to `file.ts`. Because
  AES-256-GCM's auth tag covers the whole ciphertext, a Range request still decrypts+authenticates the *entire*
  file server-side and only trims the *output* to the requested `[start,end]` window — there's no way to
  randomly-access-decrypt a sub-range of one-shot GCM without re-deriving/verifying from the start. This is a
  CPU-cost trade-off (every seek re-decrypts the whole file), accepted for now; see TODO list for the follow-up
  if this becomes a real problem for larger videos.
- Handles `bytes=N-M`, `bytes=N-` (open-ended), `bytes=-N` (suffix), out-of-bounds -> `416`, and malformed/
  multi-range headers -> falls back to a full `200` response.
- Tests: `server/src/utils/file.spec.ts` (6 tests, real temp file + real streams, no DB needed) covering full
  response / mid-range / open-ended range / suffix range / 416 / malformed-range-fallback.

### Bulk zip download now decrypts encrypted assets (formerly TODO #9, now done)

- **Symptom reported**: downloading a Locked video (or any Locked asset) via the bulk zip-download endpoint
  (`POST /download/archive`, used by the web UI's "Download" action) produced a near-empty file — the
  previous behavior was to silently `continue` past encrypted-original assets rather than adding them to the
  zip at all, so the resulting archive had no entries for them (just the zip's own end-of-central-directory
  bytes, hence "a few bytes, empty file just with the name").
- **Fix**: `StorageRepository.createZipStream()` gained an `addReadable(readable, filename)` method alongside
  the existing `addFile(path, filename)`, implemented via `archiver`'s `.append(stream, opts)` instead of
  `.file(path, opts)`. `DownloadService.downloadArchive()` now resolves the session DEK (once, lazily, and
  caches the `null` result too so it doesn't retry per-asset) when it hits an encrypted-original asset, builds a
  decrypt stream via `cryptoRepository.createDecryptStream()` piped from `storageRepository.createPlainReadStream()`,
  and adds that piped stream to the zip instead of skipping. If no DEK is resolvable for the session (e.g.
  API-key/shared-link auth, or a session created before the user had a DEK), it still falls back to skipping
  that asset with a warning log — same best-effort philosophy as the rest of this feature, never blocks the
  whole download.
- Tests: `download.service.spec.ts` (`downloadArchive`, 2 new tests): decrypts and adds via `addReadable` when a
  session DEK is available; skips (and warns) when no DEK is available, without ever calling `addFile` on
  ciphertext.

## known follow-up work / TODO

1. ~~`changePassword()` does not re-wrap the DEK~~ — **done**, see above.
2. ~~Implement session-scoped DEK caching~~ — **done**, see above.
3. ~~Nothing actually encrypts/decrypts asset bytes~~ — **done**, see "Implemented: TODO #3" and "Thumbnail/
   preview/video-derivative encryption" above. Bulk zip download of encrypted assets is now also fixed — see
   "Bulk zip download now decrypts encrypted assets" above (formerly TODO #9). Video Range/seek support for
   encrypted videos has also been added, with a known CPU-cost trade-off (every seek fully re-decrypts the file) — see above.
4. **Existing locked assets aren't migrated, and neither are assets locked without a resolvable DEK.** No
   background job retries encryption for these — by design, per the background-job DEK problem above, a
   background job *can't* retry this itself. Any future migration path needs to be a foreground, request-scoped
   operation (e.g. re-run at the next login for assets the user owns), not a job.
5. **SQL snapshots not regenerated.** `server/src/queries/user.repository.sql`, `session.repository.sql`, and
   now also `asset.repository.sql` (`getForThumbnail`, `getForVideo`) /`asset.job.repository.sql` have not been
   regenerated against the updated queries (needs a live Postgres instance — see root `CLAUDE.md` for the exact
   command). Do this once a DB is reachable, and check the diff only touches the expected query blocks.
6. **OAuth-only users have no password, and their sessions never get a DEK either.** Still unresolved — see "The
   OAuth problem" section above for the full breakdown and options. Population 2 (hybrid users) has a clear,
   low-risk fix (hook bootstrap into `changePassword`/`updateMe`) that just hasn't been implemented yet. This
   also means: an OAuth-only user's Locked Folder assets can never be encrypted at rest under this design, not
   just at login — `encryptLockedAssets()` will always find `resolveSessionDek()` returning `null` for them and
   silently skip, same as today's pre-existing behavior.
7. **New migrations for the `session` and `asset` tables need applying/regenerating against a real DB** the same
   way the `user` table one does, and their hand-written form should ideally be double-checked against `pnpm run
   migrations:generate` output once a DB is reachable.
8. ~~Thumbnails/preview/fullsize/transcoded-video files for Locked assets are never encrypted~~ — **done**, see
   "Thumbnail/preview/video-derivative encryption" above. ~~Remaining caveat: video Range/seek support is not
   preserved through the decrypt path~~ — **done**, see "Range support for encrypted streaming responses" above.
9. ~~Bulk zip download (`DownloadService.downloadArchive`) skips encrypted assets~~ instead of including them —
   **done**, see "Bulk zip download now decrypts encrypted assets" above.
10. **Scrubbing/seek performance for encrypted video** is a live, not just theoretical, cost now that Range
    support decrypts+authenticates the whole file per seek (see "Range support for encrypted streaming
    responses" above) — user has not yet reported back on whether this is acceptable for their real video
    sizes. If it becomes a real problem, the next step is redesigning on-disk encryption as chunked/seekable
    (e.g. per-block AES-GCM with an index) instead of one-shot whole-file GCM — non-trivial, not started.
11. **SQL snapshot regeneration still pending** for `asset.repository.sql`'s rewritten `getForVideo` join (see
    item 5) — needs to be re-run again since that query changed again in the Range-support pass.

## Testing status

- `server/src/services/auth.service.spec.ts` (90 tests): first-login DEK generation, steady-state
  unwrap-and-session-wrap on subsequent logins, graceful degradation when an existing DEK fails to unwrap, and
  `changePassword`'s DEK re-wrap.
- `server/src/services/asset.service.spec.ts` (`updateAll` › `locked folder encryption`, 3 tests): encrypts the
  original file in place when locking with a DEK available (asserts the session-KEK derivation, the unwrap
  call, the atomic rename, and the persisted nonce/auth tag); does not encrypt or block the visibility change
  when no DEK is available; skips assets that are already encrypted.
- `server/src/services/asset-media.service.spec.ts` (`downloadOriginal`, 2 new tests): decrypts an encrypted
  original when a session DEK is available (asserts `createDecryptStream` is called with the unwrapped DEK and
  the stored nonce/tag); throws `ForbiddenException` (never silently serves ciphertext) when no DEK is
  available for the current session.
- `server/src/services/metadata.service.spec.ts` / `media.service.spec.ts` (3 new tests total): the
  `handleMetadataExtraction`/`handleGenerateThumbnails`/`handleVideoConversion` reprocessing guards return
  `JobStatus.Skipped` and never call into `exiftool`/`sharp`/`ffmpeg` for an asset with `encryptionNonce` set.
- `server/src/services/asset-media.service.spec.ts` (`playbackVideo`, 2 more tests): decrypts an encrypted
  encoded video when a session DEK is available; throws `ForbiddenException` when no DEK is available.
- `server/src/utils/file.spec.ts` (6 tests, new file): `sendFile`'s decrypt+Range path — full response with no
  `Range` header, mid-range (`bytes=N-M`, `206`), open-ended (`bytes=N-`), suffix (`bytes=-N`), out-of-bounds
  range (`416`), and malformed/multi-range header falling back to a full `200` response. Uses a real temp file
  and real Node streams (no DB, no mocked crypto) to exercise `ByteRangeTransform`/`parseByteRange` faithfully.
- `server/src/services/download.service.spec.ts` (`downloadArchive`, 2 new tests): decrypts an encrypted-at-rest
  asset and adds it to the zip via the new `addReadable` path when a session DEK is available (and asserts
  `addFile` is never called with ciphertext); skips (with a warning) when no DEK is available for the session.
- Verified clean: `tsc --noEmit -p tsconfig.json`, `eslint --max-warnings 0` on all touched files, and the full
  non-controller unit test suite (2249+ passed; the only failures are pre-existing sandboxed
  `supertest`/network-`EPERM` errors in `*.controller.spec.ts` files, unrelated to this work — see root
  `CLAUDE.md`).
- No dedicated spec file for the new `CryptoRepository.createEncryptStream`/`createDecryptStream` methods
  themselves (exercised indirectly via the service specs above) — a focused round-trip test (encrypt a buffer,
  decrypt it, assert equality; corrupt the auth tag, assert it throws) would be a reasonable, cheap addition.
- No e2e coverage yet.
- Run a single spec file with:
  `pnpm exec vitest run --config test/vitest.config.mjs <path>` — the `pnpm run test -- <pattern>` form does
  **not** filter to a single file in this repo's vitest config.
