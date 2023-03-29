import { AssetType } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { IAssetRepository, mapAsset, WithoutProperty } from '../asset';
import { CommunicationEvent, ICommunicationRepository } from '../communication';
import { IAssetJob, IBaseJob, IJobRepository, JobName } from '../job';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { IMediaRepository } from './media.repository';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);
  private storageCore = new StorageCore();

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
  ) {}

  async handleQueueGenerateThumbnails(job: IBaseJob): Promise<void> {
    try {
      const { force } = job;

      const assets = force
        ? await this.assetRepository.getAll()
        : await this.assetRepository.getWithout(WithoutProperty.THUMBNAIL);

      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { asset } });
      }
    } catch (error: any) {
      this.logger.error('Failed to queue generate thumbnail jobs', error.stack);
    }
  }

  async handleGenerateJpegThumbnail(data: IAssetJob): Promise<void> {
    const { asset } = data;

    try {
      const resizePath = this.storageCore.getFolderLocation(StorageFolder.THUMBNAILS, asset.ownerId);
      this.storageRepository.mkdirSync(resizePath);
      const jpegThumbnailPath = join(resizePath, `${asset.id}.jpeg`);

      if (asset.type == AssetType.IMAGE) {
        try {
          await this.mediaRepository.resize(asset.originalPath, jpegThumbnailPath, { size: 1440, format: 'jpeg' });
        } catch (error) {
          this.logger.warn(
            `Failed to generate jpeg thumbnail using sharp, trying with exiftool-vendored (asset=${asset.id})`,
          );
          await this.mediaRepository.extractThumbnailFromExif(asset.originalPath, jpegThumbnailPath);
        }
      }

      if (asset.type == AssetType.VIDEO) {
        this.logger.log('Start Generating Video Thumbnail');
        await this.mediaRepository.extractVideoThumbnail(asset.originalPath, jpegThumbnailPath);
        this.logger.log(`Generating Video Thumbnail Success ${asset.id}`);
      }

      await this.assetRepository.save({ id: asset.id, resizePath: jpegThumbnailPath });

      asset.resizePath = jpegThumbnailPath;

      await this.jobRepository.queue({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: { asset } });
      await this.jobRepository.queue({ name: JobName.CLASSIFY_IMAGE, data: { asset } });
      await this.jobRepository.queue({ name: JobName.DETECT_OBJECTS, data: { asset } });
      await this.jobRepository.queue({ name: JobName.ENCODE_CLIP, data: { asset } });

      this.communicationRepository.send(CommunicationEvent.UPLOAD_SUCCESS, asset.ownerId, mapAsset(asset));
    } catch (error: any) {
      this.logger.error(`Failed to generate thumbnail for asset: ${asset.id}/${asset.type}`, error.stack);
    }
  }

  async handleGenerateWepbThumbnail(data: IAssetJob): Promise<void> {
    const { asset } = data;

    if (!asset.resizePath) {
      return;
    }

    const webpPath = asset.resizePath.replace('jpeg', 'webp');

    try {
      await this.mediaRepository.resize(asset.resizePath, webpPath, { size: 250, format: 'webp' });
      await this.assetRepository.save({ id: asset.id, webpPath: webpPath });
    } catch (error: any) {
      this.logger.error('Failed to generate webp thumbnail for asset: ' + asset.id, error.stack);
    }
  }
}
