# S3 Startup Health Check

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When S3 is configured as the storage backend, verify connectivity at startup and fail fast with a clear error if S3 is unreachable.

**Architecture:** Add a health check method to `S3StorageBackend` that performs a lightweight S3 operation (e.g. `HeadBucket`), then call it from `StorageService.onBootstrap()` right after constructing the S3 backend. If it fails, throw `ImmichStartupError` with a descriptive message.

**Tech Stack:** `@aws-sdk/client-s3` (`HeadBucketCommand`), NestJS bootstrap lifecycle

---

## Context

- **The problem:** If S3 is configured but unreachable (e.g. MinIO not running), uploads silently fail with no error at startup. Users only discover the problem when they try to upload.
- **Storage service startup:** `server/src/services/storage.service.ts:77` — `onBootstrap()` initializes backends. It already validates that `IMMICH_S3_BUCKET` is set when backend is `s3`, but doesn't verify the bucket is actually reachable.
- **S3 backend:** `server/src/backends/s3-storage.backend.ts` — has an `S3Client` instance. Already imports `HeadObjectCommand` from `@aws-sdk/client-s3`.
- **Startup error pattern:** `ImmichStartupError` is used elsewhere for fatal startup failures (see line 91 of storage.service.ts).
- **Tests:** Unit tests in `server/src/backends/s3-storage.backend.spec.ts`, service tests in `server/src/services/storage.service.spec.ts`.

## Files

- Modify: `server/src/backends/s3-storage.backend.ts`
- Modify: `server/src/services/storage.service.ts`
- Modify: `server/src/backends/s3-storage.backend.spec.ts`
- Modify: `server/src/services/storage.service.spec.ts`

## Implementation

### Task 1: Add `checkConnection()` to S3StorageBackend

**Files:**

- Modify: `server/src/backends/s3-storage.backend.ts`
- Test: `server/src/backends/s3-storage.backend.spec.ts`

**Step 1: Write the failing test**

In `s3-storage.backend.spec.ts`, add:

```typescript
describe('checkConnection', () => {
  it('should resolve when bucket is reachable', async () => {
    mockClient.on(HeadBucketCommand).resolves({});
    await expect(backend.checkConnection()).resolves.not.toThrow();
  });

  it('should throw when bucket is unreachable', async () => {
    mockClient.on(HeadBucketCommand).rejects(new Error('connect ECONNREFUSED'));
    await expect(backend.checkConnection()).rejects.toThrow('connect ECONNREFUSED');
  });
});
```

**Step 2: Implement `checkConnection()`**

In `s3-storage.backend.ts`, add the import and method:

```typescript
import { DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';

// ... inside the class:

async checkConnection(): Promise<void> {
  await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
}
```

`HeadBucket` is the cheapest S3 operation — zero data transfer, just checks if the bucket exists and is accessible. Also validates credentials.

**Step 3: Run tests**

```bash
cd server && pnpm test -- --run src/backends/s3-storage.backend.spec.ts
```

**Step 4: Commit**

```bash
git add server/src/backends/s3-storage.backend.ts server/src/backends/s3-storage.backend.spec.ts
git commit -m "feat: add checkConnection() to S3StorageBackend"
```

### Task 2: Call health check from StorageService.onBootstrap()

**Files:**

- Modify: `server/src/services/storage.service.ts`
- Test: `server/src/services/storage.service.spec.ts`

**Step 1: Write the failing test**

In `storage.service.spec.ts`, add a test that expects startup to fail when S3 is configured but unreachable. Use the existing test setup patterns in the file.

```typescript
it('should throw ImmichStartupError when S3 is configured but unreachable', async () => {
  // Mock env to return s3 backend config with a bucket
  // Mock checkConnection to reject
  // Expect onBootstrap to throw ImmichStartupError with message about S3 unreachable
});
```

**Step 2: Add the health check call**

In `storage.service.ts`, after the S3 backend is constructed (line 86-88), add:

```typescript
if (envData.storage.s3.bucket) {
  StorageService.s3Backend = new S3StorageBackend(envData.storage.s3);
  try {
    await StorageService.s3Backend.checkConnection();
    this.logger.log(`S3 storage backend configured (bucket: ${envData.storage.s3.bucket})`);
  } catch (error: any) {
    throw new ImmichStartupError(
      `Failed to connect to S3 bucket "${envData.storage.s3.bucket}": ${error.message}. ` +
        'Check that the bucket exists, credentials are correct, and the endpoint is reachable.',
    );
  }
}
```

**Step 3: Run tests**

```bash
cd server && pnpm test -- --run src/services/storage.service.spec.ts
```

**Step 4: Commit**

```bash
git add server/src/services/storage.service.ts server/src/services/storage.service.spec.ts
git commit -m "feat: fail fast on startup when S3 bucket is unreachable"
```
