# Deploying Wintlink/immich on your server

This fork adds **"shared albums with full integration"** on top of upstream Immich v2.7.5:

- Timeline includes assets from albums shared with you
- Map markers include assets from shared albums
- People / faces named by the album owner are visible to users the album is shared with

This guide assumes you already have a working Immich install on your server using
the standard `ghcr.io/immich-app/immich-server:release` image, and you want to
swap it for this fork **without losing your data**.

## 1. Backup first

```bash
# Stop current Immich
docker compose down

# Backup the Postgres data directory (path comes from your .env DB_DATA_LOCATION)
tar czf immich-postgres-backup-$(date +%F).tgz /path/to/postgres
# Backup the upload library too
tar czf immich-library-backup-$(date +%F).tgz /path/to/library
```

## 2. Clone the fork next to your existing Immich folder

```bash
cd /path/where/your/current/immich/compose/lives/..
git clone https://github.com/Wintlink/immich.git immich-fork
cd immich-fork
```

## 3. Re-use your existing .env

Copy your current `.env` into the fork root:

```bash
cp /path/to/your/current/.env ./.env
```

Then edit it and make sure it has these variables (add any missing):

```env
# Paths that already existed in your stock Immich .env
UPLOAD_LOCATION=/absolute/path/to/library
DB_DATA_LOCATION=/absolute/path/to/postgres
DB_PASSWORD=...
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
TZ=Europe/Paris

# New for this fork
EXTERNAL_LIBRARY_PATH=/absolute/path/to/D_Famille_on_your_server
ALBUM_CREATOR_API_KEY=generated_in_immich_ui   # only if you keep the folder-album-creator service
```

The compose file looks for `.env` at the **repo root** (`../.env` from
`docker/`), not inside `docker/`.

## 4. Build and start

First build can take 10-20 minutes (server + ML images compile from source).
Run from the **repo root** so `.env` is picked up:

```bash
docker compose --env-file .env -f docker/docker-compose.fork.yml up -d --build
```

(Without `--env-file .env`, Docker Compose looks next to the compose file
and the `${UPLOAD_LOCATION}` / `${DB_DATA_LOCATION}` / `${EXTERNAL_LIBRARY_PATH}`
variables silently expand to empty strings.)

Watch logs while the server boots:

```bash
docker compose --env-file .env -f docker/docker-compose.fork.yml logs -f immich-server
```

Once you see `Immich Server is listening on port 2283`, open `http://<server>:2283`.
Your existing users, albums, photos and face names are intact — the schema is
backward-compatible with v2.7.5, we only added columns/tables.

## 5. Verify the new behaviour

Log in as a **non-owner** user who has shared albums:

- **Home / Timeline** — assets from shared albums now appear in the main grid.
- **Map** — markers from shared-album assets show up (if their photos have GPS).
- **Explore / People** — the names the owner assigned are now listed (read-only
  for the shared user — they cannot rename or merge).

If any of this is not working, check:

```bash
docker compose -f docker/docker-compose.fork.yml logs immich-server | grep -i shared
```

## 6. Building the mobile (Flutter) app with the fork behaviour

The Docker build only covers the server + web. The mobile app (Flutter) is
built separately and installed from an APK / TestFlight / sideload. Stock
Immich mobile from the stores will not include the fork changes.

If you want the shared-albums experience on mobile, you need to build the
app yourself:

```bash
cd mobile

# Install Flutter 3.29+ (https://docs.flutter.dev/get-started/install)
flutter pub get

# Regenerate the drift SQL (shared-albums filter for timeline)
dart run build_runner build --delete-conflicting-outputs

# Android APK
flutter build apk --release

# iOS (macOS only)
flutter build ios --release
```

The mobile changes made by the fork:

- `mobile/lib/services/map.service.dart` — map markers include shared-album assets by default.
- `mobile/lib/infrastructure/entities/merged_asset.drift` — the local timeline query now ORs in assets from shared albums (albums owned by a partner/self OR shared with the user).
- `mobile/openapi/lib/api/timeline_api.dart` — adds `withSharedAlbums` param on `getTimeBucket` / `getTimeBuckets` (mirrors the server DTO).

Note: the mobile sync pipeline already downloads shared-album memberships into
local drift tables (`remote_album_asset_entity`, `remote_album_user_entity`),
so the timeline filter simply uses what's already there — no extra sync
required.

## 7. Pulling updates later

```bash
cd immich-fork
git pull origin feature/shared-albums-full-integration
docker compose --env-file .env -f docker/docker-compose.fork.yml up -d --build
```

## Rolling back to stock Immich

If something goes wrong, the fork is schema-backward-compatible:

```bash
docker compose -f docker/docker-compose.fork.yml down
cd /path/to/original/stock/immich
docker compose up -d   # back on ghcr.io/immich-app/immich-server:release
```

Your data is untouched.
