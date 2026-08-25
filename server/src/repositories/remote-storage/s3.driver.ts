import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';
import { StorageTargetKind } from 'src/enum';
import {
  assertSafeKey,
  DriverInput,
  joinKey,
  RemoteObject,
  RemoteStorageDriver,
  RemoteUploadOptions,
} from 'src/repositories/remote-storage/driver';

const LIST_PAGE_SIZE = 1000;

export class S3Driver implements RemoteStorageDriver {
  private client: S3Client;
  private bucket: string;
  private prefix: string;

  constructor({ config, secret }: DriverInput<StorageTargetKind.S3>) {
    this.bucket = config.bucket;
    this.prefix = config.prefix;
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle,
      credentials: {
        accessKeyId: secret.accessKeyId,
        secretAccessKey: secret.secretAccessKey,
      },
    });
  }

  private fullKey(key: string) {
    assertSafeKey(key);
    return joinKey(this.prefix, key);
  }

  /** Strip the target prefix so callers only ever deal in relative keys. */
  private relativeKey(fullKey: string) {
    const prefix = joinKey(this.prefix);
    return prefix ? fullKey.slice(prefix.length + 1) : fullKey;
  }

  async test(): Promise<void> {
    const key = `.immich-connection-test-${Date.now()}`;
    await this.upload(key, Readable.from([Buffer.from('immich')]), { size: 6 });
    try {
      const object = await this.head(key);
      if (!object) {
        throw new Error('Wrote a test object but could not read it back');
      }
    } finally {
      await this.delete(key);
    }
  }

  async *list(prefix?: string): AsyncGenerator<RemoteObject[]> {
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: joinKey(this.prefix, prefix) || undefined,
          MaxKeys: LIST_PAGE_SIZE,
          ContinuationToken: continuationToken,
        }),
      );

      const objects = (response.Contents ?? [])
        // A key ending in `/` is a directory placeholder, not a file.
        .filter(({ Key }) => !!Key && !Key.endsWith('/'))
        .map((item) => ({
          key: this.relativeKey(item.Key!),
          size: item.Size ?? 0,
          etag: item.ETag?.replaceAll('"', ''),
          modifiedAt: item.LastModified,
        }));

      if (objects.length > 0) {
        yield objects;
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);
  }

  async head(key: string): Promise<RemoteObject | null> {
    try {
      const response = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: this.fullKey(key) }));
      return {
        key,
        size: response.ContentLength ?? 0,
        etag: response.ETag?.replaceAll('"', ''),
        modifiedAt: response.LastModified,
      };
    } catch (error: any) {
      if (error?.$metadata?.httpStatusCode === 404 || error?.name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  async createReadStream(key: string): Promise<Readable> {
    const response = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: this.fullKey(key) }));
    if (!response.Body) {
      throw new Error(`Object has no body: ${key}`);
    }
    return response.Body as Readable;
  }

  async upload(key: string, stream: Readable, options?: RemoteUploadOptions): Promise<RemoteObject> {
    // `Upload` handles multipart and backpressure, so arbitrarily large videos
    // stream through without being buffered in memory.
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: this.fullKey(key),
        Body: stream,
        ContentType: options?.contentType,
      },
    });

    const result = await upload.done();

    return {
      key,
      size: options?.size ?? 0,
      etag: result.ETag?.replaceAll('"', ''),
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: this.fullKey(key) }));
  }
}
