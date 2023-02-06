import { Inject, Injectable } from '@nestjs/common';
import { IAssetUploadedJob } from './interfaces';
import { JobUploadCore } from './job.upload.core';
import { IJobRepository, Job } from './job.repository';

@Injectable()
export class JobService {
  private uploadCore: JobUploadCore;

  constructor(@Inject(IJobRepository) repository: IJobRepository) {
    this.uploadCore = new JobUploadCore(repository);
  }

  async handleUploadedAsset(job: Job<IAssetUploadedJob>) {
    await this.uploadCore.handleAsset(job);
  }
}
