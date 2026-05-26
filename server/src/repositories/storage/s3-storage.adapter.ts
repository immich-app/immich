import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PassThrough, Readable, Writable } from 'node:stream';
import {
  IStorageAdapter,
  MultipartUploadPart,
  PresignedUrlOptions,
  StorageObjectInfo,
  StorageReadStream,
  StorageWriteOptions,
} from 'src/repositories/storage/storage-adapter.interface';
import { classifyS3Error, S3ErrorType } from 'src/utils/s3-error';

export interface S3StorageConfig {
  endpoint?: string;
  publicEndpoint?: string; // Custom domain for presigned URLs (e.g., https://media.example.com)
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
  private readonly presignClient: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  /** Maximum file size (50MB) that can be safely read into memory */
  private static readonly MAX_READ_SIZE = 50 * 1024 * 1024;

  /** Default retry configuration */
  private static readonly DEFAULT_MAX_RETRIES = 3;
  private static readonly DEFAULT_BASE_DELAY_MS = 1000;

  constructor(private readonly config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.prefix = config.prefix || '';

    const forcePathStyle = config.forcePathStyle ?? true;

    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle,
    });

    // SigV4 signs over the host header and request URI. Rewriting either
    // after signing invalidates the signature, so when a distinct public
    // endpoint is configured, use a dedicated client whose endpoint matches
    // the URL clients will actually call.
    const usePresignClient = !!config.publicEndpoint && config.publicEndpoint !== config.endpoint;
    this.presignClient = usePresignClient
      ? new S3Client({
          endpoint: config.publicEndpoint,
          region: config.region,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
          forcePathStyle,
        })
      : this.client;
  }

  /**
   * Retry wrapper with exponential backoff for transient S3 errors.
   * Retries on transient errors (503, timeouts, network issues) but fails immediately on permanent errors.
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries = S3StorageAdapter.DEFAULT_MAX_RETRIES,
    baseDelayMs = S3StorageAdapter.DEFAULT_BASE_DELAY_MS,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error;
        const errorType = classifyS3Error(error);

        // Don't retry permanent errors
        if (errorType === S3ErrorType.Permanent) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelayMs * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Should never reach here, but TypeScript needs this
    throw lastError;
  }

  /**
   * Health check to verify S3 connectivity and bucket access.
   * Uses HeadBucket API to verify credentials are valid and bucket exists.
   */
  async healthCheck(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
  }

  private getKey(key: string): string {
    // If no prefix configured, use key as-is
    if (!this.prefix) {
      return key;
    }

    // Normalize prefix to always end with '/' for consistent path handling
    const normalizedPrefix = this.prefix.endsWith('/') ? this.prefix : this.prefix + '/';

    // If key already starts with the normalized prefix, use as-is to avoid double-prefixing
    if (key.startsWith(normalizedPrefix)) {
      return key;
    }

    // Prepend the normalized prefix
    return `${normalizedPrefix}${key}`;
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
    // Check file size first to prevent OOM for large files
    const stat = await this.stat(key);
    if (stat.size > S3StorageAdapter.MAX_READ_SIZE) {
      throw new Error(
        `File too large to read into memory (${stat.size} bytes, max ${S3StorageAdapter.MAX_READ_SIZE} bytes). ` +
          `Use readStream() for large files.`,
      );
    }

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
    await this.withRetry(() =>
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.getKey(key),
          Body: data,
          ContentType: options?.contentType,
          CacheControl: options?.cacheControl,
          Metadata: options?.metadata,
          StorageClass: options?.storageClass as any,
        }),
      ),
    );
  }

  writeStream(key: string, options?: StorageWriteOptions): Writable {
    // Use a passthrough stream with Upload from @aws-sdk/lib-storage
    const passThrough = new PassThrough();

    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: this.getKey(key),
        Body: passThrough,
        ContentType: options?.contentType,
        StorageClass: options?.storageClass as any,
      },
    });

    // Start upload in background
    upload.done().catch((error) => {
      passThrough.destroy(error);
    });

    return passThrough;
  }

  async writeStreamAsync(key: string, sourceStream: Readable, options?: StorageWriteOptions): Promise<void> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: this.getKey(key),
        Body: sourceStream,
        ContentType: options?.contentType,
        StorageClass: options?.storageClass as any,
      },
      partSize: 100 * 1024 * 1024, // 100MB parts
      queueSize: 4,
    });
    await upload.done();
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

  /**
   * Copy an object in-place with a new storage class (for migration)
   */
  async copyWithStorageClass(key: string, storageClass: string): Promise<void> {
    const fullKey = this.getKey(key);
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${fullKey}`,
        Key: fullKey,
        StorageClass: storageClass as any,
        MetadataDirective: 'COPY',
      }),
    );
  }

  async move(sourceKey: string, targetKey: string): Promise<void> {
    await this.copy(sourceKey, targetKey);
    await this.delete(sourceKey);
  }

  async delete(key: string): Promise<void> {
    await this.withRetry(() =>
      this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: this.getKey(key),
        }),
      ),
    );
  }

  async ensureDir(_path: string): Promise<void> {
    // S3 doesn't have directories, no-op
  }

  /**
   * List objects in a bucket with optional prefix filter.
   * Returns an array of object keys.
   */
  async listObjects(prefix?: string): Promise<{ key: string; lastModified: Date; size: number }[]> {
    const results: { key: string; lastModified: Date; size: number }[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix ? this.getKey(prefix) : this.prefix,
          ContinuationToken: continuationToken,
        }),
      );

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && obj.LastModified) {
            results.push({
              key: obj.Key,
              lastModified: obj.LastModified,
              size: obj.Size || 0,
            });
          }
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return results;
  }

  async getPresignedDownloadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(key),
    });

    return getSignedUrl(this.presignClient, command, {
      expiresIn: options?.expiresIn ?? 86_400,
    });
  }

  async getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.getKey(key),
      ContentType: options?.contentType,
    });

    return getSignedUrl(this.presignClient, command, {
      expiresIn: options?.expiresIn ?? 86_400,
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
        StorageClass: options?.storageClass as any,
      }),
    );

    if (!response.UploadId) {
      throw new Error('Failed to create multipart upload: no upload ID returned');
    }

    return response.UploadId;
  }

  async uploadPart(key: string, uploadId: string, partNumber: number, data: Buffer): Promise<MultipartUploadPart> {
    const response = await this.withRetry(() =>
      this.client.send(
        new UploadPartCommand({
          Bucket: this.bucket,
          Key: this.getKey(key),
          UploadId: uploadId,
          PartNumber: partNumber,
          Body: data,
        }),
      ),
    );

    if (!response.ETag) {
      throw new Error(`Failed to upload part ${partNumber}: no ETag returned`);
    }

    return {
      partNumber,
      etag: response.ETag,
    };
  }

  async completeMultipartUpload(key: string, uploadId: string, parts: MultipartUploadPart[]): Promise<void> {
    await this.withRetry(() =>
      this.client.send(
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
      ),
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
