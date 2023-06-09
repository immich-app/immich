import { DiskUsage, ImmichReadStream, IStorageRepository } from '@app/domain';
import { constants, createReadStream, existsSync, mkdirSync } from 'fs';
import fs from 'fs/promises';
import mv from 'mv';
import { promisify } from 'node:util';
import path from 'path';

const moveFile = promisify<string, string, mv.Options>(mv);

export class FilesystemProvider implements IStorageRepository {
  async createReadStream(filepath: string, mimeType: string): Promise<ImmichReadStream> {
    const { size } = await fs.stat(filepath);
    await fs.access(filepath, constants.R_OK | constants.W_OK);
    return {
      stream: createReadStream(filepath),
      length: size,
      type: mimeType,
    };
  }

  async moveFile(source: string, destination: string): Promise<void> {
    await moveFile(source, destination, { mkdirp: true, clobber: false });
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
}
