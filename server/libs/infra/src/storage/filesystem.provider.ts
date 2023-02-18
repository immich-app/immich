import { ImmichReadStream, IStorageRepository } from '@app/domain';
import { constants, createReadStream } from 'fs';
import fs from 'fs/promises';

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

  async unlink(file: string) {
    await fs.unlink(file);
  }

  async unlinkDir(folder: string, options: { recursive?: boolean; force?: boolean }) {
    await fs.rm(folder, options);
  }
}
