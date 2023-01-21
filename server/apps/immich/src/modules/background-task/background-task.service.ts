import { IJobRepository, JobName } from '@app/domain';
import { AssetEntity } from '@app/infra';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class BackgroundTaskService {
  constructor(@Inject(IJobRepository) private jobRepository: IJobRepository) {}

  async deleteFileOnDisk(assets: AssetEntity[]) {
    await this.jobRepository.add({ name: JobName.DELETE_FILE_ON_DISK, data: { assets } });
  }
}
