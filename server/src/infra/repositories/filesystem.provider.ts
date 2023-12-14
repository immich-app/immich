import {
  CrawlOptionsDto,
  DiskUsage,
  ImmichReadStream,
  ImmichZipStream,
  IStorageRepository,
  mimeTypes,
} from '@app/domain';
import { ImmichLogger } from '@app/infra/logger';
import archiver from 'archiver';
import { constants, createReadStream, existsSync, mkdirSync } from 'fs';
import fs, { readdir, writeFile } from 'fs/promises';
import { glob } from 'glob';
import mv from 'mv';
import { promisify } from 'node:util';
import path from 'path';

const moveFile = promisify<string, string, mv.Options>(mv);

export class FilesystemProvider implements IStorageRepository {
  private logger = new ImmichLogger(FilesystemProvider.name);

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

  async moveFile(source: string, destination: string): Promise<void> {
    this.logger.verbose(`Moving ${source} to ${destination}`);

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

  readdir = readdir;
}
