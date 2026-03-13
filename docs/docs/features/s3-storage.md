# S3-Compatible Storage

Immich supports using S3-compatible object storage (such as AWS S3, MinIO, Cloudflare R2, Backblaze B2, or Wasabi) as the storage backend for new uploads. This is useful for scaling storage independently of the server, leveraging cloud durability, or integrating with existing infrastructure.

:::tip
If you have existing files on disk, you can migrate them to S3 using the built-in [Storage Migration](/features/storage-migration) tool.
:::

## How It Works

When S3 storage is enabled:

- **New uploads** (photos, videos, thumbnails, transcoded videos, profile images) are written to your S3 bucket.
- **Existing files** on disk continue to be served from disk — both backends run simultaneously.
- The [Storage Template](/administration/storage-template) determines the S3 object key at upload time.

Immich supports two modes for serving files from S3:

| Mode       | Behavior                                                                                         |
| :--------- | :----------------------------------------------------------------------------------------------- |
| `redirect` | Returns a temporary presigned URL — the client downloads directly from S3. Best for performance. |
| `proxy`    | The Immich server streams the file from S3 to the client. Use when S3 is not directly reachable. |

## Environment Variables

All S3 variables are set on the `immich-server` container.

| Variable                         | Description                                                                           |   Default   | Required          |
| :------------------------------- | :------------------------------------------------------------------------------------ | :---------: | :---------------- |
| `IMMICH_STORAGE_BACKEND`         | Storage backend for new uploads (`disk` or `s3`)                                      |   `disk`    | Yes (set to `s3`) |
| `IMMICH_S3_BUCKET`               | S3 bucket name                                                                        |             | Yes               |
| `IMMICH_S3_REGION`               | AWS region (or region of your S3-compatible provider)                                 | `us-east-1` | No                |
| `IMMICH_S3_ENDPOINT`             | Custom endpoint URL for S3-compatible services (e.g. MinIO, R2)                       |             | No<sup>\*1</sup>  |
| `IMMICH_S3_ACCESS_KEY_ID`        | Access key ID                                                                         |             | No<sup>\*2</sup>  |
| `IMMICH_S3_SECRET_ACCESS_KEY`    | Secret access key                                                                     |             | No<sup>\*2</sup>  |
| `IMMICH_S3_PRESIGNED_URL_EXPIRY` | Presigned URL expiration time in seconds (only relevant for `redirect` mode)          |   `3600`    | No                |
| `IMMICH_S3_SERVE_MODE`           | How to serve S3 assets: `redirect` (presigned URL) or `proxy` (stream through server) | `redirect`  | No                |

\*1: Required for non-AWS S3-compatible services (MinIO, R2, B2, etc.). Omit for AWS S3.

\*2: If omitted, the AWS SDK falls back to IAM role credentials (e.g. EC2 instance roles, ECS task roles, IRSA on EKS). For non-AWS services, these are typically required.

## Setup Guide

### 1. Create an S3 Bucket

<details>
<summary>AWS S3</summary>

1. Open the [AWS S3 Console](https://s3.console.aws.amazon.com/) and click **Create bucket**.
2. Choose a bucket name (e.g. `my-immich-storage`) and region.
3. Leave "Block all public access" **enabled** — Immich uses presigned URLs or proxying, so the bucket does not need to be public.
4. Create the bucket.
5. Create an IAM user (or use an existing one) with programmatic access. Attach a policy granting access to your bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::my-immich-storage", "arn:aws:s3:::my-immich-storage/*"]
    }
  ]
}
```

6. Note the **Access Key ID** and **Secret Access Key**.

</details>

<details>
<summary>MinIO</summary>

1. Install and start MinIO (or add it to your Docker Compose stack).
2. Open the MinIO Console and create a bucket (e.g. `immich`).
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
IMMICH_S3_BUCKET=my-immich-storage
IMMICH_S3_REGION=us-east-1
IMMICH_S3_ACCESS_KEY_ID=your-access-key
IMMICH_S3_SECRET_ACCESS_KEY=your-secret-key
```

For S3-compatible services, also set the endpoint:

```bash title=".env"
IMMICH_S3_ENDPOINT=https://your-s3-endpoint.example.com
```

### 3. Choose a Serve Mode

Pick the mode that fits your setup:

- **`redirect`** (default) — Best for performance. The client is redirected to a presigned URL and downloads directly from S3. Requires the client to be able to reach the S3 endpoint.
- **`proxy`** — The Immich server fetches the file from S3 and streams it to the client. Use this if your S3 endpoint is not reachable by clients (e.g. MinIO on an internal network).

```bash title=".env"
IMMICH_S3_SERVE_MODE=proxy
```

### 4. Restart Immich

Recreate the containers to apply the new environment variables:

```bash
docker compose up -d
```

New uploads will now be stored in your S3 bucket. Existing files on disk will continue to be served normally.

## Example Configurations

### AWS S3

```bash title=".env"
IMMICH_STORAGE_BACKEND=s3
IMMICH_S3_BUCKET=my-immich-storage
IMMICH_S3_REGION=eu-west-1
IMMICH_S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
IMMICH_S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### MinIO (Docker Compose)

```bash title=".env"
IMMICH_STORAGE_BACKEND=s3
IMMICH_S3_BUCKET=immich
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
IMMICH_S3_BUCKET=my-immich-storage
IMMICH_S3_ENDPOINT=https://abc123.r2.cloudflarestorage.com
IMMICH_S3_ACCESS_KEY_ID=your-r2-access-key
IMMICH_S3_SECRET_ACCESS_KEY=your-r2-secret-key
```

## FAQ

**Can I migrate existing files from disk to S3?**
Yes! Use the built-in [Storage Migration](/features/storage-migration) tool. It supports bidirectional migration, is resumable and idempotent, and includes rollback support.

**Do I need to make my S3 bucket public?**
No. Immich uses presigned URLs (in `redirect` mode) or proxies the files through the server (in `proxy` mode). The bucket should remain private.

**What happens if I switch back to disk storage?**
Files already stored in S3 will continue to be served from S3. Only new uploads will go to disk. Both backends are always active.

**Can I use IAM roles instead of access keys?**
Yes. If you omit `IMMICH_S3_ACCESS_KEY_ID` and `IMMICH_S3_SECRET_ACCESS_KEY`, the AWS SDK will use the standard credential chain (environment variables, IAM roles, instance metadata, etc.).
