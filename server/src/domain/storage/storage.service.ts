import { Inject, Injectable, Logger } from '@nestjs/common';
import { IDeleteFilesJob } from '../job';
import { StorageCore, StorageFolder } from './storage.core';
import { IStorageRepository } from './storage.repository';

@Injectable()
export class StorageService {
  private logger = new Logger(StorageService.name);
  private storageCore = new StorageCore(this.storageRepository);

  constructor(@Inject(IStorageRepository) private storageRepository: IStorageRepository) {}

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
        // extracts the file's parent folder
        // upload/thumbs/89/ab/89abcd.jpeg -> upload/thumbs/89
        const found = file.match(/(?<path>.*\/.*)\/.*\/.*\..*/);
        if (found?.groups) {
          await this.storageRepository.removeEmptyDirs(found.groups.path, true);
        }
      } catch (error: any) {
        this.logger.warn('Unable to remove file from disk', error);
      }
    }

    return true;
  }
}
