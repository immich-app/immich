// Phase 0 stub for S3 backend — not wired into the app yet
import { Readable, Writable } from 'node:stream';
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
  // Intentionally defer importing @aws-sdk/* to a later phase
  constructor(private opts: S3BackendOptions) {}

  // Helpers kept simple for Phase 0; to be implemented in Phase 1/2
  private notReady(): never {
    throw new Error('S3 backend not implemented (Phase 1/2)');
  }

  exists(_key: string): Promise<boolean> { this.notReady(); }
  head(_key: string): Promise<AppStorageHead> { this.notReady(); }
  readStream(_key: string, _range?: AppStorageRange): Promise<Readable> { this.notReady(); }
  writeStream(_key: string): Promise<Writable> { this.notReady(); }
  putObject(_key: string, _buffer: Buffer): Promise<void> { this.notReady(); }
  copyObject(_srcKey: string, _dstKey: string): Promise<void> { this.notReady(); }
  moveObject(_srcKey: string, _dstKey: string): Promise<void> { this.notReady(); }
  deleteObject(_key: string): Promise<void> { this.notReady(); }
  ensurePrefix(_prefix: string): Promise<void> { this.notReady(); }
}

