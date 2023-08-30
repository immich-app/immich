import {
  CrawlOptionsDto,
  DiskUsage,
  ImmichReadStream,
  ImmichZipStream,
  IStorageRepository,
  mimeTypes,
} from '@app/domain';
import archiver from 'archiver';
import { constants, createReadStream, existsSync, mkdirSync } from 'fs';
import fs, { readdir } from 'fs/promises';
import { glob } from 'glob';
import mv from 'mv';
import { promisify } from 'node:util';
import path from 'path';

const moveFile = promisify<string, string, mv.Options>(mv);

export class FilesystemProvider implements IStorageRepository {
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

  async moveFile(source: string, destination: string): Promise<void> {
    if (await this.checkFileExists(destination)) {
      throw new Error(`Destination file already exists: ${destination}`);
    }

    await moveFile(source, destination, { mkdirp: true, clobber: true });
  }

  async checkFileExists(filepath: string, mode = constants.F_OK): Promise<boolean> {
    try {
      await fs.access(filepath, mode);
      return true;
    } catch (_) {
      return false;
    }
  }

  async unlink(file: string) {
    await fs.unlink(file);
  }

  stat = fs.stat;

  async unlinkDir(folder: string, options: { recursive?: boolean; force?: boolean }) {
    await fs.rm(folder, options);
  }

  async removeEmptyDirs(directory: string) {
    this._removeEmptyDirs(directory, false);
  }

  private async _removeEmptyDirs(directory: string, self: boolean) {
    // lstat does not follow symlinks (in contrast to stat)
    const stats = await fs.lstat(directory);
    if (!stats.isDirectory()) {
      return;
    }

    const files = await fs.readdir(directory);
    await Promise.all(files.map((file) => this._removeEmptyDirs(path.join(directory, file), true)));

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

  async crawl(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const pathsToCrawl = crawlOptions.pathsToCrawl;

    let paths: string;
    if (!pathsToCrawl) {
      // No paths to crawl, return empty list
      return [];
    } else if (pathsToCrawl.length === 1) {
      paths = pathsToCrawl[0];
    } else {
      paths = '{' + pathsToCrawl.join(',') + '}';
    }

    paths = paths + '/**/*{' + mimeTypes.getSupportedFileExtensions().join(',') + '}';

    return (await glob(paths, { nocase: true, nodir: true, ignore: crawlOptions.exclusionPatterns })).map((assetPath) =>
      path.normalize(assetPath),
    );
  }

  readdir = readdir;
}
