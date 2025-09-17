import { Readable, Writable } from 'node:stream';

export interface AppStorageHead {
  size: number;
  lastModified?: Date;
  etag?: string;
  contentType?: string;
}

export interface AppStorageRange {
  start: number;
  end?: number;
}

/**
 * Interface for Immich-managed storage backends (e.g., local or S3).
 * Keys are logical object paths relative to the configured media base or full URIs.
 */
export interface IAppStorageBackend {
  exists(key: string): Promise<boolean>;
  head(key: string): Promise<AppStorageHead>;
  readStream(key: string, range?: AppStorageRange): Promise<Readable>;
  writeStream(key: string): Promise<{ stream: Writable; done: () => Promise<void> }>;
  putObject(key: string, buffer: Buffer, metadata?: Record<string, string>): Promise<void>;
  copyObject(srcKey: string, dstKey: string): Promise<void>;
  moveObject(srcKey: string, dstKey: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
  ensurePrefix(prefix: string): Promise<void>;
}
