# Immich Server with encrypted locked folders

As of August 2026, Immich's "Locked Folder" is just a PIN that controls *visibility* in the UI. Nothing is
actually hidden from the server admin — the underlying asset files sit on disk exactly like any other photo, so
anyone with filesystem or backup access to the server can open them directly, PIN or no PIN. This repo is a drop-in
replacement for the `immich-server` image likely used in your Docker Compose setup. It adds real encryption-at-rest
for Locked Folder assets (originals, thumbnails, previews, and transcoded video), so that even the server's
admin, or anyone with raw access to the filesystem/backups, can't view them without the owning user's password.

The Locked Folder PIN unlock flow itself is completely unchanged — same UX, same API, same clients. This is a
server-only change: no web/mobile app modifications are required, and no API contract changes were made.

## How it works

- **DEK (Data Encryption Key)** — a random 256-bit key, generated once per user, that actually encrypts/decrypts
  asset bytes (AES-256-GCM). The plaintext DEK is never stored.
- **KEK (Key Encryption Key)** — derived from the user's password via `scrypt` plus a per-user random salt. Also
  never stored; it's re-derived from the password whenever needed, and used only to "wrap" (encrypt) the DEK for
  storage on the `user` row.
- **Session-KEK** — because the Locked Folder unlock uses a PIN, not the password, and because the server only
  ever sees the plaintext password briefly during login, each login session gets its own independent wrapping of
  the DEK, keyed off that session's own access token. This lets an active session decrypt/encrypt assets for its
  entire lifetime without re-prompting for the password, while the PIN continues to do exactly what it always
  did: gate *visibility* of Locked Folder assets to sessions that have been unlocked.
- **Encryption timing** — rather than encrypting at upload time, assets are encrypted the moment they're moved
  into the Locked Folder (`visibility = Locked`), since that's a normal authenticated request that already has
  access to the session's DEK. Background jobs (thumbnail generation, metadata extraction, transcoding, ML) never
  touch ciphertext — they either already produced their derivatives before the asset was locked, or they detect
  the asset is encrypted and skip re-processing it.
- **Decryption** — happens on demand, per request, for original downloads, thumbnails, video playback (including
  HTTP Range/seek support), and bulk zip downloads — provided the requesting session has a resolvable DEK. If it
  doesn't, the server refuses to serve raw ciphertext as if it were a normal file; it returns an error instead of
  silently corrupting the response.

For the full design rationale, data model, and known limitations, see
[`.claude/encrypted-locked-folder.md`](.claude/encrypted-locked-folder.md).

## Known limitations

- **OAuth-only accounts** (no password ever set) currently can't get a DEK at all, so their Locked Folder assets
  stay unencrypted — same as today's behavior, not a regression, but not yet solved either.
- **Assets already in the Locked Folder before upgrading**, or assets locked while no session DEK was available,
  are not retroactively encrypted. There's no background migration; encryption only happens going forward, on
  sessions that have password-derived key material available.
- **Scrubbing/seeking in encrypted videos re-decrypts the whole file per seek** (AES-GCM's auth tag covers the
  entire file, so partial/random-access decryption isn't possible without a different on-disk format). This is a
  real CPU cost for large videos, not just a theoretical one.
- This only protects data **at rest**. It does nothing to change Immich's existing in-app access-control model —
  PIN-gated visibility, session/API-key permissions, etc. are all unchanged.

## Using this image

This is meant to be a drop-in replacement for `ghcr.io/immich-app/immich-server` in your existing Docker Compose
setup — no config, environment variable, or client changes required.

1. Build the image from this repository:

   ```bash
   docker build -f server/Dockerfile -t immich-server-encrypted .
   ```

2. In your `docker-compose.yml`, point the `immich-server` service at your locally built image instead of the
   upstream one:

   ```yaml
   services:
     immich-server:
       image: immich-server-encrypted
       # image: ghcr.io/immich-app/immich-server:${IMMICH_VERSION:-release}  # previous line
   ```

3. Restart the stack (`docker compose up -d`). Existing data, sessions, and settings are unaffected — the new
   `wrappedDek`/`kekSalt`/`kekNonce`/encryption-related columns are added via normal migrations

4. Log out and log back in to generate a DEK

5. Move a file into the locked folder (or out of, and then back into) to encrypt

## ⚠️ Disclaimer

This is exploratory, community-modified code, not an official Immich feature, and it has not been reviewed or
endorsed by the Immich maintainers. Treat it as experimental: back up your data before running it, review the
design notes above, and don't rely on it as your only safeguard for sensitive photos. As always with self-hosted
software handling personal data, use at your own risk.
