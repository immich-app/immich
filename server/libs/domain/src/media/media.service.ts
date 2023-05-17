import { AssetEntity, AssetType, TranscodePreset } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { IAssetRepository, mapAsset, WithoutProperty } from '../asset';
import { CommunicationEvent, ICommunicationRepository } from '../communication';
import { IAssetJob, IBaseJob, IJobRepository, JobName } from '../job';
import { IStorageRepository, StorageCore, StorageFolder } from '../storage';
import { ISystemConfigRepository, SystemConfigFFmpegDto } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import { JPEG_THUMBNAIL_SIZE, WEBP_THUMBNAIL_SIZE } from './media.constant';
import { AudioStreamInfo, IMediaRepository, VideoStreamInfo } from './media.repository';

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
    const [asset] = await this.assetRepository.getByIds([data.asset.id]);

    if (!asset) {
      this.logger.warn(
        `Asset not found: ${data.asset.id} - Original Path: ${data.asset.originalPath} - Resize Path: ${data.asset.resizePath}`,
      );
      return;
    }

    try {
      const resizePath = this.storageCore.getFolderLocation(StorageFolder.THUMBNAILS, asset.ownerId);
      this.storageRepository.mkdirSync(resizePath);
      const jpegThumbnailPath = join(resizePath, `${asset.id}.jpeg`);

      if (asset.type == AssetType.IMAGE) {
        try {
          await this.mediaRepository.resize(asset.originalPath, jpegThumbnailPath, {
            size: JPEG_THUMBNAIL_SIZE,
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
        await this.mediaRepository.extractVideoThumbnail(asset.originalPath, jpegThumbnailPath, JPEG_THUMBNAIL_SIZE);
        this.logger.log(`Generating Video Thumbnail Success ${asset.id}`);
      }

      await this.assetRepository.save({ id: asset.id, resizePath: jpegThumbnailPath });

      asset.resizePath = jpegThumbnailPath;

      await this.jobRepository.queue({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: { asset } });
      await this.jobRepository.queue({ name: JobName.CLASSIFY_IMAGE, data: { asset } });
      await this.jobRepository.queue({ name: JobName.DETECT_OBJECTS, data: { asset } });
      await this.jobRepository.queue({ name: JobName.ENCODE_CLIP, data: { asset } });
      await this.jobRepository.queue({ name: JobName.RECOGNIZE_FACES, data: { asset } });

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
      await this.mediaRepository.resize(asset.resizePath, webpPath, { size: WEBP_THUMBNAIL_SIZE, format: 'webp' });
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
    const [asset] = await this.assetRepository.getByIds([job.asset.id]);

    if (!asset) {
      this.logger.warn(`Asset not found: ${job.asset.id} - Original Path: ${job.asset.originalPath}`);
      return;
    }

    try {
      const input = asset.originalPath;
      const outputFolder = this.storageCore.getFolderLocation(StorageFolder.ENCODED_VIDEO, asset.ownerId);
      const output = join(outputFolder, `${asset.id}.mp4`);
      this.storageRepository.mkdirSync(outputFolder);

      const { videoStreams, audioStreams, format } = await this.mediaRepository.probe(input);
      const mainVideoStream = this.getMainVideoStream(videoStreams);
      const mainAudioStream = this.getMainAudioStream(audioStreams);
      const containerExtension = format.formatName;
      if (!mainVideoStream || !mainAudioStream || !containerExtension) {
        return;
      }

      const { ffmpeg: config } = await this.configCore.getConfig();

      const required = this.isTranscodeRequired(asset, mainVideoStream, mainAudioStream, containerExtension, config);
      if (!required) {
        return;
      }

      const options = this.getFfmpegOptions(mainVideoStream, config);

      this.logger.log(`Start encoding video ${asset.id} ${options}`);
      await this.mediaRepository.transcode(input, output, options);

      this.logger.log(`Encoding success ${asset.id}`);

      await this.assetRepository.save({ id: asset.id, encodedVideoPath: output });
    } catch (error: any) {
      this.logger.error(`Failed to handle video conversion for asset: ${asset.id}`, error.stack);
    }
  }

  private getMainVideoStream(streams: VideoStreamInfo[]): VideoStreamInfo | null {
    return streams.sort((stream1, stream2) => stream2.frameCount - stream1.frameCount)[0];
  }

  private getMainAudioStream(streams: AudioStreamInfo[]): AudioStreamInfo | null {
    return streams[0];
  }

  private isTranscodeRequired(
    asset: AssetEntity,
    videoStream: VideoStreamInfo,
    audioStream: AudioStreamInfo,
    containerExtension: string,
    ffmpegConfig: SystemConfigFFmpegDto,
  ): boolean {
    if (!videoStream.height || !videoStream.width) {
      this.logger.error('Skipping transcode, height or width undefined for video stream');
      return false;
    }

    const isTargetVideoCodec = videoStream.codecName === ffmpegConfig.targetVideoCodec;
    const isTargetAudioCodec = audioStream.codecName === ffmpegConfig.targetAudioCodec;
    const isTargetContainer = ['mov,mp4,m4a,3gp,3g2,mj2', 'mp4', 'mov'].includes(containerExtension);

    this.logger.verbose(
      `${asset.id}: AudioCodecName ${audioStream.codecName}, AudioStreamCodecType ${audioStream.codecType}, containerExtension ${containerExtension}`,
    );

    const allTargetsMatching = isTargetVideoCodec && isTargetAudioCodec && isTargetContainer;

    const targetResolution = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetResolution = Math.min(videoStream.height, videoStream.width) > targetResolution;

    switch (ffmpegConfig.transcode) {
      case TranscodePreset.DISABLED:
        return false;

      case TranscodePreset.ALL:
        return true;

      case TranscodePreset.REQUIRED:
        return !allTargetsMatching;

      case TranscodePreset.OPTIMAL:
        return !allTargetsMatching || isLargerThanTargetResolution;

      default:
        return false;
    }
  }

  private getFfmpegOptions(stream: VideoStreamInfo, ffmpeg: SystemConfigFFmpegDto) {
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
