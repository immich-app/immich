> [!CAUTION]
> Make sure to use the docker-compose.yml of the current release:
> https://github.com/immich-app/immich/releases/latest/download/docker-compose.yml
> 
> The compose file on main may not be compatible with the latest release.

## S3/MinIO Storage (optional)

Immich can store media in S3-compatible object storage instead of the local `/data` volume.

- Set these in your `.env` (see `docker/example.env` for all options):
  - `IMMICH_STORAGE_ENGINE=s3`
  - `S3_BUCKET=...`
  - Optionally: `S3_REGION`, `S3_ENDPOINT` (for MinIO), `S3_FORCE_PATH_STYLE=true`, and credentials.
- When using S3, the `/data` bind mount in the server service is optional/unused.
- You do not need to set `IMMICH_MEDIA_LOCATION` — the server derives `s3://<bucket>/<prefix>`.

For MinIO, use an HTTP endpoint (e.g., `http://minio:9000`) and set `S3_FORCE_PATH_STYLE=true`.

### Migration (Option B: aws s3 sync)

Copy existing local data to S3, then switch the engine to `s3`.

1) Bulk sync while Immich runs

```bash
aws s3 sync /path/to/upload s3://<bucket>/<optional-prefix>/
```

2) Stop Immich, delta sync, and cut over

```bash
aws s3 sync /path/to/upload s3://<bucket>/<optional-prefix>/ [--delete]
```

3) Set `IMMICH_STORAGE_ENGINE=s3` (and `S3_*` variables) in `.env`, then `docker compose up -d` to restart.

Notes:

- Do not set `IMMICH_MEDIA_LOCATION` when using S3; Immich derives `s3://<bucket>/<prefix>` automatically.
- Database dumps are written under `<prefix>/backups/` in the bucket when S3 is enabled.
- See the full guide: `/docs/administration/s3-storage`.
