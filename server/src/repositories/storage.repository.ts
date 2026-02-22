import type { WalkItem } from '@immich/walkrs' with { 'resolution-mode': 'import' };
import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import chokidar, { ChokidarOptions } from 'chokidar';
import { constants, createReadStream, createWriteStream, existsSync, mkdirSync, ReadOptionsWithBuffer } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PassThrough, Readable, Writable } from 'node:stream';
import { createGunzip, createGzip } from 'node:zlib';
import { WalkOptionsDto } from 'src/dtos/library.dto';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { mimeTypes } from 'src/utils/mime-types';

export interface WatchEvents {
  onReady(): void;
  onAdd(path: string): void;
  onChange(path: string): void;
  onUnlink(path: string): void;
  onError(error: Error): void;
}

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

@Injectable()
export class StorageRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(StorageRepository.name);
  }

  realpath(filepath: string) {
    return fs.realpath(filepath);
  }

  readdir(folder: string): Promise<string[]> {
    return fs.readdir(folder);
  }

  copyFile(source: string, target: string) {
    return fs.copyFile(source, target);
  }

  stat(filepath: string) {
    return fs.stat(filepath);
  }

  createFile(filepath: string, buffer: Buffer) {
    return fs.writeFile(filepath, buffer, { flag: 'wx' });
  }

  createWriteStream(filepath: string): Writable {
    return createWriteStream(filepath, { flags: 'w' });
  }

  createOrOverwriteFile(filepath: string, buffer: Buffer) {
    return fs.writeFile(filepath, buffer, { flag: 'w' });
  }

  overwriteFile(filepath: string, buffer: Buffer) {
    return fs.writeFile(filepath, buffer, { flag: 'r+' });
  }

  rename(source: string, target: string) {
    return fs.rename(source, target);
  }

  utimes(filepath: string, atime: Date, mtime: Date) {
    return fs.utimes(filepath, atime, mtime);
  }

  createZipStream(): ImmichZipStream {
    const archive = archiver('zip', { store: true });

    const addFile = (input: string, filename: string) => {
      archive.file(input, { name: filename, mode: 0o644 });
    };

    const finalize = () => archive.finalize();

    return { stream: archive, addFile, finalize };
  }

  createGzip(): PassThrough {
    return createGzip();
  }

  createGunzip(): PassThrough {
    return createGunzip();
  }

  createPlainReadStream(filepath: string): Readable {
    return createReadStream(filepath);
  }

  async createReadStream(filepath: string, mimeType?: string | null): Promise<ImmichReadStream> {
    const { size } = await fs.stat(filepath);
    await fs.access(filepath, constants.R_OK);
    return {
      stream: createReadStream(filepath),
      length: size,
      type: mimeType || undefined,
    };
  }

  async readFile(filepath: string, options?: ReadOptionsWithBuffer<Buffer>): Promise<Buffer> {
    const file = await fs.open(filepath);
    try {
      const { buffer } = await file.read(options);
      return buffer as Buffer;
    } finally {
      await file.close();
    }
  }

  async readTextFile(filepath: string): Promise<string> {
    return fs.readFile(filepath, 'utf8');
  }

  async checkFileExists(filepath: string, mode = constants.F_OK): Promise<boolean> {
    try {
      await fs.access(filepath, mode);
      return true;
    } catch {
      return false;
    }
  }

  async unlink(file: string) {
    try {
      await fs.unlink(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        this.logger.warn(`File ${file} does not exist.`);
      } else {
        throw error;
      }
    }
  }

  async unlinkDir(folder: string, options: { recursive?: boolean; force?: boolean }) {
    await fs.rm(folder, { ...options, maxRetries: 5, retryDelay: 100 });
  }

  async removeEmptyDirs(directory: string, self: boolean = false) {
    // lstat does not follow symlinks (in contrast to stat)
    const stats = await fs.lstat(directory);
    if (!stats.isDirectory()) {
      return;
    }

    const files = await fs.readdir(directory);
    await Promise.all(files.map((file) => this.removeEmptyDirs(path.join(directory, file), true)));

    if (self) {
      const updated = await fs.readdir(directory);
      if (updated.length === 0) {
        try {
          await fs.rmdir(directory);
        } catch (error: Error | any) {
          if (error.code !== 'ENOTEMPTY') {
            this.logger.warn(`Attempted to remove directory, but failed: ${error}`);
          }
        }
      }
    }
  }

  mkdirSync(filepath: string): void {
    if (!existsSync(filepath)) {
      mkdirSync(filepath, { recursive: true });
    }
  }

  existsSync(filepath: string) {
    return existsSync(filepath);
  }

  async checkDiskUsage(folder: string): Promise<DiskUsage> {
    const stats = await fs.statfs(folder);
    return {
      available: stats.bavail * stats.bsize,
      free: stats.bfree * stats.bsize,
      total: stats.blocks * stats.bsize,
    };
  }

  async *walk(walkOptions: WalkOptionsDto): AsyncGenerator<WalkItem[], void, unknown> {
    const { pathsToWalk, exclusionPatterns, includeHidden } = walkOptions;
    if (pathsToWalk.length === 0) {
      return;
    }

    const { walk } = await import('@immich/walkrs');

    yield* walk({
      paths: pathsToWalk.map((p) => path.resolve(p)),
      includeHidden: includeHidden ?? false,
      exclusionPatterns,
      extensions: mimeTypes.getSupportedFileExtensions(),
    });
  }

  watch(paths: string[], options: ChokidarOptions, events: Partial<WatchEvents>) {
    const watcher = chokidar.watch(paths, options);

    watcher.on('ready', () => events.onReady?.());
    watcher.on('add', (path) => events.onAdd?.(path));
    watcher.on('change', (path) => events.onChange?.(path));
    watcher.on('unlink', (path) => events.onUnlink?.(path));
    watcher.on('error', (error) => events.onError?.(error as Error));

    return () => watcher.close();
  }
}
