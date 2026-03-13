import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
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
