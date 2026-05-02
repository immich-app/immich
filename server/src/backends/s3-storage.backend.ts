import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { ServeStrategy, StorageBackend } from 'src/interfaces/storage-backend.interface';

const DEFAULT_PROXY_READ_CONCURRENCY = 32;
const DEFAULT_PROXY_READ_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

class AsyncLimiter {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async acquire(): Promise<() => void> {
    if (this.active >= this.max) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }

    this.active++;
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      this.active--;
      this.queue.shift()?.();
    };
  }
}

export interface S3StorageConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  presignedUrlExpiry: number;
  serveMode: 'redirect' | 'proxy';
  proxyReadConcurrency?: number;
  proxyReadIdleTimeoutMs?: number;
}

export class S3StorageBackend implements StorageBackend {
  private client: S3Client;
  private bucket: string;
  private presignedUrlExpiry: number;
  private serveMode: 'redirect' | 'proxy';
  private proxyReadLimiter: AsyncLimiter;
  private proxyReadIdleTimeoutMs: number;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.presignedUrlExpiry = config.presignedUrlExpiry;
    this.serveMode = config.serveMode;
    this.proxyReadLimiter = new AsyncLimiter(config.proxyReadConcurrency ?? DEFAULT_PROXY_READ_CONCURRENCY);
    this.proxyReadIdleTimeoutMs = Math.max(0, config.proxyReadIdleTimeoutMs ?? DEFAULT_PROXY_READ_IDLE_TIMEOUT_MS);

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

  async deletePrefix(prefix: string): Promise<void> {
    let continuationToken: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
      );
      const keys = (page.Contents ?? []).map((o) => ({ Key: o.Key! }));
      if (keys.length > 0) {
        const result = await this.client.send(
          new DeleteObjectsCommand({ Bucket: this.bucket, Delete: { Objects: keys } }),
        );
        if (result.Errors && result.Errors.length > 0) {
          const first = result.Errors[0];
          throw new Error(`S3 deletePrefix partial failure: ${first.Code}: ${first.Message} (key=${first.Key})`);
        }
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  async getPrefixUsage(prefix: string): Promise<number> {
    let total = 0;
    let continuationToken: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken: continuationToken }),
      );
      for (const object of page.Contents ?? []) {
        total += object.Size ?? 0;
      }
      continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (continuationToken);

    return total;
  }

  private releaseWhenStreamCloses(stream: Readable, release: () => void) {
    let released = false;
    let idleTimeout: ReturnType<typeof setTimeout> | undefined;
    const originalEmit = stream.emit;

    const clearIdleTimeout = () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
        idleTimeout = undefined;
      }
    };

    const releaseOnce = () => {
      if (released) {
        return;
      }
      released = true;
      clearIdleTimeout();
      stream.emit = originalEmit;
      release();
    };

    const resetIdleTimeout = () => {
      if (this.proxyReadIdleTimeoutMs <= 0 || released) {
        return;
      }

      clearIdleTimeout();
      idleTimeout = setTimeout(() => {
        try {
          stream.destroy(new Error(`S3 proxy read timed out after ${this.proxyReadIdleTimeoutMs}ms of inactivity`));
        } finally {
          releaseOnce();
        }
      }, this.proxyReadIdleTimeoutMs);
    };

    // Observe data activity without adding a "data" listener, which would switch the stream into flowing mode
    // before the HTTP response pipe is attached.
    stream.emit = function (this: Readable, eventName: string | symbol, ...args: any[]) {
      if (eventName === 'data' || eventName === 'readable') {
        resetIdleTimeout();
      }
      return originalEmit.call(this, eventName, ...args);
    } as typeof stream.emit;

    stream.once('end', releaseOnce);
    stream.once('error', releaseOnce);
    stream.once('close', releaseOnce);
    resetIdleTimeout();
    return stream;
  }

  async getServeStrategy(key: string, contentType: string): Promise<ServeStrategy> {
    if (this.serveMode === 'proxy') {
      const release = await this.proxyReadLimiter.acquire();
      try {
        const { stream, length } = await this.get(key);
        return { type: 'stream', stream: this.releaseWhenStreamCloses(stream, release), length };
      } catch (error) {
        release();
        throw error;
      }
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
