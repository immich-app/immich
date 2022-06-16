import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { CommunicationGateway } from '../../../immich/src/api-v1/communication/communication.gateway';

@Processor('thumbnail-generator-queue')
export class ThumbnailGeneratorProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectQueue('thumbnail-generator-queue')
    private thumbnailGeneratorQueue: Queue,

    private wsCommunicateionGateway: CommunicationGateway,
  ) {}

  @Process('generate-jpeg-thumbnail')
  async generateJPEGThumbnail(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    const resizePath = `upload/${asset.userId}/thumb/${asset.deviceId}/`;

    if (!existsSync(resizePath)) {
      mkdirSync(resizePath, { recursive: true });
    }

    const temp = asset.originalPath.split('/');
    const originalFilename = temp[temp.length - 1].split('.')[0];

    if (asset.type == AssetType.IMAGE) {
      const jpegThumbnailPath = resizePath + originalFilename + '.jpeg';

      sharp(asset.originalPath)
        .resize(1440, 2560, { fit: 'inside' })
        .jpeg()
        .toFile(jpegThumbnailPath, async (err, info) => {
          if (!err) {
            this.assetRepository.update({ id: asset.id }, { resizePath: jpegThumbnailPath });

            // Update resize path to send to generate webp
            asset.resizePath = jpegThumbnailPath;

            await this.thumbnailGeneratorQueue.add('generate-webp-thumbnail', { asset }, { jobId: randomUUID() });

            this.wsCommunicateionGateway.server.to(asset.userId).emit('on_upload_success', JSON.stringify(asset));
          }
        });
    }

    if (asset.type == AssetType.VIDEO) {
    }
  }

  @Process({ name: 'generate-webp-thumbnail', concurrency: 2 })
  async generateWepbThumbnail(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    const webpPath = asset.resizePath.replace('jpeg', 'webp');

    sharp(asset.resizePath)
      .resize(250)
      .webp()
      .toFile(webpPath, (err, info) => {
        if (!err) {
          this.assetRepository.update({ id: asset.id }, { webpPath: webpPath });
        }
      });
  }
}
