# Testing improved video face detection (isolated from your main Immich)

With multi-frame video face detection enabled, the server samples **several frames per video** using **Admin → Machine learning → Video sampling** (defaults: explicit fractions **0.25 / 0.5 / 0.75**; you can switch to evenly spaced counts, fixed steps like 0.1, and optionally include the video **preview** image as an extra pass). It runs the **same** facial-recognition ML pipeline upstream Immich uses, and stores `timestampMs` / `frameIndex` on `asset_face`. No extra services, no “phone home” beyond what a normal Immich stack already does (e.g. ML model cache in the machine-learning container).

Use a **separate** stack so your production library, database, and ports stay untouched.

## 1. Isolate the test instance

Standard Immich practice: different **project name**, **ports**, **upload path**, and **database data path** than your main install.

1. Copy the `docker/` folder (or your usual compose setup) to a new directory, e.g. `C:\immich-test` (not inside your main Immich folder).
2. Create a **new** `.env` there (do not reuse the main `.env`).
3. Set at least:

| Variable | Purpose |
|----------|--------|
| `COMPOSE_PROJECT_NAME` | e.g. `immich-test` so containers/volumes/names don’t clash with `immich` |
| `IMMICH_VERSION` | Tag you build for this fork, or `release` if testing upstream images without your changes |
| Port mapping | Map host port **other than 2283** if your main Immich uses 2283, e.g. `3283:2283` in `docker-compose.yml` |
| `UPLOAD_LOCATION` | A **new empty folder** on disk for this test only |
| `DB_DATA_LOCATION` | A **new empty folder** for Postgres data for this test only |
| `DB_PASSWORD` / `DB_USERNAME` / `DB_DATABASE_NAME` | Can differ from production; must match `.env` |

4. If you use the **same machine** as main Immich, also use a **different** Redis/Postgres **container name** implicitly via `COMPOSE_PROJECT_NAME`; avoid reusing `${UPLOAD_LOCATION}` / `${DB_DATA_LOCATION}` from production.

Build **your** server image from this repo when you want to validate the fork (see Immich developer docs / `Makefile` / `docker` README for the exact build target used in your workflow).

## 2. Test media

- Use a **short video you already own** (phone clip, screen recording) where **faces are visible** toward the **start**, **middle**, and **end** so the default sampling positions (or your configured fractions) have something to detect.
- No special sample files or extra downloads are required beyond what a normal Immich install already uses (e.g. ML models in the machine-learning container cache on first use, same as production).

## 3. Apply migrations and run

From your test compose directory:

```bash
docker compose up -d
```

Run DB migrations the same way you do for any Immich upgrade (e.g. server entrypoint on first start, or documented `migrations:run` against the test DB URL). After migration, `asset_face` should include nullable columns `timestampMs` and `frameIndex`.

## 4. Enable facial recognition and upload

1. Open the test UI on the **test port** (e.g. `http://localhost:3283`).
2. Create an admin user (first login).
3. Under **Administration → Machine learning**, ensure **facial recognition** is enabled (same as a normal setup).
4. Upload your test video and wait for the pipeline (metadata → thumbnails → **face detection** job).

## 5. How to tell it’s working

### Logs (no SQL required)

On the **test** stack only, check **immich_server** logs for lines like:

- Face detection frame extract (warnings if a seek fails are OK; fallback uses preview).
- `faces detected` / `Detected … new faces` for the asset.

### Database (optional)

Connect to the **test** Postgres only, e.g.:

```sql
SELECT id, "assetId", "timestampMs", "frameIndex", "boundingBoxX1"
FROM asset_face
WHERE "assetId" = '<your-video-asset-id>';
```

For videos processed with multi-frame sampling, you can see **multiple rows** for the same `assetId` with different `timestampMs` / `frameIndex` (still images typically have both columns `NULL`).

### UI

In **People**, faces detected from mid/end of a clip should still cluster into people; exact “jump to timestamp” in the video player is a possible future UI improvement—the backend stores the time offset for that.

## 6. What “success” means for this feature

| Situation | Expected behavior |
|-----------|---------------------|
| Video + valid `duration` + extraction succeeds | Up to **N** detection passes (N = number of sampling fractions, max 5); faces get non-null `timestampMs` / `frameIndex` where applicable |
| Video but duration missing/invalid, or all extractions fail | Falls back to **one** pass using the existing **preview** image (same as classic behavior); `timestampMs` / `frameIndex` stay null for those rows |
| Still images | Unchanged: single preview; temporal columns null |

### People thumbnails (person face tiles)

When `timestampMs` is set on the face row used for a person’s thumbnail, the **PersonGenerateThumbnail** job seeks to that time and extracts a frame with the **same** `extractVideoFramesForFaceDetection` helper as face detection, then crops the face—so the People UI matches the sampled moment, not necessarily the asset’s grid preview frame. If `timestampMs` is null (preview-only detection), cropping uses the preview image as before.

## 7. Unit tests (developers)

From `server/`:

```bash
npm install
npm run test -- --run src/services/person.service.spec.ts
```

This includes a test that multi-frame extraction triggers multiple `detectFaces` calls for video assets when extraction returns frames.

---

**Summary:** Same Immich components (Postgres, Redis, server, machine-learning), **separate** compose project and data dirs, your **own** video files, then verify logs and/or `asset_face` temporal columns on the test database only.
