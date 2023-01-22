import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { AssetEntity, AssetType, ExifEntity, UserEntity } from '@app/infra';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IMetadataExtractionJob, IVideoTranscodeJob, QueueName, JobName } from '@app/domain';
import { ConfigService } from '@nestjs/config';
import { IUserDeletionJob } from '@app/domain';
import { userUtils } from '@app/common';

@Injectable()
export class ScheduleTasksService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    @InjectQueue(QueueName.THUMBNAIL_GENERATION)
    private thumbnailGeneratorQueue: Queue,

    @InjectQueue(QueueName.VIDEO_CONVERSION)
    private videoConversionQueue: Queue<IVideoTranscodeJob>,

    @InjectQueue(QueueName.METADATA_EXTRACTION)
    private metadataExtractionQueue: Queue<IMetadataExtractionJob>,

    @InjectQueue(QueueName.USER_DELETION)
    private userDeletionQueue: Queue<IUserDeletionJob>,

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
      await this.thumbnailGeneratorQueue.add(JobName.GENERATE_WEBP_THUMBNAIL, { asset: asset });
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
      await this.videoConversionQueue.add(JobName.VIDEO_CONVERSION, { asset });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async reverseGeocoding() {
    const isGeocodingEnabled = this.configService.get('DISABLE_REVERSE_GEOCODING') !== 'true';

    if (isGeocodingEnabled) {
      const exifInfo = await this.exifRepository.find({
        where: {
          city: IsNull(),
          longitude: Not(IsNull()),
          latitude: Not(IsNull()),
        },
      });

      for (const exif of exifInfo) {
        await this.metadataExtractionQueue.add(
          JobName.REVERSE_GEOCODING,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          { exifId: exif.id, latitude: exif.latitude!, longitude: exif.longitude! },
        );
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async extractExif() {
    const exifAssets = await this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.exifInfo', 'ei')
      .where('ei."assetId" IS NULL')
      .getMany();

    for (const asset of exifAssets) {
      if (asset.type === AssetType.VIDEO) {
        await this.metadataExtractionQueue.add(JobName.EXTRACT_VIDEO_METADATA, { asset, fileName: asset.id });
      } else {
        await this.metadataExtractionQueue.add(JobName.EXIF_EXTRACTION, { asset, fileName: asset.id });
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deleteUserAndRelatedAssets() {
    const usersToDelete = await this.userRepository.find({ withDeleted: true, where: { deletedAt: Not(IsNull()) } });
    for (const user of usersToDelete) {
      if (userUtils.isReadyForDeletion(user)) {
        await this.userDeletionQueue.add(JobName.USER_DELETION, { user });
      }
    }
  }
}
