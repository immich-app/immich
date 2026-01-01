import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable, Writable } from 'node:stream';
import { Upload } from '@aws-sdk/lib-storage';
import {
  IStorageAdapter,
  MultipartUploadPart,
  PresignedUrlOptions,
  StorageObjectInfo,
  StorageReadStream,
  StorageWriteOptions,
} from './storage-adapter.interface';

export interface S3StorageConfig {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
  forcePathStyle?: boolean;
}

/**
 * S3-compatible storage adapter.
 * Supports AWS S3, MinIO, Tigris, and other S3-compatible services.
 */
export class S3StorageAdapter implements IStorageAdapter {
  readonly name = 's3';
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(private readonly config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.prefix = config.prefix || '';

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: config.forcePathStyle ?? true,
    });
  }

  private getKey(key: string): string {
    // If key starts with prefix, use as-is
    if (this.prefix && key.startsWith(this.prefix)) {
      return key;
    }
    // Otherwise, prepend prefix
    return this.prefix ? `${this.prefix}${key}` : key;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: this.getKey(key),
        }),
      );
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async stat(key: string): Promise<StorageObjectInfo> {
    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );

    return {
      size: response.ContentLength || 0,
      mtime: response.LastModified || new Date(),
      etag: response.ETag,
      contentType: response.ContentType,
    };
  }

  async read(key: string): Promise<Buffer> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as Readable) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async readStream(key: string): Promise<StorageReadStream> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    return {
      stream: response.Body as Readable,
      length: response.ContentLength,
      type: response.ContentType,
    };
  }

  async write(key: string, data: Buffer, options?: StorageWriteOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
        Body: data,
        ContentType: options?.contentType,
        CacheControl: options?.cacheControl,
        Metadata: options?.metadata,
      }),
    );
  }

  writeStream(key: string): Writable {
    // Use a passthrough stream with Upload from @aws-sdk/lib-storage
    const { PassThrough } = require('node:stream');
    const passThrough = new PassThrough();

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: this.getKey(key),
        Body: passThrough,
      },
    });

    // Start upload in background
    upload.done().catch((error) => {
      passThrough.destroy(error);
    });

    return passThrough;
  }

  async copy(sourceKey: string, targetKey: string): Promise<void> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${this.getKey(sourceKey)}`,
        Key: this.getKey(targetKey),
      }),
    );
  }

  async move(sourceKey: string, targetKey: string): Promise<void> {
    await this.copy(sourceKey, targetKey);
    await this.delete(sourceKey);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
      }),
    );
  }

  async ensureDir(_path: string): Promise<void> {
    // S3 doesn't have directories, no-op
  }

  async getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(key),
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });
  }

  async getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(key),
      ContentType: options?.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });
  }

  async createMultipartUpload(key: string, options?: StorageWriteOptions): Promise<string> {
    const response = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
        ContentType: options?.contentType,
        CacheControl: options?.cacheControl,
        Metadata: options?.metadata,
      }),
    );

    if (!response.UploadId) {
      throw new Error('Failed to create multipart upload: no upload ID returned');
    }

    return response.UploadId;
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    data: Buffer,
  ): Promise<MultipartUploadPart> {
    const response = await this.client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: data,
      }),
    );

    if (!response.ETag) {
      throw new Error(`Failed to upload part ${partNumber}: no ETag returned`);
    }

    return {
      partNumber,
      etag: response.ETag,
    };
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: MultipartUploadPart[],
  ): Promise<void> {
    await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part) => ({
            PartNumber: part.partNumber,
            ETag: part.etag,
          })),
        },
      }),
    );
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    await this.client.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.getKey(key),
        UploadId: uploadId,
      }),
    );
  }
}
