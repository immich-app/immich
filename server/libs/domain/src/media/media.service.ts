import { AssetType, TranscodePreset } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { IAssetRepository, mapAsset, WithoutProperty } from '../asset';
import { CommunicationEvent, ICommunicationRepository } from '../communication';
import { IAssetJob, IBaseJob, IJobRepository, JobName } from '../job';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { ISystemConfigRepository, SystemConfigFFmpegDto } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { IMediaRepository, VideoStreamInfo } from './media.repository';

@Injectable()
export class MediaService {
  private logger = new Logger(MediaService.name);
  private storageCore = new StorageCore();
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemConfigRepository) systemConfig: ISystemConfigRepository,
  ) {
    this.configCore = new SystemConfigCore(systemConfig);
  }

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

      const thumbnailDimension = 1440;
      if (asset.type == AssetType.IMAGE) {
        try {
          await this.mediaRepository.resize(asset.originalPath, jpegThumbnailPath, {
            size: thumbnailDimension,
            format: 'jpeg',
          });
        } catch (error) {
          this.logger.warn(
            `Failed to generate jpeg thumbnail using sharp, trying with exiftool-vendored (asset=${asset.id})`,
          );
          await this.mediaRepository.extractThumbnailFromExif(asset.originalPath, jpegThumbnailPath);
        }
      }

      if (asset.type == AssetType.VIDEO) {
        this.logger.log('Start Generating Video Thumbnail');
        await this.mediaRepository.extractVideoThumbnail(asset.originalPath, jpegThumbnailPath, thumbnailDimension);
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
      this.logger.error(`Failed to generate webp thumbnail for asset: ${asset.id}`, error.stack);
    }
  }

  async handleQueueVideoConversion(job: IBaseJob) {
    const { force } = job;

    try {
      const assets = force
        ? await this.assetRepository.getAll({ type: AssetType.VIDEO })
        : await this.assetRepository.getWithout(WithoutProperty.ENCODED_VIDEO);
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { asset } });
      }
    } catch (error: any) {
      this.logger.error('Failed to queue video conversions', error.stack);
    }
  }

  async handleVideoConversion(job: IAssetJob) {
    const { asset } = job;

    try {
      const input = asset.originalPath;
      const outputFolder = this.storageCore.getFolderLocation(StorageFolder.ENCODED_VIDEO, asset.ownerId);
      const output = join(outputFolder, `${asset.id}.mp4`);
      this.storageRepository.mkdirSync(outputFolder);

      const { streams } = await this.mediaRepository.probe(input);
      const stream = await this.getLongestStream(streams);
      if (!stream) {
        return;
      }

      const { ffmpeg: config } = await this.configCore.getConfig();

      const required = this.isTranscodeRequired(stream, config);
      if (!required) {
        return;
      }

      const options = this.getFfmpegOptions(stream, config);
      await this.mediaRepository.transcode(input, output, options);

      this.logger.log(`Converting Success ${asset.id}`);

      await this.assetRepository.save({ id: asset.id, encodedVideoPath: output });
    } catch (error: any) {
      this.logger.error(`Failed to handle video conversion for asset: ${asset.id}`, error.stack);
    }
  }

  private getLongestStream(streams: VideoStreamInfo[]): VideoStreamInfo | null {
    return streams
      .filter((stream) => stream.codecType === 'video')
      .sort((stream1, stream2) => stream2.frameCount - stream1.frameCount)[0];
  }

  private isTranscodeRequired(stream: VideoStreamInfo, ffmpegConfig: SystemConfigFFmpegDto): boolean {
    if (!stream.height || !stream.width) {
      this.logger.error('Skipping transcode, height or width undefined for video stream');
      return false;
    }

    const isTargetVideoCodec = stream.codecName === ffmpegConfig.targetVideoCodec;

    const targetResolution = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetResolution = Math.min(stream.height, stream.width) > targetResolution;

    switch (ffmpegConfig.transcode) {
      case TranscodePreset.ALL:
        return true;

      case TranscodePreset.REQUIRED:
        return !isTargetVideoCodec;

      case TranscodePreset.OPTIMAL:
        return !isTargetVideoCodec || isLargerThanTargetResolution;

      default:
        return false;
    }
  }

  private getFfmpegOptions(stream: VideoStreamInfo, ffmpeg: SystemConfigFFmpegDto) {
    // TODO: If video or audio are already the correct format, don't re-encode, copy the stream

    const options = [
      `-crf ${ffmpeg.crf}`,
      `-preset ${ffmpeg.preset}`,
      `-vcodec ${ffmpeg.targetVideoCodec}`,
      `-acodec ${ffmpeg.targetAudioCodec}`,
      // Makes a second pass moving the moov atom to the beginning of
      // the file for improved playback speed.
      `-movflags faststart`,
    ];

    const videoIsRotated = Math.abs(stream.rotation) === 90;
    const targetResolution = Number.parseInt(ffmpeg.targetResolution);

    const isVideoVertical = stream.height > stream.width || videoIsRotated;
    const scaling = isVideoVertical ? `${targetResolution}:-2` : `-2:${targetResolution}`;

    const shouldScale = Math.min(stream.height, stream.width) > targetResolution;
    if (shouldScale) {
      options.push(`-vf scale=${scaling}`);
    }

    return options;
  }
}
