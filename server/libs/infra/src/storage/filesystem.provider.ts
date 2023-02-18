import { ImmichReadStream, IStorageRepository } from '@app/domain';
import { constants, createReadStream } from 'fs';
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

  async checkFileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath, constants.F_OK);
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
    // lstat does not follow symlinks (in contrast to stat)
    const fileStats = await fs.lstat(directory);
    if (!fileStats.isDirectory()) {
      return;
    }
    let fileNames = await fs.readdir(directory);
    if (fileNames.length > 0) {
      const recursiveRemovalPromises = fileNames.map((fileName) =>
        this.removeEmptyDirs(path.join(directory, fileName)),
      );
      await Promise.all(recursiveRemovalPromises);

      // re-evaluate fileNames; after deleting subdirectory
      // we may have parent directory empty now
      fileNames = await fs.readdir(directory);
    }

    if (fileNames.length === 0) {
      await fs.rmdir(directory);
    }
  }
}
