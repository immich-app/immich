import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';

@Injectable()
export class ScheduleTasksService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectQueue('thumbnail-generator-queue')
    private thumbnailGeneratorQueue: Queue,

    @InjectQueue('video-conversion-queue')
    private videoConversionQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async webpConversion() {
    Logger.log('Starting Schedule Webp Conversion Tasks', 'CronjobWebpGenerator');

    const assets = await this.assetRepository.find({
      where: {
        webpPath: '',
      },
    });

    if (assets.length == 0) {
      Logger.log('All assets has webp file - aborting task', 'CronjobWebpGenerator');
      return;
    }

    for (const asset of assets) {
      await this.thumbnailGeneratorQueue.add('generate-webp-thumbnail', { asset: asset }, { jobId: randomUUID() });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async videoConversion() {
    const assets = await this.assetRepository.find({
      where: {
        type: AssetType.VIDEO,
        mimeType: 'video/quicktime',
        encodedVideoPath: '',
      },
      order: {
        createdAt: 'DESC',
      },
    });

    for (const asset of assets) {
      await this.videoConversionQueue.add('mp4-conversion', { asset }, { jobId: randomUUID() });
    }
  }
}
