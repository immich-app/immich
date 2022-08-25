import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import {
  WebpGeneratorProcessor,
  generateJPEGThumbnailProcessorName,
  generateWEBPThumbnailProcessorName,
  imageTaggingProcessorName,
  objectDetectionProcessorName,
  metadataExtractionQueueName,
  thumbnailGeneratorQueueName,
  JpegGeneratorProcessor,
} from '@app/job';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { mapAsset } from 'apps/immich/src/api-v1/asset/response-dto/asset-response.dto';
import { Job, Queue } from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { Repository } from 'typeorm/repository/Repository';
import { CommunicationGateway } from '../../../immich/src/api-v1/communication/communication.gateway';

@Processor(thumbnailGeneratorQueueName)
export class ThumbnailGeneratorProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectQueue(thumbnailGeneratorQueueName)
    private thumbnailGeneratorQueue: Queue,

    private wsCommunicationGateway: CommunicationGateway,

    @InjectQueue(metadataExtractionQueueName)
    private metadataExtractionQueue: Queue,
  ) {}

  @Process({ name: generateJPEGThumbnailProcessorName, concurrency: 3 })
  async generateJPEGThumbnail(job: Job<JpegGeneratorProcessor>) {
    const { asset } = job.data;

    const resizePath = `upload/${asset.userId}/thumb/${asset.deviceId}/`;

    if (!existsSync(resizePath)) {
      mkdirSync(resizePath, { recursive: true });
    }

    const temp = asset.originalPath.split('/');
    const originalFilename = temp[temp.length - 1].split('.')[0];
    const jpegThumbnailPath = resizePath + originalFilename + '.jpeg';

    if (asset.type == AssetType.IMAGE) {
      await sharp(asset.originalPath).resize(1440, 2560, { fit: 'inside' }).jpeg().rotate().toFile(jpegThumbnailPath);
      await this.assetRepository.update({ id: asset.id }, { resizePath: jpegThumbnailPath });

      // Update resize path to send to generate webp queue
      asset.resizePath = jpegThumbnailPath;

      await this.thumbnailGeneratorQueue.add(generateWEBPThumbnailProcessorName, { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add(imageTaggingProcessorName, { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add(objectDetectionProcessorName, { asset }, { jobId: randomUUID() });
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

      await this.thumbnailGeneratorQueue.add(generateWEBPThumbnailProcessorName, { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add(imageTaggingProcessorName, { asset }, { jobId: randomUUID() });
      await this.metadataExtractionQueue.add(objectDetectionProcessorName, { asset }, { jobId: randomUUID() });

      this.wsCommunicationGateway.server.to(asset.userId).emit('on_upload_success', JSON.stringify(mapAsset(asset)));
    }
  }

  @Process({ name: generateWEBPThumbnailProcessorName, concurrency: 3 })
  async generateWepbThumbnail(job: Job<WebpGeneratorProcessor>) {
    const { asset } = job.data;

    if (!asset.resizePath) {
      return;
    }

    const webpPath = asset.resizePath.replace('jpeg', 'webp');

    await sharp(asset.resizePath).resize(250).webp().rotate().toFile(webpPath);
    await this.assetRepository.update({ id: asset.id }, { webpPath: webpPath });
  }
}
