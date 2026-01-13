import { Readable, Writable } from 'node:stream';

export interface StorageObjectInfo {
  size: number;
  mtime: Date;
  etag?: string;
  contentType?: string;
}

export interface StorageReadStream {
  stream: Readable;
  length?: number;
  type?: string;
}

export interface StorageWriteOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
  storageClass?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds, default 3600
  contentType?: string; // for PUT operations
}

export interface MultipartUploadPart {
  partNumber: number;
  etag: string;
}

/**
 * Storage adapter interface for abstracting file storage operations.
 * Implementations can target local filesystem, S3, or other backends.
 */
export interface IStorageAdapter {
  /**
   * Unique identifier for this adapter instance
   */
  readonly name: string;

  /**
   * Check if a file/object exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get metadata about a file/object
   */
  stat(key: string): Promise<StorageObjectInfo>;

  /**
   * Read entire file into buffer
   */
  read(key: string): Promise<Buffer>;

  /**
   * Create a readable stream for the file
   */
  readStream(key: string): Promise<StorageReadStream>;

  /**
   * Write buffer to file
   */
  write(key: string, data: Buffer, options?: StorageWriteOptions): Promise<void>;

  /**
   * Create a writable stream (for large files)
   */
  writeStream(key: string, options?: StorageWriteOptions): Writable;

  /**
   * Copy a file from one location to another
   */
  copy(sourceKey: string, targetKey: string): Promise<void>;

  /**
   * Move/rename a file
   */
  move(sourceKey: string, targetKey: string): Promise<void>;

  /**
   * Delete a file
   */
  delete(key: string): Promise<void>;

  /**
   * Create directories (no-op for S3)
   */
  ensureDir(path: string): Promise<void>;

  /**
   * Generate a presigned URL for direct download (optional, S3 only)
   */
  getPresignedDownloadUrl?(key: string, options?: PresignedUrlOptions): Promise<string>;

  /**
   * Generate a presigned URL for direct upload (optional, S3 only)
   */
  getPresignedUploadUrl?(key: string, options?: PresignedUrlOptions): Promise<string>;

  /**
   * Initiate multipart upload (optional, S3 only)
   */
  createMultipartUpload?(key: string, options?: StorageWriteOptions): Promise<string>;

  /**
   * Upload a part in multipart upload (optional, S3 only)
   */
  uploadPart?(
    key: string,
    uploadId: string,
    partNumber: number,
    data: Buffer,
  ): Promise<MultipartUploadPart>;

  /**
   * Complete multipart upload (optional, S3 only)
   */
  completeMultipartUpload?(key: string, uploadId: string, parts: MultipartUploadPart[]): Promise<void>;

  /**
   * Abort multipart upload (optional, S3 only)
   */
  abortMultipartUpload?(key: string, uploadId: string): Promise<void>;
}
