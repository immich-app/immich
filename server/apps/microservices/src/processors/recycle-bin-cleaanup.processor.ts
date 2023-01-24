import { AssetEntity } from '@app/infra';
import { IJobRepository, JobName, QueueName, SystemConfigService } from '@app/domain';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRecycleBinCleanup } from '@app/domain/job/interfaces/recycle-bin-cleanup.interface';
import { Job } from 'bull';

@Processor(QueueName.RECYCLE_BIN)
export class RecycleBinCleanupProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private systemConfigService: SystemConfigService,

    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {}

  @Process(JobName.RECYCLE_BIN_CLEANUP)
  async cleanupOldAssetInRecycleBin(job: Job<IRecycleBinCleanup>) {
    const { asset } = job.data;
    const currentDate = new Date();
    const config = await this.systemConfigService.getConfig();

    if (asset.deletedAt) {
      const diffInTime = currentDate.getTime() - new Date(asset.deletedAt).getTime();
      const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));

      if (diffInDays > Number(config.recycleBin.days)) {
        const removeAsset = await this.assetRepository.delete(asset.id);

        if (!removeAsset.affected) {
          Logger.error(`Recycle Bin : Could not remove asset ${asset.id}`);
        } else {
          const assets: any[] = [asset];
          await this.jobRepository.add({ name: JobName.DELETE_FILE_ON_DISK, data: { assets } });

          Logger.log(`Recycle bin : Asset has been permanently deleted ${asset.id}!`);
        }
      }
    }
  }
}
