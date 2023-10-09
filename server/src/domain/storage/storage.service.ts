import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDeleteFilesJob } from '../job';
import { IStorageRepository } from '../repositories';
import { StorageCore, StorageFolder } from './storage.core';

@Injectable()
export class StorageService {
  private logger = new Logger(StorageService.name);
  private storageCore: StorageCore;

  constructor(@Inject(IStorageRepository) private storageRepository: IStorageRepository) {
    this.storageCore = new StorageCore(storageRepository);
  }

  init() {
    const libraryBase = this.storageCore.getBaseFolder(StorageFolder.LIBRARY);
    this.storageRepository.mkdirSync(libraryBase);
  }

  async handleDeleteFiles(job: IDeleteFilesJob) {
    const { files } = job;

    // TODO: one job per file
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

    return true;
  }
}
