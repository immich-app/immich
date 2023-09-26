import { Stats } from 'fs';
import { Readable } from 'stream';
import { CrawlOptionsDto } from '../library';

export interface ImmichReadStream {
  stream: Readable;
  type?: string;
  length?: number;
}

export interface ImmichZipStream extends ImmichReadStream {
  addFile: (inputPath: string, filename: string) => void;
  finalize: () => Promise<void>;
}

export interface DiskUsage {
  available: number;
  free: number;
  total: number;
}

export const IStorageRepository = 'IStorageRepository';

export interface IStorageRepository {
  createZipStream(): ImmichZipStream;
  createReadStream(filepath: string, mimeType?: string | null): Promise<ImmichReadStream>;
  unlink(filepath: string): Promise<void>;
  unlinkDir(folder: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>;
  removeEmptyDirs(folder: string, self?: boolean): Promise<void>;
  moveFile(source: string, target: string): Promise<void>;
  checkFileExists(filepath: string, mode?: number): Promise<boolean>;
  mkdirSync(filepath: string): void;
  checkDiskUsage(folder: string): Promise<DiskUsage>;
  readdir(folder: string): Promise<string[]>;
  stat(filepath: string): Promise<Stats>;
  crawl(crawlOptions: CrawlOptionsDto): Promise<string[]>;
}
