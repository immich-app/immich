import { Readable } from 'node:stream';
import { CacheControl } from 'src/enum';
import type { ContentDisposition } from 'src/utils/file';

export type ServeOptions = {
  contentType: string;
  cacheControl: CacheControl;
  fileName?: string;
  disposition?: ContentDisposition;
};

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

  /** Delete all objects/files under the given key prefix. Idempotent. No-op if nothing matches. */
  deletePrefix(prefix: string): Promise<void>;

  /** Return the total size in bytes for all objects/files under the given key prefix. */
  getPrefixUsage(prefix: string): Promise<number>;

  /** Determine how to serve this file to a client */
  getServeStrategy(key: string, options: ServeOptions): Promise<ServeStrategy>;

  /**
   * Download content to a local temp file for processing by tools
   * that require filesystem paths (ffmpeg, sharp, exiftool).
   * Returns the temp path and a cleanup function.
   * For disk backend, returns the real path with a no-op cleanup.
   */
  downloadToTemp(key: string): Promise<{ tempPath: string; cleanup: () => Promise<void> }>;
}
