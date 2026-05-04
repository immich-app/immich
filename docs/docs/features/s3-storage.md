# S3-Compatible Storage

Gallery supports using S3-compatible object storage (such as AWS S3, MinIO, Cloudflare R2, Backblaze B2, or Wasabi) as the storage backend for new uploads. This is useful for scaling storage independently of the server, leveraging cloud durability, or integrating with existing infrastructure.

:::tip
If you have existing files on disk, you can migrate them to S3 using the built-in [Storage Migration](/features/storage-migration) tool.
:::

## How It Works

When S3 storage is enabled:

- **New uploads** (photos, videos, thumbnails, transcoded videos, profile images) are written to your S3 bucket.
- **Existing files** on disk continue to be served from disk — both backends run simultaneously.
- The [Storage Template](/administration/storage-template) determines the S3 object key at upload time.

Gallery supports two modes for serving files from S3:

| Mode       | Behavior                                                                                                                          |
| :--------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `redirect` | Returns a temporary presigned URL. The client downloads directly from S3. Recommended when the browser can reach the S3 endpoint. |
| `proxy`    | The Gallery server streams the file from S3 to the client. Use only when S3 is not directly reachable by browsers.                |

:::info
The recent direct-media delivery change makes `redirect` the normal S3 mode for browser-reachable buckets. Before switching an existing deployment from `proxy` to `redirect`, apply bucket CORS for your Gallery origins or canvas-based features can fail.
:::

For most deployments, use `redirect`. Only use `proxy` when browsers cannot reach your S3 endpoint directly.

## Environment Variables

All S3 variables are set on the `immich-server` container.

| Variable                         | Description                                                                                                                   |   Default   | Required          |
| :------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :---------: | :---------------- |
| `IMMICH_STORAGE_BACKEND`         | Storage backend for new uploads (`disk` or `s3`)                                                                              |   `disk`    | Yes (set to `s3`) |
| `IMMICH_S3_BUCKET`               | S3 bucket name                                                                                                                |             | Yes               |
| `IMMICH_S3_REGION`               | AWS region (or region of your S3-compatible provider)                                                                         | `us-east-1` | No                |
| `IMMICH_S3_ENDPOINT`             | Custom endpoint URL for S3-compatible services (e.g. MinIO, R2)                                                               |             | No<sup>\*1</sup>  |
| `IMMICH_S3_ACCESS_KEY_ID`        | Access key ID                                                                                                                 |             | No<sup>\*2</sup>  |
| `IMMICH_S3_SECRET_ACCESS_KEY`    | Secret access key                                                                                                             |             | No<sup>\*2</sup>  |
| `IMMICH_S3_PRESIGNED_URL_EXPIRY` | Presigned URL expiration time in seconds (only relevant for `redirect` mode)                                                  |   `3600`    | No                |
| `IMMICH_S3_SERVE_MODE`           | How to serve S3 assets: use `redirect` for normal deployments; `proxy` is the fallback when browsers cannot reach S3 directly | `redirect`  | No                |

\*1: Required for non-AWS S3-compatible services (MinIO, R2, B2, etc.). Omit for AWS S3.

\*2: If omitted, the AWS SDK falls back to IAM role credentials (e.g. EC2 instance roles, ECS task roles, IRSA on EKS). For non-AWS services, these are typically required.

## Setup Guide

### 1. Create an S3 Bucket

<details>
<summary>AWS S3</summary>

