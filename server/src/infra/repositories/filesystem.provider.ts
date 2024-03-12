import {
  CrawlOptionsDto,
  DiskUsage,
  IStorageRepository,
  ImmichReadStream,
  ImmichZipStream,
  StorageEventType,
  WatchEvents,
  mimeTypes,
} from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import archiver from 'archiver';
import chokidar, { WatchOptions } from 'chokidar';
import { glob } from 'fast-glob';
import { constants, createReadStream, existsSync, mkdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Instrumentation } from '../instrumentation';

@Instrumentation()
export class FilesystemProvider implements IStorageRepository {
  private logger = new ImmichLogger(FilesystemProvider.name);

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

    const base = pathsToCrawl.length === 1 ? pathsToCrawl[0] : `{${pathsToCrawl.join(',')}}`;
    const extensions = `*{${mimeTypes.getSupportedFileExtensions().join(',')}}`;

    return glob(`${base}/**/${extensions}`, {
      absolute: true,
      caseSensitiveMatch: false,
      onlyFiles: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });
  }

  watch(paths: string[], options: WatchOptions, events: Partial<WatchEvents>) {
    const watcher = chokidar.watch(paths, options);

    watcher.on(StorageEventType.READY, () => events.onReady?.());
    watcher.on(StorageEventType.ADD, (path) => events.onAdd?.(path));
    watcher.on(StorageEventType.CHANGE, (path) => events.onChange?.(path));
    watcher.on(StorageEventType.UNLINK, (path) => events.onUnlink?.(path));
    watcher.on(StorageEventType.ERROR, (error) => events.onError?.(error));

    return () => watcher.close();
  }
}
