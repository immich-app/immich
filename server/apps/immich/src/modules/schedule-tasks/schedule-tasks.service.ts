import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';
import { ExifEntity } from '@app/database/entities/exif.entity';
import {
  IMetadataExtractionJob,
  IVideoTranscodeJob,
  metadataExtractionQueueName,
  thumbnailGeneratorQueueName,
  videoConversionQueueName,
  generateWEBPThumbnailProcessorName,
  mp4ConversionProcessorName,
  reverseGeocodingProcessorName,
} from '@app/job';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ScheduleTasksService {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    @InjectQueue(thumbnailGeneratorQueueName)
    private thumbnailGeneratorQueue: Queue,

    @InjectQueue(videoConversionQueueName)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,

    @InjectQueue(metadataExtractionQueueName)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    private configService: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async webpConversion() {
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
      await this.thumbnailGeneratorQueue.add(
        generateWEBPThumbnailProcessorName,
        { asset: asset },
        { jobId: randomUUID() },
      );
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
      await this.videoConversionQueue.add(mp4ConversionProcessorName, { asset }, { jobId: randomUUID() });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async reverseGeocoding() {
    const isMapboxEnable = this.configService.get('ENABLE_MAPBOX');

    if (isMapboxEnable) {
      const exifInfo = await this.exifRepository.find({
        where: {
          city: IsNull(),
          longitude: Not(IsNull()),
          latitude: Not(IsNull()),
        },
      });

      for (const exif of exifInfo) {
        await this.metadataExtractionQueue.add(
          reverseGeocodingProcessorName,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          { exifId: exif.id, latitude: exif.latitude!, longitude: exif.longitude! },
          { jobId: randomUUID() },
        );
      }
    }
  }
}
