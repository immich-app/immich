# Deploying the Shared-Albums fork

This is a community fork of [Immich](https://github.com/immich-app/immich) that
makes assets from albums shared with a user appear in their **main**
experience — not just in a dedicated "Shared albums" section.

The reference fork lives at:

> https://github.com/Wintlink/immich  
> branch: `feature/shared-albums-full-integration` (based on Immich `v2.7.5`)

If you re-fork it under your own GitHub account, just substitute the URL in the
commands below.

## What this fork changes

When user A shares an album with user B, B now sees **the same content as A
does for that album, integrated everywhere**:

- **Main timeline / home grid** — photos from the shared album appear next to B's own.
- **Map** — markers from shared-album photos show up on B's map (cluster drill-in works too).
- **Explore → People** — face names that A assigned are visible to B (read-only — only A can rename, merge, or delete).
- **Explore → Places** — cities/countries/states from shared-album EXIF data appear in B's Places grid and search suggestions.

What stays the same:

- Stock partner sharing, public links, regular album sharing, all upstream flows.
- B cannot edit, archive, favorite, or rename anything in A's namespace — read-only access only.
- No DB schema change vs. upstream `v2.7.5` → seamless rollback.

## Installation on a clean machine

```bash
git clone https://github.com/Wintlink/immich.git
cd immich
git checkout feature/shared-albums-full-integration
cp docker/example.env .env       # then edit .env (see "Required env vars" below)
docker compose --env-file .env -f docker/docker-compose.fork.yml up -d --build
```

The first build compiles the Immich server and machine-learning images from
source — count **10–20 minutes**. Subsequent rebuilds are fast (Docker layer
cache).

Open `http://<host>:2283` once the logs print:

```
Immich Server is listening on port 2283
```

## Required env vars

The fork compose extends the stock variables with one new entry.

```env
# Standard upstream variables (same names, same meaning)
UPLOAD_LOCATION=/absolute/path/to/library
DB_DATA_LOCATION=/absolute/path/to/postgres
DB_PASSWORD=postgres
DB_USERNAME=postgres
DB_DATABASE_NAME=immich
TZ=Europe/Paris

# New for this fork: an external read-only photo tree mounted at
# /mnt/media/external inside the container (declare it as an "External Library"
# in the Immich UI afterwards).
EXTERNAL_LIBRARY_PATH=/absolute/path/to/your/photos
```

> **Tip on Windows + Docker Desktop**: you can use Windows-style paths like
> `D:\photos` directly. Docker Desktop translates them.

## Migrating from a stock Immich install

Because there are **no schema changes**, you can switch a running stock Immich
install to this fork without losing any data — users, faces, albums, EXIF, the
whole library are preserved.

### 1. Backup (highly recommended)

```bash
# Stop current Immich
docker compose down

# Linux/macOS
tar czf immich-backup-$(date +%F).tgz /path/to/library /path/to/postgres
```

```powershell
# Windows PowerShell
$d = Get-Date -Format yyyy-MM-dd
Copy-Item -Recurse "D:\immich" "D:\backup-immich-$d"
```

### 2. Clone the fork next to your existing install

```bash
cd /path/where/your/current/immich/compose/lives/..
git clone https://github.com/Wintlink/immich.git immich-fork
cd immich-fork
git checkout feature/shared-albums-full-integration
```

### 3. Re-use your existing `.env`

```bash
cp /path/to/your/current/.env ./.env
```

Open `.env` and append the new variable if missing:

```env
EXTERNAL_LIBRARY_PATH=/absolute/path/to/your/photos
```

### 4. Build and start

```bash
docker compose --env-file .env -f docker/docker-compose.fork.yml up -d --build
```

> **Why `--env-file .env`?** Without it, Docker Compose looks for `.env` next
> to the compose file (`docker/.env`), not at the repo root. The variables
> would silently expand to empty strings and the start would fail with
> `invalid spec: :/data: empty section between colons`.

### 5. Verify the fork behaviour

Log in as a **non-owner** user who has shared albums:

- Home / Timeline → assets from shared albums appear in the main grid.
- Map → markers from shared-album assets are visible (zoom in for non-clustered photos, click clusters to drill in).
- Explore → People → the names the owner assigned are listed (read-only).
- Explore → Places → cities/countries from shared-album EXIF.

If anything is missing, check `docker logs immich_server` for the suspect
endpoint and open an issue on the fork repo.

### 6. Rolling back to stock Immich

The fork is schema-backward-compatible:

```bash
docker compose --env-file .env -f docker/docker-compose.fork.yml down
cd /path/to/your/original/stock/immich
docker compose up -d
```

Your data is untouched.

## Pulling updates later

```bash
cd immich-fork
git pull origin feature/shared-albums-full-integration
docker compose --env-file .env -f docker/docker-compose.fork.yml up -d --build
```

## Building the mobile (Flutter) app with the fork behaviour

The Docker build only covers the server + web. The mobile app (Flutter) is
built separately and installed from an APK / TestFlight / sideload. The stock
Immich mobile app from the stores will not include the fork changes.

If you want the shared-albums experience on mobile, you need to build the
app yourself:

```bash
cd mobile

# Install Flutter 3.29+ (https://docs.flutter.dev/get-started/install)
flutter pub get

# Regenerate the drift SQL (shared-albums filter for the local timeline)
dart run build_runner build --delete-conflicting-outputs

# Android APK
flutter build apk --release

# iOS (macOS only)
flutter build ios --release
```

The mobile changes made by the fork:

- `mobile/lib/services/map.service.dart` — map markers include shared-album assets by default.
- `mobile/lib/infrastructure/entities/merged_asset.drift` — the local timeline query ORs in assets from shared albums (albums owned by a partner/self OR shared with the user).
- `mobile/openapi/lib/api/timeline_api.dart` — adds `withSharedAlbums` param on `getTimeBucket` / `getTimeBuckets`.

The mobile sync pipeline already downloads shared-album memberships into
local drift tables (`remote_album_asset_entity`, `remote_album_user_entity`),
so the timeline filter simply uses what's already there — no extra sync
required.

## Reporting bugs / contributing

Open an issue on the fork repository:
https://github.com/Wintlink/immich/issues

For bugs that exist upstream too, please file them on the [official Immich
repo](https://github.com/immich-app/immich) instead.