1. Open the [AWS S3 Console](https://s3.console.aws.amazon.com/) and click **Create bucket**.
2. Choose a bucket name (e.g. `my-gallery-storage`) and region.
3. Leave "Block all public access" **enabled** — Gallery uses presigned URLs or proxying, so the bucket does not need to be public.
4. Create the bucket.
5. Create an IAM user (or use an existing one) with programmatic access. Attach a policy granting access to your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-gallery-storage", "arn:aws:s3:::my-gallery-storage/*"]
    }
  ]
}
```

6. Note the **Access Key ID** and **Secret Access Key**.

</details>

<details>
<summary>MinIO</summary>

1. Install and start MinIO (or add it to your Docker Compose stack).
2. Open the MinIO Console and create a bucket (e.g. `gallery`).
3. Create an access key pair from the MinIO Console or CLI.
4. Note the **endpoint URL** (e.g. `http://minio:9000` if running in the same Docker network, or `http://<host-ip>:9000` if external).

</details>

<details>
<summary>Cloudflare R2</summary>

1. In the Cloudflare dashboard, go to **R2 Object Storage** and create a bucket.
2. Under **Manage R2 API Tokens**, create a token with read/write access to your bucket.
3. Note the **Account ID** from your Cloudflare dashboard. Your S3 endpoint will be `https://<account-id>.r2.cloudflarestorage.com`.
4. Note the **Access Key ID** and **Secret Access Key** from the API token.

</details>

### 2. Configure Environment Variables

Add the S3 variables to your `.env` file:

```bash title=".env"
IMMICH_STORAGE_BACKEND=s3
IMMICH_S3_BUCKET=my-gallery-storage
IMMICH_S3_REGION=us-east-1
IMMICH_S3_ACCESS_KEY_ID=your-access-key
IMMICH_S3_SECRET_ACCESS_KEY=your-secret-key
```

For S3-compatible services, also set the endpoint:

```bash title=".env"
IMMICH_S3_ENDPOINT=https://your-s3-endpoint.example.com
IMMICH_S3_SERVE_MODE=redirect
```

### 3. Choose a Serve Mode

Pick the mode that fits your setup:

- **`redirect`** (default, recommended) — Use this unless you have a hard network constraint. Gallery authorizes the API request and returns a short-lived presigned URL, so media bytes flow directly from S3 to the browser.
- **`proxy`** — Fallback mode for private-network S3 endpoints. Gallery streams every media byte through the API process, so it costs more server resources and is not the recommended mode for large scrolling grids.

```bash title=".env"
IMMICH_S3_SERVE_MODE=proxy
```

If you change an existing deployment from `proxy` to `redirect`, treat bucket CORS as part of the same rollout.

### 4. Configure CORS For Redirect Mode

Redirect mode keeps the bucket private, but browsers need CORS headers when Gallery draws S3 images to canvas for editing, face crops, and copy-to-clipboard.

Apply this before you enable `IMMICH_S3_SERVE_MODE=redirect` on an existing instance.

Use your real Gallery origins in `AllowedOrigins`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://gallery.example.com", "http://localhost:3000", "http://localhost:2283"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "Content-Type", "ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
```

AWS CLI example:

```bash
aws s3api put-bucket-cors \
  --bucket my-gallery-storage \
  --cors-configuration '{"CORSRules":[{"AllowedOrigins":["https://gallery.example.com","http://localhost:3000","http://localhost:2283"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["Accept-Ranges","Content-Length","Content-Range","Content-Type","ETag"],"MaxAgeSeconds":3600}]}'
```

Do not use `"*"` for production origins if you introduce credentialed browser requests to S3. Gallery media images use anonymous CORS.

If your provider has a bucket CORS UI instead of an AWS-compatible CLI, enter the same origins, methods, headers, and exposed headers there.

### 5. Restart Gallery

Recreate the containers to apply the new environment variables:

```bash
docker compose up -d
```

New uploads will now be stored in your S3 bucket. Existing files on disk will continue to be served normally.

For an existing deployment switching from `proxy` to `redirect`, the safe order is:

1. Apply bucket CORS.
2. Set `IMMICH_S3_SERVE_MODE=redirect`.
3. Recreate the Gallery containers.
4. Verify thumbnails, editing, face crops, copy-to-clipboard, and video playback from a browser.

## Example Configurations

### AWS S3

```bash title=".env"
IMMICH_STORAGE_BACKEND=s3
IMMICH_S3_BUCKET=my-gallery-storage
IMMICH_S3_REGION=eu-west-1
IMMICH_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
IMMICH_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### MinIO (Docker Compose)

```bash title=".env"
IMMICH_STORAGE_BACKEND=s3
IMMICH_S3_BUCKET=gallery
IMMICH_S3_ENDPOINT=http://minio:9000
IMMICH_S3_ACCESS_KEY_ID=minioadmin
IMMICH_S3_SECRET_ACCESS_KEY=minioadmin
IMMICH_S3_SERVE_MODE=proxy
```

:::tip
When MinIO runs in the same Docker Compose stack, use the service name (e.g. `http://minio:9000`) as the endpoint.
Set `IMMICH_S3_SERVE_MODE=proxy` since clients cannot reach the internal Docker network directly.
:::

### Cloudflare R2

```bash title=".env"
IMMICH_STORAGE_BACKEND=s3
IMMICH_S3_BUCKET=my-gallery-storage
IMMICH_S3_ENDPOINT=https://abc123.r2.cloudflarestorage.com
IMMICH_S3_ACCESS_KEY_ID=your-r2-access-key
IMMICH_S3_SECRET_ACCESS_KEY=your-r2-secret-key
```

## FAQ

**Can I migrate existing files from disk to S3?**
Yes! Use the built-in [Storage Migration](/features/storage-migration) tool. It supports bidirectional migration, is resumable and idempotent, and includes rollback support.

**Do I need to make my S3 bucket public?**
No. Gallery uses presigned URLs (in `redirect` mode) or proxies the files through the server (in `proxy` mode). The bucket should remain private.

**What happens if I switch back to disk storage?**
Files already stored in S3 will continue to be served from S3. Only new uploads will go to disk. Both backends are always active.

**Can I use IAM roles instead of access keys?**
Yes. If you omit `IMMICH_S3_ACCESS_KEY_ID` and `IMMICH_S3_SECRET_ACCESS_KEY`, the AWS SDK will use the standard credential chain (environment variables, IAM roles, instance metadata, etc.).

## Technical Implementation

### Storage Abstraction

S3 support is built on a `StorageBackend` interface that both the disk and S3 backends implement:

```
                    StorageBackend interface
                    ├── put(key, source)
                    ├── get(key) → stream
                    ├── exists(key)
                    ├── delete(key)
                    ├── getServeStrategy(key) → file | redirect | stream
                    └── downloadToTemp(key) → tempPath + cleanup

        ┌───────────────────┐         ┌───────────────────┐
        │ DiskStorageBackend│         │ S3StorageBackend   │
        ├───────────────────┤         ├───────────────────┤
        │ Reads/writes to   │         │ AWS SDK v3         │
        │ local filesystem  │         │ @aws-sdk/client-s3 │
        │                   │         │ Multipart uploads  │
        │ getServeStrategy: │         │                    │
        │  → { type: file } │         │ getServeStrategy:  │
        └───────────────────┘         │  redirect mode:    │
                                      │   → presigned URL  │
                                      │  proxy mode:       │
                                      │   → S3 stream      │
                                      └───────────────────┘
```

The `StorageService` manages both backends as static singletons and routes operations based on the file path format.

### Dual Backend Routing

The key insight is that **file path format determines the backend**:

- **Absolute paths** (e.g., `/usr/src/app/upload/library/user/file.jpg`) — legacy disk files, routed to the disk backend.
- **Relative paths** (e.g., `library/user/file.jpg`) — S3 files, routed to the S3 backend.

This means no database schema changes were needed. Existing `originalPath`, `path`, `thumbnailPath`, and `profileImagePath` columns store either format, and the `resolveBackendForKey()` function dispatches to the correct backend at runtime. Both backends are always active — the `IMMICH_STORAGE_BACKEND` setting only controls where **new writes** go.

### Serve Modes

When a client requests an asset, `BaseService.serveFromBackend()` asks the resolved backend for a serve strategy and returns one of three response types:

| Backend | Mode       | Response                 | Client Behavior                                     |
| :------ | :--------- | :----------------------- | :-------------------------------------------------- |
| Disk    | —          | `ImmichFileResponse`     | Express sends the local file directly               |
| S3      | `redirect` | `ImmichRedirectResponse` | HTTP 302 to a presigned URL; client fetches from S3 |
| S3      | `proxy`    | `ImmichStreamResponse`   | Server streams S3 data through to the client        |

Presigned URLs expire after `IMMICH_S3_PRESIGNED_URL_EXPIRY` seconds (default 3600). Gallery sends `Cache-Control: private, no-cache, no-transform` on redirect responses so browsers do not reuse an expired 302. The S3 backend signs content type and filename response overrides when they are available, so inline display and explicit downloads behave consistently after the browser follows the redirect.

The S3 backend uses `forcePathStyle: true` when a custom endpoint is configured, which is required for MinIO, DigitalOcean Spaces, and similar providers.

### Upload Flow

When S3 is the write backend, uploads follow this path:

1. File is uploaded to a local temp directory (standard NestJS multipart handling).
2. The storage template generates a relative key for the S3 object.
3. The file is uploaded to S3 using the `@aws-sdk/lib-storage` `Upload` class (supports automatic multipart for large files).
4. The database is updated with the relative path.
5. A cleanup job deletes the local temp file.

Profile images (both user-uploaded and OAuth-synced) follow the same pattern: the file is written to disk first, then uploaded to S3 if the write backend is S3, and the local temp file is cleaned up.

For operations that require filesystem access (ffmpeg transcoding, exiftool metadata extraction), the S3 backend provides a `downloadToTemp()` method that streams the object to a local temp file and returns a cleanup function.

### Archive Downloads

Album, selection, and shared-link archive downloads work with both disk and S3-backed assets. For S3 assets, Gallery opens object streams lazily and serializes ZIP entry appends so large archives do not exhaust the S3 connection pool. This is most visible in `proxy` mode or when downloading many S3-only assets through the server.

### Cleanup Behavior

Deleting a user removes that user's storage prefix from the active backend. On S3, Gallery lists and deletes all objects under the user's prefix; on disk, it removes the matching directory tree. The cleanup is idempotent, so rerunning a failed delete is safe.

Sidecar copy operations also respect the target asset's backend. Copying XMP metadata from one asset to another downloads the source sidecar to a temporary local file when needed, then writes the target sidecar either to disk or to the relative S3 key for that asset.
