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
