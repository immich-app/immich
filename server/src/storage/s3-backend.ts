// Phase 0 stub for S3 backend — not wired into the app yet
import { Readable, Writable, PassThrough } from 'node:stream';
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  type ServerSideEncryption,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { AppStorageHead, AppStorageRange, IAppStorageBackend } from 'src/storage/app-storage.interface';

export interface S3BackendOptions {
  endpoint?: string;
  region: string;
  bucket: string;
  prefix?: string;
  forcePathStyle?: boolean;
  useAccelerate?: boolean;
  accessKeyId?: string;
  secretAccessKey?: string;
  sse?: 'AES256' | 'aws:kms' | 'S3' | 'KMS';
  sseKmsKeyId?: string;
}

export class S3AppStorageBackend implements IAppStorageBackend {
  private client: S3Client;
  constructor(private opts: S3BackendOptions) {
    this.client = new S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      forcePathStyle: opts.forcePathStyle,
      useAccelerateEndpoint: opts.useAccelerate,
      credentials:
        opts.accessKeyId && opts.secretAccessKey
          ? { accessKeyId: opts.accessKeyId, secretAccessKey: opts.secretAccessKey }
          : undefined,
    });
  }

  // Helpers kept simple for Phase 0; to be implemented in Phase 1/2
  private notReady(): never {
    throw new Error('S3 backend not implemented (Phase 1/2)');
  }

  private mapSse(sse?: string): ServerSideEncryption | undefined {
    if (!sse) return undefined;
    const v = sse.toLowerCase();
    if (v === 'aes256' || v === 's3') return 'AES256';
    if (v === 'aws:kms' || v === 'kms') return 'aws:kms';
    return undefined;
  }

  private parseKey(key: string): { bucket: string; key: string } {
    if (key.startsWith('s3://')) {
      const url = new URL(key);
      const bucket = url.hostname;
      const objectKey = url.pathname.replace(/^\//, '');
      return { bucket, key: objectKey };
    }
    const bucket = this.opts.bucket || '';
    const prefix = this.opts.prefix ? this.opts.prefix.replace(/^\//, '').replace(/\/$/, '') + '/' : '';
    const objectKey = `${prefix}${key.replace(/^\//, '')}`;
    return { bucket, key: objectKey };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.head(key);
      return true;
    } catch {
      return false;
    }
  }

  async head(key: string): Promise<AppStorageHead> {
    const { bucket, key: objectKey } = this.parseKey(key);
    const res = await this.client.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
    return {
      size: Number(res.ContentLength || 0),
      lastModified: res.LastModified,
      etag: res.ETag,
      contentType: res.ContentType,
    };
  }

  async readStream(key: string, range?: AppStorageRange): Promise<Readable> {
    const { bucket, key: objectKey } = this.parseKey(key);
    const Range = range
      ? `bytes=${range.start}-${typeof range.end === 'number' ? range.end : ''}`
      : undefined;
    const res = await this.client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey, Range }));
    const body = res.Body as Readable;
    return body;
  }
  async writeStream(key: string): Promise<{ stream: Writable; done: () => Promise<void> }> {
    const { bucket, key: objectKey } = this.parseKey(key);
    const pt = new PassThrough();
    const uploader = new Upload({
      client: this.client,
      params: {
        Bucket: bucket,
        Key: objectKey,
        Body: pt,
        ServerSideEncryption: this.mapSse(this.opts.sse),
        SSEKMSKeyId: this.opts.sseKmsKeyId,
      },
      queueSize: 4,
      partSize: 8 * 1024 * 1024,
      leavePartsOnError: false,
    });
    const promise = uploader.done();
    // If the multipart upload fails, propagate error to the writable side so callers can fail fast
    promise.catch((err) => pt.destroy(err as Error));
    const done = () => promise.then(() => {});
    return { stream: pt, done };
  }

  async putObject(key: string, buffer: Buffer): Promise<void> {
    const { bucket, key: objectKey } = this.parseKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ServerSideEncryption: this.mapSse(this.opts.sse),
        SSEKMSKeyId: this.opts.sseKmsKeyId,
      }),
    );
  }

  async copyObject(srcKey: string, dstKey: string): Promise<void> {
    const src = this.parseKey(srcKey);
    const dst = this.parseKey(dstKey);
    const copySource = `/${src.bucket}/${encodeURIComponent(src.key)}`;
    await this.client.send(
      new CopyObjectCommand({
        Bucket: dst.bucket,
        Key: dst.key,
        CopySource: copySource,
        ServerSideEncryption: this.mapSse(this.opts.sse),
        SSEKMSKeyId: this.opts.sseKmsKeyId,
      }),
    );
  }

  async moveObject(srcKey: string, dstKey: string): Promise<void> {
    await this.copyObject(srcKey, dstKey);
    await this.deleteObject(srcKey);
  }

  async deleteObject(key: string): Promise<void> {
    const { bucket, key: objectKey } = this.parseKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
  }

  async ensurePrefix(_prefix: string): Promise<void> {
    // no-op for S3
  }
}
