import {
  CrawlOptionsDto,
  DiskUsage,
  ImmichReadStream,
  ImmichZipStream,
  IStorageRepository,
  ISystemConfigRepository,
  mimeTypes,
  SystemConfigCore,
} from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import { Inject } from '@nestjs/common';
import archiver from 'archiver';
import chokidar, { FSWatcher, WatchOptions } from 'chokidar';
import { constants, createReadStream, existsSync, mkdirSync } from 'fs';
import fs, { copyFile, readdir, rename, writeFile } from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

export class FilesystemProvider implements IStorageRepository {
  private logger = new ImmichLogger(FilesystemProvider.name);
  private configCore: SystemConfigCore;

  private watchers: Record<string, chokidar.FSWatcher> = {};
  private watchFeatureFlag = false;

  constructor(@Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository) {
    this.configCore = SystemConfigCore.create(configRepository);
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

  writeFile = writeFile;

  rename = rename;

  copyFile = copyFile;

  async checkFileExists(filepath: string, mode = constants.F_OK): Promise<boolean> {
    try {
      await fs.access(filepath, mode);
      return true;
    } catch (_) {
      return false;
    }
  }

  async unlink(file: string) {
    try {
      await fs.unlink(file);
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
        this.logger.warn(`File ${file} does not exist.`);
      } else {
        throw err;
      }
    }
  }

  stat = fs.stat;

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
    if (!pathsToCrawl) {
      return Promise.resolve([]);
    }

    const base = pathsToCrawl.length === 1 ? pathsToCrawl[0] : `{${pathsToCrawl.join(',')}}`;
    const extensions = `*{${mimeTypes.getSupportedFileExtensions().join(',')}}`;

    return glob(`${base}/**/${extensions}`, {
      absolute: true,
      nocase: true,
      nodir: true,
      dot: includeHidden,
      ignore: exclusionPatterns,
    });
  }

  async watch(id: string, paths: string | ReadonlyArray<string>, options?: WatchOptions): Promise<FSWatcher> {
    const config = await this.configCore.getConfig();

    if (!config.library.watch.enabled) {
      throw new Error("Library watch feature is disabled, can't watch library");
    }

    // Stop any previous watchers of this library
    await this.unwatch(id);

    const watcher = chokidar.watch(paths, {
      usePolling: config.library.watch.usePolling,
      interval: config.library.watch.interval,
      binaryInterval: config.library.watch.interval,
      awaitWriteFinish: {
        stabilityThreshold: config.library.watch.awaitWriteFinish.stabilityThreshold,
        pollInterval: config.library.watch.awaitWriteFinish.pollInterval,
      },
      ...options,
    });

    this.watchers[id] = watcher;

    return watcher;
  }

  async unwatchAll() {
    for (const id in this.watchers) {
      await this.unwatch(id);
    }
  }

  async unwatch(id: string) {
    if (this.watchers.hasOwnProperty(id)) {
      await this.watchers[id].close();
      delete this.watchers[id];
    }
  }

  readdir = readdir;
}
