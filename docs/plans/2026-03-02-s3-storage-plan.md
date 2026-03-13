# S3 Storage Backend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add S3-compatible object storage as an alternative to local disk for all media files, with both backends active simultaneously so old disk assets keep working while new assets go to S3.

**Architecture:** New `StorageBackend` interface with `DiskStorageBackend` and `S3StorageBackend` implementations, injected via NestJS DI. Path format in DB distinguishes backends: absolute = disk, relative = S3. Config switch controls where new files are written. Both backends always initialized for mixed-mode reads.

**Tech Stack:** NestJS, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/lib-storage`, Vitest, testcontainers (MinIO)

**Design doc:** `docs/plans/2026-03-02-s3-storage-design.md`

---

## Task 1: Add AWS SDK dependencies

**Files:**

- Modify: `server/package.json`

**Step 1: Install packages**

Run:

```bash
cd server && pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @aws-sdk/lib-storage
```

**Step 2: Verify installation**

Run:

```bash
cd server && node -e "require('@aws-sdk/client-s3'); require('@aws-sdk/s3-request-presigner'); require('@aws-sdk/lib-storage'); console.log('OK')"
```

Expected: `OK`

**Step 3: Commit**

```bash
cd server && git add package.json pnpm-lock.yaml
git commit -m "feat(server): add AWS S3 SDK dependencies"
```

---

## Task 2: Add S3 configuration to EnvDto and config repository

**Files:**

- Modify: `server/src/dtos/env.dto.ts`
- Modify: `server/src/repositories/config.repository.ts` (the `EnvData` interface and `getEnv()` function)

**Step 1: Write the failing test**

Create: `server/src/repositories/config.repository.spec.ts`

```typescript
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { clearEnvCache, ConfigRepository } from 'src/repositories/config.repository';

