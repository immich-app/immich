import { Readable } from 'node:stream';
import { StorageTargetConfig, StorageTargetSecret } from 'src/types';

export interface RemoteObject {
  key: string;
  size: number;
  etag?: string;
  modifiedAt?: Date;
}

export interface RemoteUploadOptions {
  size?: number;
  contentType?: string;
}

/**
 * The only seam through which the server talks to an external storage system.
 * Every implementation is addressed by an opaque string key that is relative to
 * the target's configured prefix, so callers never need to know whether they are
 * talking to S3, WebDAV, or a mounted directory.
 */
export interface RemoteStorageDriver {
  /** Round-trip a small marker object to prove credentials and permissions work. */
  test(): Promise<void>;
  list(prefix?: string): AsyncGenerator<RemoteObject[]>;
  head(key: string): Promise<RemoteObject | null>;
  createReadStream(key: string): Promise<Readable>;
  upload(key: string, stream: Readable, options?: RemoteUploadOptions): Promise<RemoteObject>;
  delete(key: string): Promise<void>;
}

export type DriverInput<K extends StorageTargetConfig['kind']> = {
  config: Extract<StorageTargetConfig, { kind: K }>;
  secret: Extract<StorageTargetSecret, { kind: K }>;
};

/**
 * Join a target prefix with an object key. Prefixes are normalized to have no
 * leading or trailing slash so `''` (no prefix) does not produce a leading `/`,
 * which S3 would treat as a real, empty-named directory level.
 */
export const joinKey = (...parts: (string | undefined)[]): string =>
  parts
    .filter((part): part is string => !!part)
    .map((part) => part.replaceAll(/^\/+|\/+$/g, ''))
    .filter((part) => part.length > 0)
    .join('/');

/** Reject keys that would escape the configured prefix. */
export const assertSafeKey = (key: string) => {
  if (key.split('/').includes('..')) {
    throw new Error(`Unsafe object key: ${key}`);
  }
};
