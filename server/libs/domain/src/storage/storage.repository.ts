import { ReadStream } from 'fs';

export interface ImmichReadStream {
  stream: ReadStream;
  type: string;
  length: number;
}

export interface DiskUsage {
  available: number;
  free: number;
  total: number;
}

export const IStorageRepository = 'IStorageRepository';

export interface IStorageRepository {
  createReadStream(filepath: string, mimeType: string): Promise<ImmichReadStream>;
  unlink(filepath: string): Promise<void>;
  unlinkDir(folder: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  removeEmptyDirs(folder: string): Promise<void>;
  moveFile(source: string, target: string): Promise<void>;
  checkFileExists(filepath: string, mode?: number): Promise<boolean>;
  mkdirSync(filepath: string): void;
  checkDiskUsage(folder: string): Promise<DiskUsage>;
}