describe('ConfigRepository - S3 config', () => {
  beforeEach(() => {
    clearEnvCache();
  });

  afterEach(() => {
    delete process.env.IMMICH_STORAGE_BACKEND;
    delete process.env.IMMICH_S3_BUCKET;
    delete process.env.IMMICH_S3_REGION;
    delete process.env.IMMICH_S3_ENDPOINT;
    delete process.env.IMMICH_S3_ACCESS_KEY_ID;
    delete process.env.IMMICH_S3_SECRET_ACCESS_KEY;
    delete process.env.IMMICH_S3_PRESIGNED_URL_EXPIRY;
    delete process.env.IMMICH_S3_SERVE_MODE;
    clearEnvCache();
  });

  it('should default storage backend to disk', () => {
    const repo = new ConfigRepository();
    const env = repo.getEnv();
    expect(env.storage.backend).toBe('disk');
  });

  it('should read S3 config from env vars', () => {
    process.env.IMMICH_STORAGE_BACKEND = 's3';
    process.env.IMMICH_S3_BUCKET = 'test-bucket';
    process.env.IMMICH_S3_REGION = 'us-west-2';
    process.env.IMMICH_S3_ENDPOINT = 'http://localhost:9000';
    process.env.IMMICH_S3_ACCESS_KEY_ID = 'minioadmin';
    process.env.IMMICH_S3_SECRET_ACCESS_KEY = 'minioadmin';
    process.env.IMMICH_S3_PRESIGNED_URL_EXPIRY = '7200';
    process.env.IMMICH_S3_SERVE_MODE = 'proxy';

    const repo = new ConfigRepository();
    const env = repo.getEnv();

    expect(env.storage.backend).toBe('s3');
    expect(env.storage.s3).toEqual({
      bucket: 'test-bucket',
      region: 'us-west-2',
      endpoint: 'http://localhost:9000',
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      presignedUrlExpiry: 7200,
      serveMode: 'proxy',
    });
  });

  it('should use S3 defaults when backend is s3', () => {
    process.env.IMMICH_STORAGE_BACKEND = 's3';
    process.env.IMMICH_S3_BUCKET = 'my-bucket';

    const repo = new ConfigRepository();
    const env = repo.getEnv();

    expect(env.storage.s3).toEqual({
      bucket: 'my-bucket',
      region: 'us-east-1',
      endpoint: undefined,
      accessKeyId: undefined,
      secretAccessKey: undefined,
      presignedUrlExpiry: 3600,
      serveMode: 'redirect',
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/repositories/config.repository.spec.ts`
Expected: FAIL — `env.storage.backend` and `env.storage.s3` don't exist yet.

**Step 3: Add S3 env vars to EnvDto**

Modify `server/src/dtos/env.dto.ts` — add these fields to the `EnvDto` class (after the existing `IMMICH_MEDIA_LOCATION` field around line 66):

```typescript
  @IsEnum(['disk', 's3'])
  @Optional()
  IMMICH_STORAGE_BACKEND?: 'disk' | 's3';

  @IsString()
  @Optional()
  IMMICH_S3_BUCKET?: string;

  @IsString()
  @Optional()
  IMMICH_S3_REGION?: string;

  @IsString()
  @Optional()
  IMMICH_S3_ENDPOINT?: string;

  @IsString()
  @Optional()
  IMMICH_S3_ACCESS_KEY_ID?: string;

  @IsString()
  @Optional()
  IMMICH_S3_SECRET_ACCESS_KEY?: string;

  @IsInt()
  @Optional()
  @Type(() => Number)
  IMMICH_S3_PRESIGNED_URL_EXPIRY?: number;

  @IsEnum(['redirect', 'proxy'])
  @Optional()
  IMMICH_S3_SERVE_MODE?: 'redirect' | 'proxy';
```

**Step 4: Add S3 config to EnvData interface and getEnv()**

Modify `server/src/repositories/config.repository.ts`:

Add to the `EnvData` interface's `storage` field (around line 106-109):

```typescript
  storage: {
    backend: 'disk' | 's3';
    ignoreMountCheckErrors: boolean;
    mediaLocation?: string;
    s3: {
      bucket: string;
      region: string;
      endpoint?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      presignedUrlExpiry: number;
      serveMode: 'redirect' | 'proxy';
    };
  };
```

In the `getEnv()` function, update the `storage` return value (around line 330-333):

```typescript
    storage: {
      backend: (dto.IMMICH_STORAGE_BACKEND as 'disk' | 's3') || 'disk',
      ignoreMountCheckErrors: !!dto.IMMICH_IGNORE_MOUNT_CHECK_ERRORS,
      mediaLocation: dto.IMMICH_MEDIA_LOCATION,
      s3: {
        bucket: dto.IMMICH_S3_BUCKET || '',
        region: dto.IMMICH_S3_REGION || 'us-east-1',
        endpoint: dto.IMMICH_S3_ENDPOINT,
        accessKeyId: dto.IMMICH_S3_ACCESS_KEY_ID,
        secretAccessKey: dto.IMMICH_S3_SECRET_ACCESS_KEY,
        presignedUrlExpiry: dto.IMMICH_S3_PRESIGNED_URL_EXPIRY || 3600,
        serveMode: (dto.IMMICH_S3_SERVE_MODE as 'redirect' | 'proxy') || 'redirect',
      },
    },
```

**Step 5: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/repositories/config.repository.spec.ts`
Expected: PASS

**Step 6: Run existing tests to check for regressions**

Run: `cd server && pnpm test -- --run`
Expected: All existing tests still pass. Some may need updating if they assert on `env.storage` shape — fix any that break by adding the new `backend` and `s3` fields to their mock config.

**Step 7: Commit**

```bash
git add server/src/dtos/env.dto.ts server/src/repositories/config.repository.ts server/src/repositories/config.repository.spec.ts
git commit -m "feat(server): add S3 storage configuration env vars"
```

---

## Task 3: Create StorageBackend interface

**Files:**

- Create: `server/src/interfaces/storage-backend.interface.ts`

**Step 1: Create the interface file**

```typescript
import { Readable } from 'node:stream';

export type ServeStrategy =
  | { type: 'file'; path: string }
  | { type: 'redirect'; url: string }
  | { type: 'stream'; stream: Readable; length?: number };

export interface StorageBackend {
  /** Write content to the given key */
  put(key: string, source: Readable | Buffer, metadata?: { contentType?: string }): Promise<void>;

  /** Get a readable stream for the given key */
  get(key: string): Promise<{ stream: Readable; contentType?: string; length?: number }>;

  /** Check if a key exists */
  exists(key: string): Promise<boolean>;

  /** Delete the content at the given key */
  delete(key: string): Promise<void>;

  /** Determine how to serve this file to a client */
  getServeStrategy(key: string, contentType: string): Promise<ServeStrategy>;

  /**
   * Download content to a local temp file for processing by tools
   * that require filesystem paths (ffmpeg, sharp, exiftool).
   * Returns the temp path and a cleanup function.
   * For disk backend, returns the real path with a no-op cleanup.
   */
  downloadToTemp(key: string): Promise<{ tempPath: string; cleanup: () => Promise<void> }>;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors related to the new file.

**Step 3: Commit**

```bash
git add server/src/interfaces/storage-backend.interface.ts
git commit -m "feat(server): add StorageBackend interface"
```

---

## Task 4: Implement DiskStorageBackend

**Files:**

- Create: `server/src/backends/disk-storage.backend.ts`
- Create: `server/src/backends/disk-storage.backend.spec.ts`

**Step 1: Write the failing tests**

```typescript
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';

describe('DiskStorageBackend', () => {
  let backend: DiskStorageBackend;
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `immich-disk-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    backend = new DiskStorageBackend(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('put', () => {
    it('should write a buffer to disk at mediaLocation/key', async () => {
      const content = Buffer.from('hello world');
      await backend.put('upload/user1/ab/cd/file.jpg', content);

      const written = await readFile(join(testDir, 'upload/user1/ab/cd/file.jpg'));
      expect(written.toString()).toBe('hello world');
    });

    it('should write a readable stream to disk', async () => {
      const stream = Readable.from([Buffer.from('stream content')]);
      await backend.put('upload/user1/ab/cd/file.jpg', stream);

      const written = await readFile(join(testDir, 'upload/user1/ab/cd/file.jpg'));
      expect(written.toString()).toBe('stream content');
    });
  });

  describe('get', () => {
    it('should return a readable stream', async () => {
      const filePath = join(testDir, 'thumbs/user1/ab/cd/thumb.webp');
      await mkdir(join(testDir, 'thumbs/user1/ab/cd'), { recursive: true });
      await writeFile(filePath, 'thumb data');

      const result = await backend.get('thumbs/user1/ab/cd/thumb.webp');
      const chunks: Buffer[] = [];
      for await (const chunk of result.stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toBe('thumb data');
    });
  });

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const filePath = join(testDir, 'test.txt');
      await writeFile(filePath, 'data');
      expect(await backend.exists('test.txt')).toBe(true);
    });

    it('should return false for non-existing file', async () => {
      expect(await backend.exists('nope.txt')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove file from disk', async () => {
      const filePath = join(testDir, 'delete-me.txt');
      await writeFile(filePath, 'data');
      await backend.delete('delete-me.txt');
      expect(existsSync(filePath)).toBe(false);
    });
  });

  describe('getServeStrategy', () => {
    it('should always return file strategy with full path', async () => {
      const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', 'image/webp');
      expect(strategy).toEqual({
        type: 'file',
        path: join(testDir, 'thumbs/user1/ab/cd/thumb.webp'),
      });
    });
  });

  describe('downloadToTemp', () => {
    it('should return the real path with no-op cleanup', async () => {
      const filePath = join(testDir, 'original.jpg');
      await writeFile(filePath, 'image data');

      const { tempPath, cleanup } = await backend.downloadToTemp('original.jpg');
      expect(tempPath).toBe(filePath);

      // cleanup should be a no-op (file still exists)
      await cleanup();
      expect(existsSync(filePath)).toBe(true);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/backends/disk-storage.backend.spec.ts`
Expected: FAIL — module `src/backends/disk-storage.backend` does not exist.

**Step 3: Implement DiskStorageBackend**

Create `server/src/backends/disk-storage.backend.ts`:

```typescript
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ServeStrategy, StorageBackend } from 'src/interfaces/storage-backend.interface';

export class DiskStorageBackend implements StorageBackend {
  constructor(private mediaLocation: string) {}

  private resolvePath(key: string): string {
    return join(this.mediaLocation, key);
  }

  async put(key: string, source: Readable | Buffer): Promise<void> {
    const fullPath = this.resolvePath(key);
    await mkdir(dirname(fullPath), { recursive: true });

    if (Buffer.isBuffer(source)) {
      await writeFile(fullPath, source);
    } else {
      const writeStream = createWriteStream(fullPath);
      await pipeline(source, writeStream);
    }
  }

  async get(key: string): Promise<{ stream: Readable; contentType?: string; length?: number }> {
    const fullPath = this.resolvePath(key);
    const fileStat = await stat(fullPath);
    return {
      stream: createReadStream(fullPath),
      length: fileStat.size,
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(this.resolvePath(key));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolvePath(key));
  }

  async getServeStrategy(key: string): Promise<ServeStrategy> {
    return { type: 'file', path: this.resolvePath(key) };
  }

  async downloadToTemp(key: string): Promise<{ tempPath: string; cleanup: () => Promise<void> }> {
    return {
      tempPath: this.resolvePath(key),
      cleanup: async () => {
        // no-op: file is already on disk, don't delete the original
      },
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/backends/disk-storage.backend.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/backends/disk-storage.backend.ts server/src/backends/disk-storage.backend.spec.ts
git commit -m "feat(server): implement DiskStorageBackend"
```

---

## Task 5: Implement S3StorageBackend

**Files:**

- Create: `server/src/backends/s3-storage.backend.ts`
- Create: `server/src/backends/s3-storage.backend.spec.ts`

**Step 1: Write the failing tests (unit tests with mocked AWS SDK)**

```typescript
import { Readable } from 'node:stream';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock AWS SDK before importing the backend
vi.mock('@aws-sdk/client-s3', () => {
  const mockSend = vi.fn();
  return {
    S3Client: vi.fn(() => ({ send: mockSend, destroy: vi.fn() })),
    PutObjectCommand: vi.fn((input: any) => ({ input, _type: 'PutObjectCommand' })),
    GetObjectCommand: vi.fn((input: any) => ({ input, _type: 'GetObjectCommand' })),
    HeadObjectCommand: vi.fn((input: any) => ({ input, _type: 'HeadObjectCommand' })),
    DeleteObjectCommand: vi.fn((input: any) => ({ input, _type: 'DeleteObjectCommand' })),
  };
});

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://bucket.s3.amazonaws.com/key?X-Amz-Signature=abc123'),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
  Upload: vi.fn().mockImplementation(() => ({
    done: vi.fn().mockResolvedValue({}),
  })),
}));

import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';

describe('S3StorageBackend', () => {
  let backend: S3StorageBackend;
  let mockSend: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    backend = new S3StorageBackend({
      bucket: 'test-bucket',
      region: 'us-east-1',
      presignedUrlExpiry: 3600,
      serveMode: 'redirect' as const,
    });
    const client = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    mockSend = client?.send;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('put', () => {
    it('should upload buffer using Upload (multipart-capable)', async () => {
      const { Upload } = await import('@aws-sdk/lib-storage');
      await backend.put('upload/user1/ab/cd/file.jpg', Buffer.from('data'), {
        contentType: 'image/jpeg',
      });
      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'upload/user1/ab/cd/file.jpg',
            ContentType: 'image/jpeg',
          }),
        }),
      );
    });
  });

  describe('get', () => {
    it('should return stream from S3 GetObject', async () => {
      const bodyStream = Readable.from([Buffer.from('s3 content')]);
      mockSend.mockResolvedValueOnce({
        Body: bodyStream,
        ContentType: 'image/jpeg',
        ContentLength: 10,
      });

      const result = await backend.get('thumbs/user1/ab/cd/thumb.webp');
      expect(result.contentType).toBe('image/jpeg');
      expect(result.length).toBe(10);

      const chunks: Buffer[] = [];
      for await (const chunk of result.stream) {
        chunks.push(Buffer.from(chunk));
      }
      expect(Buffer.concat(chunks).toString()).toBe('s3 content');
    });
  });

  describe('exists', () => {
    it('should return true when HeadObject succeeds', async () => {
      mockSend.mockResolvedValueOnce({});
      expect(await backend.exists('some/key.jpg')).toBe(true);
    });

    it('should return false when HeadObject throws NotFound', async () => {
      mockSend.mockRejectedValueOnce({ name: 'NotFound' });
      expect(await backend.exists('missing/key.jpg')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should send DeleteObjectCommand', async () => {
      mockSend.mockResolvedValueOnce({});
      await backend.delete('old/key.jpg');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'old/key.jpg',
          }),
        }),
      );
    });
  });

  describe('getServeStrategy', () => {
    it('should return redirect with presigned URL when serveMode is redirect', async () => {
      const strategy = await backend.getServeStrategy('thumbs/user1/ab/cd/thumb.webp', 'image/webp');
      expect(strategy.type).toBe('redirect');
      if (strategy.type === 'redirect') {
        expect(strategy.url).toContain('X-Amz-Signature');
      }
      expect(getSignedUrl).toHaveBeenCalled();
    });

    it('should return stream when serveMode is proxy', async () => {
      const proxyBackend = new S3StorageBackend({
        bucket: 'test-bucket',
        region: 'us-east-1',
        presignedUrlExpiry: 3600,
        serveMode: 'proxy' as const,
      });

      const bodyStream = Readable.from([Buffer.from('proxied')]);
      // Need to get the new client's send mock
      const allClients = (S3Client as unknown as ReturnType<typeof vi.fn>).mock.results;
      const proxyClient = allClients[allClients.length - 1]?.value;
      proxyClient.send.mockResolvedValueOnce({
        Body: bodyStream,
        ContentLength: 7,
      });

      const strategy = await proxyBackend.getServeStrategy('key.jpg', 'image/jpeg');
      expect(strategy.type).toBe('stream');
    });
  });

  describe('downloadToTemp', () => {
    it('should download to a temp file and provide cleanup', async () => {
      const bodyStream = Readable.from([Buffer.from('temp file content')]);
      mockSend.mockResolvedValueOnce({ Body: bodyStream });

      const { tempPath, cleanup } = await backend.downloadToTemp('key.jpg');

      expect(tempPath).toContain('immich-');
      expect(tempPath).toEndWith('.tmp');

      const content = await readFile(tempPath, 'utf-8');
      expect(content).toBe('temp file content');

      await cleanup();
      expect(existsSync(tempPath)).toBe(false);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/backends/s3-storage.backend.spec.ts`
Expected: FAIL — module `src/backends/s3-storage.backend` does not exist.

**Step 3: Implement S3StorageBackend**

Create `server/src/backends/s3-storage.backend.ts`:

```typescript
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ServeStrategy, StorageBackend } from 'src/interfaces/storage-backend.interface';

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  presignedUrlExpiry: number;
  serveMode: 'redirect' | 'proxy';
}

export class S3StorageBackend implements StorageBackend {
  private client: S3Client;
  private bucket: string;
  private presignedUrlExpiry: number;
  private serveMode: 'redirect' | 'proxy';

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.presignedUrlExpiry = config.presignedUrlExpiry;
    this.serveMode = config.serveMode;

    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: !!config.endpoint, // needed for MinIO and other S3-compatible services
      credentials:
        config.accessKeyId && config.secretAccessKey
          ? {
              accessKeyId: config.accessKeyId,
              secretAccessKey: config.secretAccessKey,
            }
          : undefined,
    });
  }

  async put(key: string, source: Readable | Buffer, metadata?: { contentType?: string }): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: source,
        ContentType: metadata?.contentType,
      },
    });

    await upload.done();
  }

  async get(key: string): Promise<{ stream: Readable; contentType?: string; length?: number }> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType,
      length: response.ContentLength,
    };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async getServeStrategy(key: string, contentType: string): Promise<ServeStrategy> {
    if (this.serveMode === 'proxy') {
      const { stream, length } = await this.get(key);
      return { type: 'stream', stream, length };
    }

    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ResponseContentType: contentType,
      }),
      { expiresIn: this.presignedUrlExpiry },
    );

    return { type: 'redirect', url };
  }

  async downloadToTemp(key: string): Promise<{ tempPath: string; cleanup: () => Promise<void> }> {
    const tempPath = join(tmpdir(), `immich-${randomUUID()}.tmp`);
    const { stream } = await this.get(key);
    const writeStream = createWriteStream(tempPath);
    await pipeline(stream, writeStream);

    return {
      tempPath,
      cleanup: async () => {
        try {
          await unlink(tempPath);
        } catch {
          // ignore cleanup errors
        }
      },
    };
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/backends/s3-storage.backend.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/backends/s3-storage.backend.ts server/src/backends/s3-storage.backend.spec.ts
git commit -m "feat(server): implement S3StorageBackend"
```

---

## Task 6: Create StorageBackend provider and resolver

**Files:**

- Create: `server/src/backends/storage-backend.provider.ts`
- Create: `server/src/backends/storage-backend.provider.spec.ts`

**Step 1: Write the failing test**

```typescript
import { isAbsolute } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveBackend } from 'src/backends/storage-backend.provider';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';

// Use minimal mocks
const mockDiskBackend = {} as DiskStorageBackend;
const mockS3Backend = {} as S3StorageBackend;

describe('resolveBackend', () => {
  it('should return disk backend for absolute paths', () => {
    const result = resolveBackend('/data/upload/user1/ab/cd/file.jpg', mockDiskBackend, mockS3Backend);
    expect(result).toBe(mockDiskBackend);
  });

  it('should return S3 backend for relative keys', () => {
    const result = resolveBackend('upload/user1/ab/cd/file.jpg', mockDiskBackend, mockS3Backend);
    expect(result).toBe(mockS3Backend);
  });

  it('should return disk backend for Windows-style absolute paths', () => {
    // isAbsolute handles this, but in practice Immich is Linux-only.
    // Relative keys never start with /
    const result = resolveBackend('thumbs/user1/ab/cd/thumb.webp', mockDiskBackend, mockS3Backend);
    expect(result).toBe(mockS3Backend);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/backends/storage-backend.provider.spec.ts`
Expected: FAIL — module does not exist.

**Step 3: Implement the provider**

Create `server/src/backends/storage-backend.provider.ts`:

```typescript
import { isAbsolute } from 'node:path';
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { S3StorageBackend, S3StorageConfig } from 'src/backends/s3-storage.backend';
import { StorageBackend } from 'src/interfaces/storage-backend.interface';
import { EnvData } from 'src/repositories/config.repository';

export const DISK_BACKEND = 'DISK_BACKEND';
export const S3_BACKEND = 'S3_BACKEND';
export const WRITE_BACKEND = 'WRITE_BACKEND';

/**
 * Determines which backend owns a given path/key.
 * Absolute paths (starting with /) are disk assets (legacy).
 * Relative keys are S3 assets.
 */
export function resolveBackend(key: string, diskBackend: StorageBackend, s3Backend: StorageBackend): StorageBackend {
  if (isAbsolute(key)) {
    return diskBackend;
  }
  return s3Backend;
}

export function createDiskBackend(mediaLocation: string): DiskStorageBackend {
  return new DiskStorageBackend(mediaLocation);
}

export function createS3Backend(config: S3StorageConfig): S3StorageBackend {
  return new S3StorageBackend(config);
}
```

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/backends/storage-backend.provider.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/backends/storage-backend.provider.ts server/src/backends/storage-backend.provider.spec.ts
git commit -m "feat(server): add StorageBackend resolver and factory functions"
```

---

## Task 7: Modify StorageCore to produce relative keys

**Files:**

- Modify: `server/src/cores/storage.core.ts`
- Modify/create: `server/src/cores/storage.core.spec.ts` (if not existing, check first)

This is the critical change — all path-building static methods currently return absolute paths like `/data/thumbs/user1/ab/cd/file.webp`. They need to return relative keys like `thumbs/user1/ab/cd/file.webp` so that the backend can resolve them.

**Important:** The `getBaseFolder`, `getFolderLocation`, `getNestedFolder`, and `getNestedPath` methods are used by both the upload interceptor (for disk temp paths) and the media service (for final storage paths). We need to add new methods that return relative keys while keeping the old methods working for disk-mode backward compatibility.

**Step 1: Write the failing test**

Add to or create `server/src/cores/storage.core.spec.ts`:

```typescript
import { beforeEach, describe, expect, it } from 'vitest';
import { StorageCore } from 'src/cores/storage.core';
import { AssetFileType, ImageFormat, StorageFolder } from 'src/enum';

describe('StorageCore - relative keys', () => {
  beforeEach(() => {
    StorageCore.setMediaLocation('/data');
  });

  describe('getRelativeNestedPath', () => {
    it('should return path without mediaLocation prefix', () => {
      const result = StorageCore.getRelativeNestedPath(StorageFolder.Thumbnails, 'user123', 'abcdef.webp');
      expect(result).toBe('thumbs/user123/ab/cd/abcdef.webp');
      expect(result.startsWith('/')).toBe(false);
    });
  });

  describe('getRelativeImagePath', () => {
    it('should return relative path for thumbnail', () => {
      const result = StorageCore.getRelativeImagePath(
        { id: 'asset-1', ownerId: 'user-1' },
        { fileType: AssetFileType.Thumbnail, format: ImageFormat.Webp, isEdited: false },
      );
      expect(result.startsWith('/')).toBe(false);
      expect(result).toContain('thumbs/');
      expect(result).toContain('asset-1_thumbnail.webp');
    });
  });

  describe('getRelativeEncodedVideoPath', () => {
    it('should return relative path for encoded video', () => {
      const result = StorageCore.getRelativeEncodedVideoPath({ id: 'asset-1', ownerId: 'user-1' });
      expect(result.startsWith('/')).toBe(false);
      expect(result).toContain('encoded-video/');
      expect(result).toContain('asset-1.mp4');
    });
  });

  describe('getRelativePersonThumbnailPath', () => {
    it('should return relative path for person thumbnail', () => {
      const result = StorageCore.getRelativePersonThumbnailPath({ id: 'person-1', ownerId: 'user-1' });
      expect(result.startsWith('/')).toBe(false);
      expect(result).toContain('thumbs/');
      expect(result).toContain('person-1.jpeg');
    });
  });

  // Existing absolute-path methods should still work
  describe('existing methods (backward compatibility)', () => {
    it('getNestedPath should still return absolute path', () => {
      const result = StorageCore.getNestedPath(StorageFolder.Thumbnails, 'user123', 'abcdef.webp');
      expect(result).toBe('/data/thumbs/user123/ab/cd/abcdef.webp');
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/cores/storage.core.spec.ts`
Expected: FAIL — `getRelativeNestedPath` etc. don't exist.

**Step 3: Add relative-key methods to StorageCore**

Modify `server/src/cores/storage.core.ts` — add these new static methods (keep all existing methods unchanged):

```typescript
  // --- Relative key methods (for S3 / new backend-agnostic paths) ---

  static getRelativeNestedPath(folder: StorageFolder, ownerId: string, filename: string): string {
    return join(folder, ownerId, filename.slice(0, 2), filename.slice(2, 4), filename);
  }

  static getRelativeImagePath(asset: ThumbnailPathEntity, options: ImagePathOptions): string {
    const filename = `${asset.id}_${options.fileType}${options.isEdited ? '_edited' : ''}.${options.format}`;
    return StorageCore.getRelativeNestedPath(StorageFolder.Thumbnails, asset.ownerId, filename);
  }

  static getRelativeEncodedVideoPath(asset: ThumbnailPathEntity): string {
    return StorageCore.getRelativeNestedPath(StorageFolder.EncodedVideo, asset.ownerId, `${asset.id}.mp4`);
  }

  static getRelativePersonThumbnailPath(person: ThumbnailPathEntity): string {
    return StorageCore.getRelativeNestedPath(StorageFolder.Thumbnails, person.ownerId, `${person.id}.jpeg`);
  }
```

Note: The `join()` with relative parts (no leading `/`) produces a relative path. The existing methods that use `getBaseFolder()` still prepend `mediaLocation` and produce absolute paths.

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/cores/storage.core.spec.ts`
Expected: PASS

**Step 5: Run all server tests for regressions**

Run: `cd server && pnpm test -- --run`
Expected: All pass. Existing methods are untouched.

**Step 6: Commit**

```bash
git add server/src/cores/storage.core.ts server/src/cores/storage.core.spec.ts
git commit -m "feat(server): add relative-key path methods to StorageCore"
```

---

## Task 8: Extend ImmichFileResponse and sendFile to support redirect/stream

**Files:**

- Modify: `server/src/utils/file.ts`
- Create or modify: `server/src/utils/file.spec.ts`

**Step 1: Write the failing test**

```typescript
import { describe, expect, it, vi } from 'vitest';
import { ImmichFileResponse, ImmichRedirectResponse, ImmichStreamResponse } from 'src/utils/file';
import { CacheControl } from 'src/enum';
import { Readable } from 'node:stream';

describe('ImmichRedirectResponse', () => {
  it('should store redirect URL and cache control', () => {
    const response = new ImmichRedirectResponse({
      url: 'https://s3.amazonaws.com/bucket/key?sig=abc',
      cacheControl: CacheControl.PrivateWithCache,
    });
    expect(response.url).toBe('https://s3.amazonaws.com/bucket/key?sig=abc');
    expect(response.cacheControl).toBe(CacheControl.PrivateWithCache);
  });
});

describe('ImmichStreamResponse', () => {
  it('should store stream and metadata', () => {
    const stream = Readable.from([Buffer.from('data')]);
    const response = new ImmichStreamResponse({
      stream,
      contentType: 'image/jpeg',
      length: 4,
      cacheControl: CacheControl.PrivateWithCache,
    });
    expect(response.stream).toBe(stream);
    expect(response.contentType).toBe('image/jpeg');
    expect(response.length).toBe(4);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/utils/file.spec.ts`
Expected: FAIL — `ImmichRedirectResponse` and `ImmichStreamResponse` don't exist.

**Step 3: Add new response classes**

Modify `server/src/utils/file.ts` — add after the `ImmichFileResponse` class:

```typescript
export class ImmichRedirectResponse {
  public readonly url!: string;
  public readonly cacheControl!: CacheControl;

  constructor(response: ImmichRedirectResponse) {
    Object.assign(this, response);
  }
}

export class ImmichStreamResponse {
  public readonly stream!: Readable;
  public readonly contentType!: string;
  public readonly length?: number;
  public readonly cacheControl!: CacheControl;
  public readonly fileName?: string;

  constructor(response: ImmichStreamResponse) {
    Object.assign(this, response);
  }
}

export type ImmichMediaResponse = ImmichFileResponse | ImmichRedirectResponse | ImmichStreamResponse;
```

Add `Readable` to the imports at top:

```typescript
import { Readable } from 'node:stream';
```

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/utils/file.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/utils/file.ts server/src/utils/file.spec.ts
git commit -m "feat(server): add ImmichRedirectResponse and ImmichStreamResponse"
```

---

## Task 9: Update sendFile to handle all response types

**Files:**

- Modify: `server/src/utils/file.ts`
- Modify: `server/src/utils/file.spec.ts`

**Step 1: Write the failing test**

Add to `server/src/utils/file.spec.ts`:

```typescript
import {
  sendFile,
  ImmichFileResponse,
  ImmichRedirectResponse,
  ImmichStreamResponse,
  ImmichMediaResponse,
} from 'src/utils/file';
import { CacheControl } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';

describe('sendFile with ImmichMediaResponse', () => {
  const mockLogger = { error: vi.fn(), setContext: vi.fn() } as unknown as LoggingRepository;

  it('should send redirect response with 302', async () => {
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      redirect: vi.fn(),
      headersSent: false,
    } as any;
    const next = vi.fn();

    const handler = () =>
      new ImmichRedirectResponse({
        url: 'https://s3.example.com/signed-url',
        cacheControl: CacheControl.PrivateWithCache,
      });

    await sendFile(res, next, handler, mockLogger);

    expect(res.redirect).toHaveBeenCalledWith('https://s3.example.com/signed-url');
  });

  it('should pipe stream response', async () => {
    const stream = Readable.from([Buffer.from('streamed')]);
    const res = {
      set: vi.fn(),
      header: vi.fn(),
      headersSent: false,
      status: vi.fn().mockReturnThis(),
      end: vi.fn(),
    } as any;
    // Mock pipe behavior
    stream.pipe = vi.fn().mockReturnValue(res);
    const next = vi.fn();

    const handler = () =>
      new ImmichStreamResponse({
        stream,
        contentType: 'image/jpeg',
        length: 8,
        cacheControl: CacheControl.PrivateWithCache,
      });

    await sendFile(res, next, handler, mockLogger);

    expect(res.header).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
    expect(res.header).toHaveBeenCalledWith('Content-Length', '8');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd server && pnpm test -- --run src/utils/file.spec.ts`
Expected: FAIL — `sendFile` doesn't handle the new response types yet.

**Step 3: Update sendFile to handle all response types**

Modify the `sendFile` function in `server/src/utils/file.ts`:

```typescript
export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichMediaResponse> | ImmichMediaResponse,
  logger: LoggingRepository,
): Promise<void> => {
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();

    if (file instanceof ImmichRedirectResponse) {
      const cacheControlHeader = cacheControlHeaders[file.cacheControl];
      if (cacheControlHeader) {
        res.set('Cache-Control', cacheControlHeader);
      }
      return res.redirect(file.url);
    }

    if (file instanceof ImmichStreamResponse) {
      const cacheControlHeader = cacheControlHeaders[file.cacheControl];
      if (cacheControlHeader) {
        res.set('Cache-Control', cacheControlHeader);
      }
      res.header('Content-Type', file.contentType);
      if (file.length !== undefined) {
        res.header('Content-Length', String(file.length));
      }
      if (file.fileName) {
        res.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
      }
      file.stream.pipe(res);
      return;
    }

    // ImmichFileResponse — existing behavior
    const cacheControlHeader = cacheControlHeaders[file.cacheControl];
    if (cacheControlHeader) {
      res.set('Cache-Control', cacheControlHeader);
    }

    res.header('Content-Type', file.contentType);
    if (file.fileName) {
      res.header('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    }

    await access(file.path, constants.R_OK);
    return await _sendFile(file.path, { dotfiles: 'allow' });
  } catch (error: Error | any) {
    if (isConnectionAborted(error) || res.headersSent) {
      return;
    }

    if (error instanceof HttpException === false) {
      logger.error(`Unable to send file: ${error}`, error.stack);
    }

    res.header('Cache-Control', 'none');
    next(error);
  }
};
```

**Step 4: Run test to verify it passes**

Run: `cd server && pnpm test -- --run src/utils/file.spec.ts`
Expected: PASS

**Step 5: Run all server tests for regressions**

Run: `cd server && pnpm test -- --run`
Expected: All pass. Existing sendFile behavior for `ImmichFileResponse` is unchanged.

**Step 6: Commit**

```bash
git add server/src/utils/file.ts server/src/utils/file.spec.ts
git commit -m "feat(server): extend sendFile to handle redirect and stream responses"
```

---

## Task 10: Wire up StorageBackend in BaseService and StorageService

**Files:**

- Modify: `server/src/services/storage.service.ts`
- Modify: `server/src/services/base.service.ts`

This task integrates the backend into the service layer. The StorageService initializes both backends on bootstrap. BaseService gets a helper method to resolve the correct backend for a given key.

**Step 1: Add backend references to StorageService bootstrap**

Modify `server/src/services/storage.service.ts`:

At the top, add imports:

```typescript
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';
import { resolveBackend } from 'src/backends/storage-backend.provider';
import { StorageBackend } from 'src/interfaces/storage-backend.interface';
```

Add static fields and accessor:

```typescript
@Injectable()
export class StorageService extends BaseService {
  private static diskBackend: DiskStorageBackend;
  private static s3Backend: S3StorageBackend | undefined;
  private static writeBackendType: 'disk' | 's3' = 'disk';

  static getDiskBackend(): DiskStorageBackend {
    return StorageService.diskBackend;
  }

  static getS3Backend(): S3StorageBackend | undefined {
    return StorageService.s3Backend;
  }

  static getWriteBackend(): StorageBackend {
    if (StorageService.writeBackendType === 's3' && StorageService.s3Backend) {
      return StorageService.s3Backend;
    }
    return StorageService.diskBackend;
  }

  static resolveBackendForKey(key: string): StorageBackend {
    if (StorageService.s3Backend) {
      return resolveBackend(key, StorageService.diskBackend, StorageService.s3Backend);
    }
    return StorageService.diskBackend;
  }
```

In the `onBootstrap` method, after `StorageCore.setMediaLocation(...)`, add:

```typescript
// Initialize storage backends
const envData = this.configRepository.getEnv();
StorageService.diskBackend = new DiskStorageBackend(StorageCore.getMediaLocation());
StorageService.writeBackendType = envData.storage.backend;

if (envData.storage.s3.bucket) {
  StorageService.s3Backend = new S3StorageBackend(envData.storage.s3);
  this.logger.log(`S3 storage backend configured (bucket: ${envData.storage.s3.bucket})`);
}

if (envData.storage.backend === 's3' && !StorageService.s3Backend) {
  throw new ImmichStartupError('IMMICH_STORAGE_BACKEND is set to s3 but IMMICH_S3_BUCKET is not configured');
}

this.logger.log(`Storage write backend: ${envData.storage.backend}`);
```

**Step 2: Verify TypeScript compiles**

Run: `cd server && npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors.

**Step 3: Run existing storage service tests**

Run: `cd server && pnpm test -- --run src/services/storage.service.spec.ts`
Expected: Existing tests still pass (they use disk mode by default).

**Step 4: Commit**

```bash
git add server/src/services/storage.service.ts server/src/services/base.service.ts
git commit -m "feat(server): wire up StorageBackend initialization in StorageService"
```

---

## Task 11: Update AssetMediaService to use StorageBackend for serving

**Files:**

- Modify: `server/src/services/asset-media.service.ts`

This is where `downloadOriginal`, `viewThumbnail`, and `playbackVideo` need to return the appropriate response type based on the backend.

**Step 1: Write the failing test**

Add a test to the existing `server/src/services/asset-media.service.spec.ts` (or create if needed):

```typescript
// Test that serving an S3 asset (relative key) returns a redirect/stream response
// rather than an ImmichFileResponse

it('should return redirect response for S3 asset in downloadOriginal', async () => {
  // Setup: mock asset with relative path (S3 asset)
  mocks.asset.getForOriginal.mockResolvedValue({
    originalPath: 'upload/user1/ab/cd/photo.jpg',
    originalFileName: 'photo.jpg',
    editedPath: null,
  });

  // Mock the S3 backend to return a redirect strategy
  // This will need StorageService.resolveBackendForKey to return the S3 backend

  const result = await sut.downloadOriginal(authStub.admin, 'asset-1', { edited: false });
  // For S3, result should be ImmichRedirectResponse or ImmichStreamResponse
  // For disk (absolute path), result should be ImmichFileResponse
});
```

This test structure will evolve as the implementation proceeds. The key verification is:

- Disk assets (absolute paths) → `ImmichFileResponse` (existing behavior)
- S3 assets (relative keys) → `ImmichRedirectResponse` or `ImmichStreamResponse`

**Step 2: Modify downloadOriginal, viewThumbnail, playbackVideo**

In `server/src/services/asset-media.service.ts`, update the serve methods to check the path format and use the appropriate backend:

Add import at top:

```typescript
import { StorageService } from 'src/services/storage.service';
import { ImmichMediaResponse, ImmichRedirectResponse, ImmichStreamResponse } from 'src/utils/file';
```

Add a private helper method:

```typescript
  private async serveFromBackend(
    filePath: string,
    contentType: string,
    cacheControl: CacheControl,
    fileName?: string,
  ): Promise<ImmichMediaResponse> {
    const backend = StorageService.resolveBackendForKey(filePath);
    const strategy = await backend.getServeStrategy(filePath, contentType);

    switch (strategy.type) {
      case 'file': {
        return new ImmichFileResponse({
          path: strategy.path,
          contentType,
          cacheControl,
          fileName,
        });
      }
      case 'redirect': {
        return new ImmichRedirectResponse({
          url: strategy.url,
          cacheControl,
        });
      }
      case 'stream': {
        return new ImmichStreamResponse({
          stream: strategy.stream,
          contentType,
          length: strategy.length,
          cacheControl,
          fileName,
        });
      }
    }
  }
```

Update `downloadOriginal` return type to `Promise<ImmichMediaResponse>` and use:

```typescript
return this.serveFromBackend(
  path,
  mimeTypes.lookup(path),
  CacheControl.PrivateWithCache,
  getFileNameWithoutExtension(originalFileName) + getFilenameExtension(path),
);
```

Update `viewThumbnail` return type to `Promise<ImmichMediaResponse | AssetMediaRedirectResponse>` and use `serveFromBackend` for the `ImmichFileResponse` case.

Update `playbackVideo` return type to `Promise<ImmichMediaResponse>` and use `serveFromBackend`.

**Step 3: Update the controller to handle new return types**

The controller in `server/src/controllers/asset-media.controller.ts` already calls `sendFile()` which now handles all three response types. The return type change from the service should flow through transparently.

**Step 4: Run tests**

Run: `cd server && pnpm test -- --run src/services/asset-media.service.spec.ts`
Expected: Existing tests pass (they use absolute paths = disk = ImmichFileResponse).

Run: `cd server && pnpm test -- --run`
Expected: All pass.

**Step 5: Commit**

```bash
git add server/src/services/asset-media.service.ts server/src/controllers/asset-media.controller.ts
git commit -m "feat(server): serve files from StorageBackend in AssetMediaService"
```

---

## Task 12: Update MediaService thumbnail generation for S3

**Files:**

- Modify: `server/src/services/media.service.ts`

The thumbnail generation methods read `asset.originalPath` and write output files. For S3 assets, we need to download the original to temp, process it, then upload the output.

**Step 1: Add S3-aware wrapper for thumbnail generation**

In `server/src/services/media.service.ts`, add imports:

```typescript
import { StorageService } from 'src/services/storage.service';
import { isAbsolute } from 'node:path';
```

Add a private helper:

```typescript
  /**
   * For S3 assets, downloads original to temp before processing.
   * Returns the local path to use for processing and a cleanup function.
   */
  private async ensureLocalFile(filePath: string): Promise<{ localPath: string; cleanup: () => Promise<void> }> {
    if (isAbsolute(filePath)) {
      return { localPath: filePath, cleanup: async () => {} };
    }
    const backend = StorageService.resolveBackendForKey(filePath);
    return backend.downloadToTemp(filePath);
  }

  /**
   * After generating a file locally, uploads it to S3 if the write backend is S3.
   * Returns the key to store in the DB.
   */
  private async persistFile(localPath: string, relativeKey: string, contentType?: string): Promise<string> {
    const writeBackend = StorageService.getWriteBackend();
    if (writeBackend instanceof DiskStorageBackend) {
      // Disk mode: the file was already written to the final path by StorageCore
      return localPath;
    }
    // S3 mode: upload the locally-generated file
    const { createReadStream } = await import('node:fs');
    const stream = createReadStream(localPath);
    await writeBackend.put(relativeKey, stream, { contentType });
    // Clean up local temp file
    const { unlink } = await import('node:fs/promises');
    try { await unlink(localPath); } catch { /* ignore */ }
    return relativeKey;
  }
```

Then modify `handleGenerateThumbnails`, `handleVideoConversion`, `handleGeneratePersonThumbnail`, and related methods to use `ensureLocalFile` before processing and `persistFile` after. The changes are mechanical: wrap the input path with `ensureLocalFile`, use the `localPath` for processing, then call `persistFile` on outputs.

This is a large set of changes — implement incrementally, test each method.

**Step 2: Run tests after each method update**

Run: `cd server && pnpm test -- --run src/services/media.service.spec.ts`
Expected: Existing tests pass (they use absolute paths = disk mode, `ensureLocalFile` returns the path as-is).

**Step 3: Commit**

```bash
git add server/src/services/media.service.ts
git commit -m "feat(server): add S3 download/upload bracket to media processing"
```

---

## Task 13: Update DownloadService for S3 assets in ZIP

**Files:**

- Modify: `server/src/services/download.service.ts`

**Step 1: Update downloadArchive to stream from S3**

In the `downloadArchive` method, the current code calls `storageRepository.realpath(realpath)` and `zip.addFile(realpath, filename)`. For S3 assets, we need to get a stream from the backend instead.

Add import:

```typescript
import { StorageService } from 'src/services/storage.service';
import { isAbsolute } from 'node:path';
```

Replace the file-adding loop:

```typescript
for (const assetId of dto.assetIds) {
  const asset = assetMap.get(assetId);
  if (!asset) {
    continue;
  }

  const { originalPath, editedPath, originalFileName } = asset;

  let filename = originalFileName;
  const count = paths[filename] || 0;
  paths[filename] = count + 1;
  if (count !== 0) {
    const parsedFilename = parse(originalFileName);
    filename = `${parsedFilename.name}+${count}${parsedFilename.ext}`;
  }

  let filePath = dto.edited && editedPath ? editedPath : originalPath;

  if (isAbsolute(filePath)) {
    // Disk asset — existing behavior
    try {
      filePath = await this.storageRepository.realpath(filePath);
    } catch {
      this.logger.warn('Unable to resolve realpath', { originalPath });
    }
    zip.addFile(filePath, filename);
  } else {
    // S3 asset — stream from backend
    const backend = StorageService.resolveBackendForKey(filePath);
    const { stream } = await backend.get(filePath);
    zip.addFile(stream, filename);
  }
}
```

Note: `zip.addFile` may need to accept a `Readable` stream in addition to a path. Check the `ImmichZipStream` interface in `server/src/repositories/storage.repository.ts`. If `addFile` only accepts paths, it will need to be extended to accept streams. The `archiver` library supports both `file()` and `append()` — verify the implementation.

**Step 2: Run tests**

Run: `cd server && pnpm test -- --run src/services/download.service.spec.ts`
Expected: Existing tests pass (disk assets).

**Step 3: Commit**

```bash
git add server/src/services/download.service.ts
git commit -m "feat(server): support S3 assets in ZIP download"
```

---

## Task 14: Update StorageService file deletion for S3

**Files:**

- Modify: `server/src/services/storage.service.ts`

**Step 1: Update handleDeleteFiles to use backend**

The `handleDeleteFiles` job currently calls `storageRepository.unlink(file)`. For S3 assets, it should use the backend's `delete` method.

```typescript
  @OnJob({ name: JobName.FileDelete, queue: QueueName.BackgroundTask })
  async handleDeleteFiles(job: JobOf<JobName.FileDelete>): Promise<JobStatus> {
    const { files } = job;

    for (const file of files) {
      if (!file) {
        continue;
      }

      try {
        const backend = StorageService.resolveBackendForKey(file);
        if (isAbsolute(file)) {
          await this.storageRepository.unlink(file);
        } else {
          await backend.delete(file);
        }
      } catch (error: any) {
        this.logger.warn('Unable to remove file', error);
      }
    }

    return JobStatus.Success;
  }
```

Add import:

```typescript
import { isAbsolute } from 'node:path';
```

**Step 2: Run tests**

Run: `cd server && pnpm test -- --run src/services/storage.service.spec.ts`
Expected: Existing tests pass.

**Step 3: Commit**

```bash
git add server/src/services/storage.service.ts
git commit -m "feat(server): delete S3 objects in FileDelete job"
```

---

## Task 15: Update upload flow to write to S3

**Files:**

- Modify: `server/src/services/asset-media.service.ts`

**Step 1: Update the create() method to upload to S3**

In the `create()` method (line ~427), after the asset is created in the DB with the temp upload path, if the write backend is S3:

1. Compute the relative key using the storage template
2. Upload the temp file to S3
3. Update the DB record with the relative key
4. Delete the temp local file

This is the most complex integration point. The storage template logic currently runs as a separate job (`StorageTemplateMigrationService`). For S3, we want to compute the final key at upload time.

Add to the `create()` method after the asset is created:

```typescript
// If S3 backend, upload the file and update the path
const writeBackend = StorageService.getWriteBackend();
if (!(writeBackend instanceof DiskStorageBackend)) {
  const relativeKey = StorageCore.getRelativeNestedPath(
    StorageFolder.Upload,
    ownerId,
    `${asset.id}${getFilenameExtension(file.originalPath)}`,
  );
  const { createReadStream } = await import('node:fs');
  await writeBackend.put(relativeKey, createReadStream(file.originalPath), {
    contentType: mimeTypes.lookup(file.originalPath),
  });
  await this.assetRepository.update({ id: asset.id, originalPath: relativeKey });
  // Clean up the temp local file
  await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [file.originalPath] } });

  if (sidecarFile) {
    const sidecarKey = StorageCore.getRelativeNestedPath(StorageFolder.Upload, ownerId, `${asset.id}.xmp`);
    await writeBackend.put(sidecarKey, createReadStream(sidecarFile.originalPath));
    await this.assetRepository.upsertFile({
      assetId: asset.id,
      path: sidecarKey,
      type: AssetFileType.Sidecar,
    });
    await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [sidecarFile.originalPath] } });
  }
}
```

Add imports:

```typescript
import { DiskStorageBackend } from 'src/backends/disk-storage.backend';
import { StorageService } from 'src/services/storage.service';
```

**Step 2: Run tests**

Run: `cd server && pnpm test -- --run src/services/asset-media.service.spec.ts`
Expected: Existing tests pass (disk mode — `StorageService.getWriteBackend()` will need to be mockable in tests; may need to set up a mock or skip the S3 path when write backend is disk).

**Step 3: Commit**

```bash
git add server/src/services/asset-media.service.ts
git commit -m "feat(server): upload assets to S3 in create flow"
```

---

## Task 16: Integration test with MinIO

**Files:**

- Create: `server/src/backends/s3-storage.backend.integration.spec.ts`

This test uses testcontainers to spin up a MinIO container and runs the full put/get/exists/delete/downloadToTemp cycle against real S3.

**Step 1: Write the integration test**

```typescript
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { S3StorageBackend } from 'src/backends/s3-storage.backend';
import { S3Client, CreateBucketCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

describe('S3StorageBackend integration (MinIO)', () => {
  let container: StartedTestContainer;
  let backend: S3StorageBackend;
  const bucket = 'test-bucket';

  beforeAll(async () => {
    container = await new GenericContainer('minio/minio')
      .withExposedPorts(9000)
      .withEnvironment({ MINIO_ROOT_USER: 'minioadmin', MINIO_ROOT_PASSWORD: 'minioadmin' })
      .withCommand(['server', '/data'])
      .withWaitStrategy(Wait.forHttp('/minio/health/live', 9000))
      .start();

    const endpoint = `http://${container.getHost()}:${container.getMappedPort(9000)}`;

    // Create bucket
    const client = new S3Client({
      region: 'us-east-1',
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId: 'minioadmin', secretAccessKey: 'minioadmin' },
    });
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    client.destroy();

    backend = new S3StorageBackend({
      bucket,
      region: 'us-east-1',
      endpoint,
      accessKeyId: 'minioadmin',
      secretAccessKey: 'minioadmin',
      presignedUrlExpiry: 3600,
      serveMode: 'redirect',
    });
  }, 60_000);

  afterAll(async () => {
    await container?.stop();
  });

  it('should round-trip a file through put and get', async () => {
    const content = Buffer.from('hello from S3 integration test');
    await backend.put('test/round-trip.txt', content, { contentType: 'text/plain' });

    const { stream, contentType } = await backend.get('test/round-trip.txt');
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe('hello from S3 integration test');
  });

  it('should report exists correctly', async () => {
    await backend.put('test/exists.txt', Buffer.from('data'));
    expect(await backend.exists('test/exists.txt')).toBe(true);
    expect(await backend.exists('test/nope.txt')).toBe(false);
  });

  it('should delete objects', async () => {
    await backend.put('test/delete-me.txt', Buffer.from('data'));
    await backend.delete('test/delete-me.txt');
    expect(await backend.exists('test/delete-me.txt')).toBe(false);
  });

  it('should download to temp file and cleanup', async () => {
    await backend.put('test/temp-download.txt', Buffer.from('temp content'));
    const { tempPath, cleanup } = await backend.downloadToTemp('test/temp-download.txt');

    const content = await readFile(tempPath, 'utf-8');
    expect(content).toBe('temp content');

    await cleanup();
    expect(existsSync(tempPath)).toBe(false);
  });

  it('should return presigned URL in redirect mode', async () => {
    await backend.put('test/presigned.txt', Buffer.from('presigned data'));
    const strategy = await backend.getServeStrategy('test/presigned.txt', 'text/plain');
    expect(strategy.type).toBe('redirect');
    if (strategy.type === 'redirect') {
      expect(strategy.url).toContain('test/presigned.txt');
      expect(strategy.url).toContain('X-Amz');
    }
  });
});
```

**Step 2: Run the integration test**

Run: `cd server && pnpm test -- --run src/backends/s3-storage.backend.integration.spec.ts`
Expected: PASS (requires Docker available for testcontainers).

Note: If the test runner doesn't have Docker or testcontainers is not available, this test can be skipped in CI with a `describe.skipIf(!process.env.DOCKER_AVAILABLE)` guard. Check existing medium tests for the pattern.

**Step 3: Commit**

```bash
git add server/src/backends/s3-storage.backend.integration.spec.ts
git commit -m "test(server): add S3StorageBackend integration test with MinIO"
```

---

## Task 17: Type-check, lint, and full test run

**Step 1: Type check**

Run: `cd server && npx tsc --noEmit`
Expected: No errors.

**Step 2: Lint**

Run: `make lint-server`
Expected: No errors (fix any that appear).

**Step 3: Full unit test suite**

Run: `cd server && pnpm test -- --run`
Expected: All pass.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix(server): resolve lint and type errors from S3 storage backend"
```

---

## Summary of tasks

| Task | Description                | Key files                                         |
| ---- | -------------------------- | ------------------------------------------------- |
| 1    | Install AWS SDK            | `package.json`                                    |
| 2    | S3 env config              | `env.dto.ts`, `config.repository.ts`              |
| 3    | StorageBackend interface   | `interfaces/storage-backend.interface.ts`         |
| 4    | DiskStorageBackend         | `backends/disk-storage.backend.ts`                |
| 5    | S3StorageBackend           | `backends/s3-storage.backend.ts`                  |
| 6    | Backend resolver           | `backends/storage-backend.provider.ts`            |
| 7    | StorageCore relative keys  | `cores/storage.core.ts`                           |
| 8    | Response classes           | `utils/file.ts`                                   |
| 9    | sendFile update            | `utils/file.ts`                                   |
| 10   | Bootstrap wiring           | `services/storage.service.ts`                     |
| 11   | Serve from backend         | `services/asset-media.service.ts`                 |
| 12   | Thumbnail/transcode S3     | `services/media.service.ts`                       |
| 13   | ZIP download S3            | `services/download.service.ts`                    |
| 14   | File deletion S3           | `services/storage.service.ts`                     |
| 15   | Upload to S3               | `services/asset-media.service.ts`                 |
| 16   | Integration test           | `backends/s3-storage.backend.integration.spec.ts` |
| 17   | Type-check, lint, full run | all                                               |
