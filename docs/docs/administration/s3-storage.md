# S3/MinIO Storage

Immich can store all Immich‑managed media (originals, thumbnails, generated videos, backups) in S3‑compatible object storage instead of the local `/data` volume. This is useful when you want durable, scalable storage and/or to decouple storage from the server host.

## Enable/Disable

- Enable object storage by setting the engine to `s3` and providing S3 details via environment variables.
- Disable by setting the engine back to `local`. No data is deleted automatically; you control what to keep/clean up.

Required variables (see example.env for full list):

- `IMMICH_STORAGE_ENGINE=s3`
- `S3_BUCKET=<your-bucket>`
- Optional:
  - `S3_REGION=us-east-1`
  - `S3_PREFIX=<optional/path/prefix>` (folder under the bucket)
  - `S3_ENDPOINT=http://minio:9000` and `S3_FORCE_PATH_STYLE=true` for MinIO or path‑style endpoints
  - `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (or use IAM)
  - `S3_USE_ACCELERATE=false` (AWS Transfer Acceleration, only if enabled on the bucket)
  - `S3_SSE` and `S3_SSE_KMS_KEY_ID` for server‑side encryption

Notes:

- Do not set `IMMICH_MEDIA_LOCATION` when using S3. Immich derives `s3://<bucket>/<prefix>` automatically.
- When the engine is `s3`, the `/data` bind mount is optional/unused by the server.

## Migration (aws s3 sync)

This method copies existing local data to S3 using the AWS CLI and then switches Immich to S3. It reduces downtime by performing a bulk copy while Immich remains operational, followed by a quick cut-over. This is also a good opportunity to run a database dump backup in case you need to restore it.

1) Bulk sync while Immich runs

- Identify your local upload path on the host (the `UPLOAD_LOCATION` folder mounted to the server container as `/data`).
- Perform an initial sync to S3. Avoid `--delete` on the first pass.

```bash
aws s3 sync /path/to/upload s3://<bucket>/<optional-prefix>/
```

2) Short downtime, delta sync, and cut‑over

- Stop Immich (or at least the server) to quiesce writes.
- Run a second sync to copy any recent changes. Optionally add `--delete` if you want a strict mirror.

```bash
aws s3 sync /path/to/upload s3://<bucket>/<optional-prefix>/ [--delete]
```

- Update your environment to enable S3 (see variables above), then restart Immich.
- On startup, Immich detects the new media location and rewrites stored paths from the previous base to `s3://<bucket>/<prefix>`.

3) Verify

- Browse the library and download a few items.
- Check server logs for the media location migration message.
- List your bucket to confirm content layout:

```bash
aws s3 ls s3://<bucket>/<optional-prefix>/backups/
```

4) Optional cleanup

- Once you are satisfied with the cut‑over, you may archive or remove the old local data at `UPLOAD_LOCATION`.

## Database Dumps on S3

When S3 is enabled, the automatic “Create Database Dump” job writes `.sql.gz` backups under:

```
s3://<bucket>/<optional-prefix>/backups/
```

Immich handles listing, retention, and cleanup in that prefix.

## MinIO and other S3‑compatible endpoints

- Set `S3_ENDPOINT` to the HTTP(S) URL and `S3_FORCE_PATH_STYLE=true`.
- Do not enable `S3_USE_ACCELERATE`.

## Rolling back

- Set `IMMICH_STORAGE_ENGINE=local` and restart. Immich will continue to use your local `/data` volume. If needed, you can sync back from S3 using `aws s3 sync s3://<bucket>/<prefix>/ /path/to/upload` before switching.

