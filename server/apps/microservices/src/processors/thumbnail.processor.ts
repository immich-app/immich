import { APP_UPLOAD_LOCATION } from '@app/common';
import { AssetEntity, AssetType } from '@app/infra';
import { WebpGeneratorProcessor, JpegGeneratorProcessor, QueueName, JobName } from '@app/job';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mapAsset } from 'apps/immich/src/api-v1/asset/response-dto/asset-response.dto';
import { Job, Queue } from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import { existsSync, mkdirSync } from 'node:fs';
import sanitize from 'sanitize-filename';
import sharp from 'sharp';
import { Repository } from 'typeorm/repository/Repository';
import { join } from 'path';
import { CommunicationGateway } from 'apps/immich/src/api-v1/communication/communication.gateway';
import { IMachineLearningJob } from '@app/job/interfaces/machine-learning.interface';

@Processor(QueueName.THUMBNAIL_GENERATION)
export class ThumbnailGeneratorProcessor {
  readonly logger: Logger = new Logger(ThumbnailGeneratorProcessor.name);

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectQueue(QueueName.THUMBNAIL_GENERATION)
    private thumbnailGeneratorQueue: Queue,

    private wsCommunicationGateway: CommunicationGateway,

    @InjectQueue(QueueName.MACHINE_LEARNING)
    private machineLearningQueue: Queue<IMachineLearningJob>,
  ) {}

  @Process({ name: JobName.GENERATE_JPEG_THUMBNAIL, concurrency: 3 })
  async generateJPEGThumbnail(job: Job<JpegGeneratorProcessor>) {
    const basePath = APP_UPLOAD_LOCATION;

    const { asset } = job.data;
    const sanitizedDeviceId = sanitize(String(asset.deviceId));

    const resizePath = join(basePath, asset.userId, 'thumb', sanitizedDeviceId);

    if (!existsSync(resizePath)) {
      mkdirSync(resizePath, { recursive: true });
    }

    const jpegThumbnailPath = join(resizePath, `${asset.id}.jpeg`);

    if (asset.type == AssetType.IMAGE) {
      try {
        await sharp(asset.originalPath, { failOnError: false })
          .resize(1440, 2560, { fit: 'inside' })
          .jpeg()
          .rotate()
          .toFile(jpegThumbnailPath);
        await this.assetRepository.update({ id: asset.id }, { resizePath: jpegThumbnailPath });
      } catch (error: any) {
        this.logger.error('Failed to generate jpeg thumbnail for asset: ' + asset.id, error.stack);
      }

      // Update resize path to send to generate webp queue
      asset.resizePath = jpegThumbnailPath;

      await this.thumbnailGeneratorQueue.add(JobName.GENERATE_WEBP_THUMBNAIL, { asset });
      await this.machineLearningQueue.add(JobName.IMAGE_TAGGING, { asset });
      await this.machineLearningQueue.add(JobName.OBJECT_DETECTION, { asset });

      this.wsCommunicationGateway.server.to(asset.userId).emit('on_upload_success', JSON.stringify(mapAsset(asset)));
    }

    if (asset.type == AssetType.VIDEO) {
      await new Promise((resolve, reject) => {
        ffmpeg(asset.originalPath)
          .outputOptions(['-ss 00:00:00.000', '-frames:v 1'])
          .output(jpegThumbnailPath)
          .on('start', () => {
            Logger.log('Start Generating Video Thumbnail', 'generateJPEGThumbnail');
          })
          .on('error', (error) => {
            Logger.error(`Cannot Generate Video Thumbnail ${error}`, 'generateJPEGThumbnail');
            reject(error);
          })
          .on('end', async () => {
            Logger.log(`Generating Video Thumbnail Success ${asset.id}`, 'generateJPEGThumbnail');
            resolve(asset);
          })
          .run();
      });

      await this.assetRepository.update({ id: asset.id }, { resizePath: jpegThumbnailPath });

      // Update resize path to send to generate webp queue
      asset.resizePath = jpegThumbnailPath;

      await this.thumbnailGeneratorQueue.add(JobName.GENERATE_WEBP_THUMBNAIL, { asset });
      await this.machineLearningQueue.add(JobName.IMAGE_TAGGING, { asset });
      await this.machineLearningQueue.add(JobName.OBJECT_DETECTION, { asset });

      this.wsCommunicationGateway.server.to(asset.userId).emit('on_upload_success', JSON.stringify(mapAsset(asset)));
    }
  }

  @Process({ name: JobName.GENERATE_WEBP_THUMBNAIL, concurrency: 3 })
  async generateWepbThumbnail(job: Job<WebpGeneratorProcessor>) {
    const { asset } = job.data;

    if (!asset.resizePath) {
      return;
    }

    const webpPath = asset.resizePath.replace('jpeg', 'webp');

    try {
      await sharp(asset.resizePath, { failOnError: false }).resize(250).webp().rotate().toFile(webpPath);
      await this.assetRepository.update({ id: asset.id }, { webpPath: webpPath });
    } catch (error: any) {
      this.logger.error('Failed to generate webp thumbnail for asset: ' + asset.id, error.stack);
    }
  }
}
