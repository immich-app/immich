import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity, SmartInfoEntity } from '@app/database';
import { Job } from 'bull';
import { AssetResponseDto } from '../../api-v1/asset/response-dto/asset-response.dto';
import { assetUtils } from '@app/common/utils';

@Processor('background-task')
export class BackgroundTaskProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  // TODO: Should probably use constants / Interfaces for Queue names / data
  @Process('delete-file-on-disk')
  async deleteFileOnDisk(job: Job<{ assets: AssetResponseDto[] }>) {
    const { assets } = job.data;

    for (const asset of assets) {
      assetUtils.deleteFiles(asset);
    }
  }
}
