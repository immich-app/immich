# Switching Back to Immich

This guide walks through switching a Gallery instance back to upstream [Immich](https://github.com/immich-app/immich). It runs a cleanup script that strips Gallery-only schema from your database so that the vanilla `immich-server` image will start against it.

:::danger
**This is a one-way, destructive operation.** The cleanup script drops every Gallery-only table and column. Anything stored only in Gallery-specific features is permanently lost. At minimum, you will lose:

- Shared spaces (members, assets, person clusters, libraries, activity, audit history)
- User groups and memberships
- Classification categories and prompts
- Pet detection results
- Asset duplicate checksums
- Library sync state

Assets you uploaded through Gallery are preserved, as long as they exist in Immich-native tables (which is the normal case for every file uploaded via the web or mobile app).

**The right answer is to restore the `pg_dump` you took before switching to Gallery.** Use this script only if you skipped that step.
:::

## 1. Back up your database

Even if you plan to run the cleanup script, take a `pg_dump` first so you can roll back if something goes wrong.

```bash
docker exec immich_postgres pg_dump -U postgres -d immich \
  > gallery-pre-revert-$(date +%F).sql
```

Store this file somewhere outside your Gallery install directory.

## 2. Stop the Gallery stack

The cleanup script takes `ACCESS EXCLUSIVE` locks on many tables — a running server will either deadlock with it or race it. Stop every app container, but keep the database up so the script can connect:

```bash
docker compose stop immich-server immich-machine-learning
```

Leave `immich_postgres` (and `immich_redis`, if you run it) running.

## 3. Download the cleanup script

The script lives at [`scripts/revert-to-immich.sql`](https://github.com/open-noodle/gallery/blob/main/scripts/revert-to-immich.sql) in the Gallery repository. Download it into your working directory:

```bash
curl -O https://raw.githubusercontent.com/open-noodle/gallery/main/scripts/revert-to-immich.sql
```

Read the script header before running it — it lists every table and column it will drop.

## 4. Run the cleanup script

Copy the script into the postgres container and run it with `psql`:

```bash
docker cp revert-to-immich.sql immich_postgres:/tmp/
docker exec immich_postgres psql -U postgres -d immich \
  -v ON_ERROR_STOP=1 \
  -c "SET gallery.revert_token = 'i_accept_data_loss';" \
  -f /tmp/revert-to-immich.sql
```

Notes:

- The `gallery.revert_token` setting is a deliberate speed-bump. The script refuses to run without it, so you cannot execute it by accident.
- `ON_ERROR_STOP=1` is important: without it, `psql` will keep going past the first error and leave the database in a half-cleaned state. The script wraps everything in a transaction, so a mid-script failure rolls the whole thing back.
- On success, the last line of output reads:
  ```
  NOTICE: revert-to-immich: cleanup finished. Switch your image to ghcr.io/immich-app/immich-server and start the stack.
  ```

## 5. Switch your compose file to upstream Immich

Edit your `docker-compose.yml` and replace every reference to the Gallery image with the upstream `immich-server` image. Pin a version close to the Immich release Gallery was last rebased from — you can find it in [`server/package.json`](https://github.com/open-noodle/gallery/blob/main/server/package.json) in the Gallery repository, under the `version` field.

```yaml
services:
  immich-server:
    image: ghcr.io/immich-app/immich-server:v2.7.5 # replace with the version matching your Gallery install
```

Upstream Immich uses the same [postgres image](https://github.com/immich-app/base-images) as Gallery, so no database image change is needed.

If you set any Gallery-only environment variables, remove them from your `.env` file — upstream Immich will log warnings about unknown settings otherwise.

## 6. Start the stack

```bash
docker compose up -d
docker compose logs -f immich-server
```

Watch the server log. A successful boot ends with the usual Immich startup banner and no migration errors. If you see a "missing migration" or "corrupted migrations" error, the cleanup did not complete — restore your `pg_dump` from step 1 and open an issue on the Gallery repository with the full error output.

## What was removed

For transparency, here is what the cleanup script changes:

- **Drops Gallery-only tables**: `shared_space*`, `library_user`, `library_audit`, `library_asset_audit`, `shared_space_library*`, `user_group`, `user_group_member`, `classification_category`, `classification_prompt_embedding`, `storage_migration_log`, `asset_duplicate_checksum`.
- **Drops Gallery-added columns**: `person.type`, `person.species`, `asset_job_status.petsDetectedAt`, `asset_job_status.classifiedAt`, `library.createId`.
- **Drops Gallery-only functions and triggers** that reference the dropped tables.
- **Strips the `classification` key** out of the `system-config` row in `system_metadata`.
- **Deletes fork migration rows** from `kysely_migrations` and `migration_overrides`, so upstream Immich's migrator does not see them as unknown migrations.
- **Rolls back upstream migrations that Gallery pulled in after the currently supported Immich tag** when needed. Gallery may be rebased onto upstream commits newer than the Immich release you switch back to, so the script also removes those migration rows and reverses their schema changes before vanilla Immich starts.

The script's own header documents every step in detail.
