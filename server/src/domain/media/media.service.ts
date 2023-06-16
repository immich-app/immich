import { AssetEntity, AssetType, TranscodePreset } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { IAssetRepository, WithoutProperty } from '../asset';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, IJobRepository, JobName, JOBS_ASSET_PAGINATION_SIZE } from '../job';
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
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemConfigRepository) systemConfig: ISystemConfigRepository,
  ) {
    this.configCore = new SystemConfigCore(systemConfig);
  }

  async handleQueueGenerateThumbnails(job: IBaseJob) {
    const { force } = job;

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.THUMBNAIL);
    });

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleGenerateJpegThumbnail({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    const resizePath = this.storageCore.getFolderLocation(StorageFolder.THUMBNAILS, asset.ownerId);
    this.storageRepository.mkdirSync(resizePath);
    const jpegThumbnailPath = join(resizePath, `${asset.id}.jpeg`);

    switch (asset.type) {
      case AssetType.IMAGE:
        await this.mediaRepository.resize(asset.originalPath, jpegThumbnailPath, {
          size: JPEG_THUMBNAIL_SIZE,
          format: 'jpeg',
        });
        break;
      case AssetType.VIDEO:
        this.logger.log('Generating video thumbnail');
        await this.mediaRepository.extractVideoThumbnail(asset.originalPath, jpegThumbnailPath, JPEG_THUMBNAIL_SIZE);
        this.logger.log(`Successfully generated video thumbnail ${asset.id}`);
        break;
    }

    await this.assetRepository.save({ id: asset.id, resizePath: jpegThumbnailPath });

    return true;
  }

  async handleGenerateWepbThumbnail({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset || !asset.resizePath) {
      return false;
    }

    const webpPath = asset.resizePath.replace('jpeg', 'webp');

    await this.mediaRepository.resize(asset.resizePath, webpPath, { size: WEBP_THUMBNAIL_SIZE, format: 'webp' });
    await this.assetRepository.save({ id: asset.id, webpPath: webpPath });

    return true;
  }

  async handleQueueVideoConversion(job: IBaseJob) {
    const { force } = job;

    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination, { type: AssetType.VIDEO })
        : this.assetRepository.getWithout(pagination, WithoutProperty.ENCODED_VIDEO);
    });

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleVideoConversion({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    const input = asset.originalPath;
    const outputFolder = this.storageCore.getFolderLocation(StorageFolder.ENCODED_VIDEO, asset.ownerId);
    const output = join(outputFolder, `${asset.id}.mp4`);
    this.storageRepository.mkdirSync(outputFolder);

    const { videoStreams, audioStreams, format } = await this.mediaRepository.probe(input);
    const mainVideoStream = this.getMainVideoStream(videoStreams);
    const mainAudioStream = this.getMainAudioStream(audioStreams);
    const containerExtension = format.formatName;
    if (!mainVideoStream || !mainAudioStream || !containerExtension) {
      return false;
    }

    const { ffmpeg: config } = await this.configCore.getConfig();

    const required = this.isTranscodeRequired(asset, mainVideoStream, mainAudioStream, containerExtension, config);
    if (!required) {
      return false;
    }

    const outputOptions = this.getFfmpegOptions(mainVideoStream, config);
    const twoPass = this.eligibleForTwoPass(config);

    this.logger.log(`Start encoding video ${asset.id} ${outputOptions}`);
    await this.mediaRepository.transcode(input, output, { outputOptions, twoPass });

    this.logger.log(`Encoding success ${asset.id}`);

    await this.assetRepository.save({ id: asset.id, encodedVideoPath: output });

    return true;
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
    const scalingEnabled = ffmpegConfig.targetResolution !== 'original';
    const targetRes = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetRes = scalingEnabled && Math.min(videoStream.height, videoStream.width) > targetRes;

    switch (ffmpegConfig.transcode) {
      case TranscodePreset.DISABLED:
        return false;

      case TranscodePreset.ALL:
        return true;

      case TranscodePreset.REQUIRED:
        return !allTargetsMatching;

      case TranscodePreset.OPTIMAL:
        return !allTargetsMatching || isLargerThanTargetRes;

      default:
        return false;
    }
  }

  private getFfmpegOptions(stream: VideoStreamInfo, ffmpeg: SystemConfigFFmpegDto) {
    const options = [
      `-vcodec ${ffmpeg.targetVideoCodec}`,
      `-acodec ${ffmpeg.targetAudioCodec}`,
      // Makes a second pass moving the moov atom to the beginning of
      // the file for improved playback speed.
      `-movflags faststart`,
    ];

    // video dimensions
    const videoIsRotated = Math.abs(stream.rotation) === 90;
    const scalingEnabled = ffmpeg.targetResolution !== 'original';
    const targetResolution = Number.parseInt(ffmpeg.targetResolution);
    const isVideoVertical = stream.height > stream.width || videoIsRotated;
    const scaling = isVideoVertical ? `${targetResolution}:-2` : `-2:${targetResolution}`;
    const shouldScale = scalingEnabled && Math.min(stream.height, stream.width) > targetResolution;

    // video codec
    const isVP9 = ffmpeg.targetVideoCodec === 'vp9';
    const isH264 = ffmpeg.targetVideoCodec === 'h264';
    const isH265 = ffmpeg.targetVideoCodec === 'hevc';

    // transcode efficiency
    const limitThreads = ffmpeg.threads > 0;
    const maxBitrateValue = Number.parseInt(ffmpeg.maxBitrate) || 0;
    const constrainMaximumBitrate = maxBitrateValue > 0;
    const bitrateUnit = ffmpeg.maxBitrate.trim().substring(maxBitrateValue.toString().length); // use inputted unit if provided

    if (shouldScale) {
      options.push(`-vf scale=${scaling}`);
    }

    if (isH264 || isH265) {
      options.push(`-preset ${ffmpeg.preset}`);
    }

    if (isVP9) {
      // vp9 doesn't have presets, but does have a similar setting -cpu-used, from 0-5, 0 being the slowest
      const presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];
      const speed = Math.min(presets.indexOf(ffmpeg.preset), 5); // values over 5 require realtime mode, which is its own can of worms since it overrides -crf and -threads
      if (speed >= 0) {
        options.push(`-cpu-used ${speed}`);
      }
      options.push('-row-mt 1'); // better multithreading
    }

    if (limitThreads) {
      options.push(`-threads ${ffmpeg.threads}`);

      // x264 and x265 handle threads differently than one might expect
      // https://x265.readthedocs.io/en/latest/cli.html#cmdoption-pools
      if (isH264 || isH265) {
        options.push(`-${isH265 ? 'x265' : 'x264'}-params "pools=none"`);
        options.push(`-${isH265 ? 'x265' : 'x264'}-params "frame-threads=${ffmpeg.threads}"`);
      }
    }

    // two-pass mode for x264/x265 uses bitrate ranges, so it requires a max bitrate from which to derive a target and min bitrate
    if (constrainMaximumBitrate && ffmpeg.twoPass) {
      const targetBitrateValue = Math.ceil(maxBitrateValue / 1.45); // recommended by https://developers.google.com/media/vp9/settings/vod
      const minBitrateValue = targetBitrateValue / 2;

      options.push(`-b:v ${targetBitrateValue}${bitrateUnit}`);
      options.push(`-minrate ${minBitrateValue}${bitrateUnit}`);
      options.push(`-maxrate ${maxBitrateValue}${bitrateUnit}`);
    } else if (constrainMaximumBitrate || isVP9) {
      // for vp9, these flags work for both one-pass and two-pass
      options.push(`-crf ${ffmpeg.crf}`);
      options.push(`${isVP9 ? '-b:v' : '-maxrate'} ${maxBitrateValue}${bitrateUnit}`);
    } else {
      options.push(`-crf ${ffmpeg.crf}`);
    }

    return options;
  }

  private eligibleForTwoPass(ffmpeg: SystemConfigFFmpegDto) {
    if (!ffmpeg.twoPass) {
      return false;
    }

    const isVP9 = ffmpeg.targetVideoCodec === 'vp9';
    const maxBitrateValue = Number.parseInt(ffmpeg.maxBitrate) || 0;
    const constrainMaximumBitrate = maxBitrateValue > 0;

    return constrainMaximumBitrate || isVP9;
  }
}
