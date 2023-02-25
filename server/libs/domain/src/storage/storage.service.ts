import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDeleteFilesJob } from '../job';
import { IStorageRepository } from './storage.repository';

@Injectable()
export class StorageService {
  private logger = new Logger(StorageService.name);

  constructor(@Inject(IStorageRepository) private storageRepository: IStorageRepository) {}

  async handleDeleteFiles(job: IDeleteFilesJob) {
    const { files } = job;

    for (const file of files) {
      if (!file) {
        continue;
      }

      try {
        await this.storageRepository.unlink(file);
      } catch (error: any) {
        this.logger.warn('Unable to remove file from disk', error);
      }
    }
  }
}
