import { Inject, Injectable } from '@nestjs/common';
import archiver from 'archiver';
import chokidar, { WatchOptions } from 'chokidar';
import { escapePath, glob, globStream } from 'fast-glob';
import { constants, createReadStream, existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CrawlOptionsDto } from 'src/dtos/library.dto';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  DiskUsage,
  IStorageRepository,
  ImmichReadStream,
  ImmichZipStream,
  WatchEvents,
} from 'src/interfaces/storage.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { mimeTypes } from 'src/utils/mime-types';

@Instrumentation()
@Injectable()
export class StorageRepository implements IStorageRepository {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(StorageRepository.name);
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

  writeFile(filepath: string, buffer: Buffer) {
    return fs.writeFile(filepath, buffer);
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
      archive.file(input, { name: filename });
    };

    const finalize = () => archive.finalize();

    return { stream: archive, addFile, finalize };
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

  async readFile(filepath: string, options?: fs.FileReadOptions<Buffer>): Promise<Buffer> {
    const file = await fs.open(filepath);
    try {
      const { buffer } = await file.read(options);
      return buffer;
    } finally {
      await file.close();
    }
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
    await fs.rm(folder, options);
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
        await fs.rmdir(directory);
      }
    }
  }

  mkdirSync(filepath: string): void {
    if (!existsSync(filepath)) {
      mkdirSync(filepath, { recursive: true });
    }
  }

  async checkDiskUsage(folder: string): Promise<DiskUsage> {
    const stats = await fs.statfs(folder);
    return {
      available: stats.bavail * stats.bsize,
      free: stats.bfree * stats.bsize,
      total: stats.blocks * stats.bsize,
    };
  }

  crawl(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const { pathsToCrawl, exclusionPatterns, includeHidden } = crawlOptions;
    if (pathsToCrawl.length === 0) {
      return Promise.resolve([]);
    }

    return glob(this.asGlob(pathsToCrawl), {
      absolute: true,
      caseSensitiveMatch: false,
      onlyFiles: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });
  }

  async *walk(crawlOptions: CrawlOptionsDto): AsyncGenerator<string> {
    const { pathsToCrawl, exclusionPatterns, includeHidden } = crawlOptions;
    if (pathsToCrawl.length === 0) {
      async function* emptyGenerator() {}
      return emptyGenerator();
    }

    const stream = globStream(this.asGlob(pathsToCrawl), {
      absolute: true,
      caseSensitiveMatch: false,
      onlyFiles: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });

    for await (const value of stream) {
      yield value as string;
    }
  }

  watch(paths: string[], options: WatchOptions, events: Partial<WatchEvents>) {
    const watcher = chokidar.watch(paths, options);

    watcher.on('ready', () => events.onReady?.());
    watcher.on('add', (path) => events.onAdd?.(path));
    watcher.on('change', (path) => events.onChange?.(path));
    watcher.on('unlink', (path) => events.onUnlink?.(path));
    watcher.on('error', (error) => events.onError?.(error));

    return () => watcher.close();
  }

  private asGlob(pathsToCrawl: string[]): string {
    const escapedPaths = pathsToCrawl.map((path) => escapePath(path));
    const base = escapedPaths.length === 1 ? escapedPaths[0] : `{${escapedPaths.join(',')}}`;
    const extensions = `*{${mimeTypes.getSupportedFileExtensions().join(',')}}`;
    return `${base}/**/${extensions}`;
  }
}
