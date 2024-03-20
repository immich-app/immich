import { Inject, Injectable } from '@nestjs/common';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { IDeleteFilesJob } from 'src/domain/job/job.interface';
import { JobStatus } from 'src/domain/repositories/job.repository';
import { IStorageRepository } from 'src/domain/repositories/storage.repository';
import { ImmichLogger } from 'src/infra/logger';

@Injectable()
export class StorageService {
  private logger = new ImmichLogger(StorageService.name);

  constructor(@Inject(IStorageRepository) private storageRepository: IStorageRepository) {}

  init() {
    const libraryBase = StorageCore.getBaseFolder(StorageFolder.LIBRARY);
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

    return JobStatus.SUCCESS;
  }
}
