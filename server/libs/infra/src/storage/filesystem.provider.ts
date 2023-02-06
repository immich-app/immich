import { ImmichReadStream, IStorageRepository } from '@app/domain';
import { constants, createReadStream, stat } from 'fs';
import fs from 'fs/promises';
import { promisify } from 'util';

const fileInfo = promisify(stat);

export class FilesystemProvider implements IStorageRepository {
  async createReadStream(filepath: string, mimeType: string): Promise<ImmichReadStream> {
    const { size } = await fileInfo(filepath);
    await fs.access(filepath, constants.R_OK | constants.W_OK);
    return {
      stream: createReadStream(filepath),
      length: size,
      type: mimeType,
    };
  }
}
