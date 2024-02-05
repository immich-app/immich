import {
  AssetEntity,
  AssetPathType,
  AssetType,
  AudioCodec,
  Colorspace,
  TranscodeHWAccel,
  TranscodePolicy,
  VideoCodec,
} from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable, UnsupportedMediaTypeException } from '@nestjs/common';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, JOBS_ASSET_PAGINATION_SIZE, JobName, QueueName } from '../job';
import {
  AudioStreamInfo,
  IAssetRepository,
  ICryptoRepository,
  IJobRepository,
  IMediaRepository,
  IMoveRepository,
  IPersonRepository,
  IStorageRepository,
  ISystemConfigRepository,
  JobItem,
  VideoCodecHWConfig,
  VideoStreamInfo,
  WithoutProperty,
} from '../repositories';
import { StorageCore, StorageFolder } from '../storage';
import { SystemConfigFFmpegDto } from '../system-config';
import { SystemConfigCore } from '../system-config/system-config.core';
import {
  H264Config,
  HEVCConfig,
  NVENCConfig,
  QSVConfig,
  RKMPPConfig,
  ThumbnailConfig,
  VAAPIConfig,
  VP9Config,
} from './media.util';

@Injectable()
export class MediaService {
  private logger = new ImmichLogger(MediaService.name);
  private configCore: SystemConfigCore;
  private storageCore: StorageCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
  ) {
    this.configCore = SystemConfigCore.create(configRepository);
    this.storageCore = StorageCore.create(
      assetRepository,
      moveRepository,
      personRepository,
      cryptoRepository,
      configRepository,
      storageRepository,
    );
  }

  async handleQueueGenerateThumbnails({ force }: IBaseJob) {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.THUMBNAIL);
    });

    for await (const assets of assetPagination) {
      const jobs: JobItem[] = [];

      for (const asset of assets) {
        if (!asset.resizePath || force) {
          jobs.push({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: asset.id } });
          continue;
        }
        if (!asset.webpPath) {
          jobs.push({ name: JobName.GENERATE_WEBP_THUMBNAIL, data: { id: asset.id } });
        }
        if (!asset.thumbhash) {
          jobs.push({ name: JobName.GENERATE_THUMBHASH_THUMBNAIL, data: { id: asset.id } });
        }
      }

      await this.jobRepository.queueAll(jobs);
    }

    const jobs: JobItem[] = [];
    const personPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.personRepository.getAll(pagination, { where: force ? undefined : { thumbnailPath: '' } }),
    );

    for await (const people of personPagination) {
      for (const person of people) {
        if (!person.faceAssetId) {
          const face = await this.personRepository.getRandomFace(person.id);
          if (!face) {
            continue;
          }

          await this.personRepository.update({ id: person.id, faceAssetId: face.assetId });
        }

        jobs.push({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: person.id } });
      }
    }

    await this.jobRepository.queueAll(jobs);

    return true;
  }

  async handleQueueMigration() {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination),
    );

    const { active, waiting } = await this.jobRepository.getJobCounts(QueueName.MIGRATION);
    if (active === 1 && waiting === 0) {
      await this.storageCore.removeEmptyDirs(StorageFolder.THUMBNAILS);
      await this.storageCore.removeEmptyDirs(StorageFolder.ENCODED_VIDEO);
    }

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.MIGRATE_ASSET, data: { id: asset.id } })),
      );
    }

    const personPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.personRepository.getAll(pagination),
    );

    for await (const people of personPagination) {
      await this.jobRepository.queueAll(
        people.map((person) => ({ name: JobName.MIGRATE_PERSON, data: { id: person.id } })),
      );
    }

    return true;
  }

  async handleAssetMigration({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    await this.storageCore.moveAssetFile(asset, AssetPathType.JPEG_THUMBNAIL);
    await this.storageCore.moveAssetFile(asset, AssetPathType.WEBP_THUMBNAIL);
    await this.storageCore.moveAssetFile(asset, AssetPathType.ENCODED_VIDEO);

    return true;
  }

  async handleGenerateJpegThumbnail({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    const resizePath = await this.generateThumbnail(asset, 'jpeg');
    await this.assetRepository.save({ id: asset.id, resizePath });
    return true;
  }

  private async generateThumbnail(asset: AssetEntity, format: 'jpeg' | 'webp') {
    const { thumbnail, ffmpeg } = await this.configCore.getConfig();
    const size = format === 'jpeg' ? thumbnail.jpegSize : thumbnail.webpSize;
    const path =
      format === 'jpeg' ? StorageCore.getLargeThumbnailPath(asset) : StorageCore.getSmallThumbnailPath(asset);
    this.storageCore.ensureFolders(path);

    switch (asset.type) {
      case AssetType.IMAGE: {
        const colorspace = this.isSRGB(asset) ? Colorspace.SRGB : thumbnail.colorspace;
        const thumbnailOptions = { format, size, colorspace, quality: thumbnail.quality };
        await this.mediaRepository.resize(asset.originalPath, path, thumbnailOptions);
        break;
      }

      case AssetType.VIDEO: {
        const { audioStreams, videoStreams } = await this.mediaRepository.probe(asset.originalPath);
        const mainVideoStream = this.getMainStream(videoStreams);
        if (!mainVideoStream) {
          this.logger.warn(`Skipped thumbnail generation for asset ${asset.id}: no video streams found`);
          return;
        }
        const mainAudioStream = this.getMainStream(audioStreams);
        const config = { ...ffmpeg, targetResolution: size.toString() };
        const options = new ThumbnailConfig(config).getOptions(mainVideoStream, mainAudioStream);
        await this.mediaRepository.transcode(asset.originalPath, path, options);
        break;
      }

      default: {
        throw new UnsupportedMediaTypeException(`Unsupported asset type for thumbnail generation: ${asset.type}`);
      }
    }
    this.logger.log(
      `Successfully generated ${format.toUpperCase()} ${asset.type.toLowerCase()} thumbnail for asset ${asset.id}`,
    );
    return path;
  }

  async handleGenerateWebpThumbnail({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    const webpPath = await this.generateThumbnail(asset, 'webp');
    await this.assetRepository.save({ id: asset.id, webpPath });
    return true;
  }

  async handleGenerateThumbhashThumbnail({ id }: IEntityJob): Promise<boolean> {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset?.resizePath) {
      return false;
    }

    const thumbhash = await this.mediaRepository.generateThumbhash(asset.resizePath);
    await this.assetRepository.save({ id: asset.id, thumbhash });

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
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.VIDEO_CONVERSION, data: { id: asset.id } })),
      );
    }

    return true;
  }

  async handleVideoConversion({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset || asset.type !== AssetType.VIDEO) {
      return false;
    }

    const input = asset.originalPath;
    const output = StorageCore.getEncodedVideoPath(asset);
    this.storageCore.ensureFolders(output);

    const { videoStreams, audioStreams, format } = await this.mediaRepository.probe(input);
    const mainVideoStream = this.getMainStream(videoStreams);
    const mainAudioStream = this.getMainStream(audioStreams);
    const containerExtension = format.formatName;
    const bitrate = format.bitrate;
    if (!mainVideoStream || !containerExtension) {
      return false;
    }

    if (!mainVideoStream.height || !mainVideoStream.width) {
      this.logger.warn(`Skipped transcoding for asset ${asset.id}: no video streams found`);
      return false;
    }

    const { ffmpeg: config } = await this.configCore.getConfig();

    const required = this.isTranscodeRequired(
      asset,
      mainVideoStream,
      mainAudioStream,
      containerExtension,
      config,
      bitrate,
    );
    if (!required) {
      if (asset.encodedVideoPath) {
        this.logger.log(`Transcoded video exists for asset ${asset.id}, but is no longer required. Deleting...`);
        await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [asset.encodedVideoPath] } });
        await this.assetRepository.save({ id: asset.id, encodedVideoPath: null });
      }

      return true;
    }

    let transcodeOptions;
    try {
      transcodeOptions = await this.getCodecConfig(config).then((c) => c.getOptions(mainVideoStream, mainAudioStream));
    } catch (error) {
      this.logger.error(`An error occurred while configuring transcoding options: ${error}`);
      return false;
    }

    this.logger.log(`Start encoding video ${asset.id} ${JSON.stringify(transcodeOptions)}`);
    try {
      await this.mediaRepository.transcode(input, output, transcodeOptions);
    } catch (error) {
      this.logger.error(error);
      if (config.accel !== TranscodeHWAccel.DISABLED) {
        this.logger.error(
          `Error occurred during transcoding. Retrying with ${config.accel.toUpperCase()} acceleration disabled.`,
        );
      }
      config.accel = TranscodeHWAccel.DISABLED;
      transcodeOptions = await this.getCodecConfig(config).then((c) => c.getOptions(mainVideoStream, mainAudioStream));
      await this.mediaRepository.transcode(input, output, transcodeOptions);
    }

    this.logger.log(`Encoding success ${asset.id}`);

    await this.assetRepository.save({ id: asset.id, encodedVideoPath: output });

    return true;
  }

  private getMainStream<T extends VideoStreamInfo | AudioStreamInfo>(streams: T[]): T {
    return streams.sort((stream1, stream2) => stream2.frameCount - stream1.frameCount)[0];
  }

  private isTranscodeRequired(
    asset: AssetEntity,
    videoStream: VideoStreamInfo,
    audioStream: AudioStreamInfo | null,
    containerExtension: string,
    ffmpegConfig: SystemConfigFFmpegDto,
    bitrate: number,
  ): boolean {
    const isTargetVideoCodec = ffmpegConfig.acceptedVideoCodecs.includes(videoStream.codecName as VideoCodec);
    const isTargetContainer = ['mov,mp4,m4a,3gp,3g2,mj2', 'mp4', 'mov'].includes(containerExtension);
    const isTargetAudioCodec =
      audioStream == null || ffmpegConfig.acceptedAudioCodecs.includes(audioStream.codecName as AudioCodec);

    this.logger.verbose(
      `${asset.id}: AudioCodecName ${audioStream?.codecName ?? 'None'}, AudioStreamCodecType ${
        audioStream?.codecType ?? 'None'
      }, containerExtension ${containerExtension}`,
    );

    const allTargetsMatching = isTargetVideoCodec && isTargetAudioCodec && isTargetContainer;
    const scalingEnabled = ffmpegConfig.targetResolution !== 'original';
    const targetRes = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetRes = scalingEnabled && Math.min(videoStream.height, videoStream.width) > targetRes;
    const isLargerThanTargetBitrate = bitrate > this.parseBitrateToBps(ffmpegConfig.maxBitrate);

    switch (ffmpegConfig.transcode) {
      case TranscodePolicy.DISABLED: {
        return false;
      }

      case TranscodePolicy.ALL: {
        return true;
      }

      case TranscodePolicy.REQUIRED: {
        return !allTargetsMatching || videoStream.isHDR;
      }

      case TranscodePolicy.OPTIMAL: {
        return !allTargetsMatching || isLargerThanTargetRes || videoStream.isHDR;
      }

      case TranscodePolicy.BITRATE: {
        return !allTargetsMatching || isLargerThanTargetBitrate || videoStream.isHDR;
      }

      default: {
        return false;
      }
    }
  }

  async getCodecConfig(config: SystemConfigFFmpegDto) {
    if (config.accel === TranscodeHWAccel.DISABLED) {
      return this.getSWCodecConfig(config);
    }
    return this.getHWCodecConfig(config);
  }

  private getSWCodecConfig(config: SystemConfigFFmpegDto) {
    switch (config.targetVideoCodec) {
      case VideoCodec.H264: {
        return new H264Config(config);
      }
      case VideoCodec.HEVC: {
        return new HEVCConfig(config);
      }
      case VideoCodec.VP9: {
        return new VP9Config(config);
      }
      default: {
        throw new UnsupportedMediaTypeException(`Codec '${config.targetVideoCodec}' is unsupported`);
      }
    }
  }

  private async getHWCodecConfig(config: SystemConfigFFmpegDto) {
    let handler: VideoCodecHWConfig;
    let devices: string[];
    switch (config.accel) {
      case TranscodeHWAccel.NVENC: {
        handler = new NVENCConfig(config);
        break;
      }
      case TranscodeHWAccel.QSV: {
        devices = await this.storageRepository.readdir('/dev/dri');
        handler = new QSVConfig(config, devices);
        break;
      }
      case TranscodeHWAccel.VAAPI: {
        devices = await this.storageRepository.readdir('/dev/dri');
        handler = new VAAPIConfig(config, devices);
        break;
      }
      case TranscodeHWAccel.RKMPP: {
        devices = await this.storageRepository.readdir('/dev/dri');
        handler = new RKMPPConfig(config, devices);
        break;
      }
      default: {
        throw new UnsupportedMediaTypeException(`${config.accel.toUpperCase()} acceleration is unsupported`);
      }
    }
    if (!handler.getSupportedCodecs().includes(config.targetVideoCodec)) {
      throw new UnsupportedMediaTypeException(
        `${config.accel.toUpperCase()} acceleration does not support codec '${config.targetVideoCodec.toUpperCase()}'. Supported codecs: ${handler.getSupportedCodecs()}`,
      );
    }

    return handler;
  }

  isSRGB(asset: AssetEntity): boolean {
    const { colorspace, profileDescription, bitsPerSample } = asset.exifInfo ?? {};
    if (colorspace || profileDescription) {
      return [colorspace, profileDescription].some((s) => s?.toLowerCase().includes('srgb'));
    } else if (bitsPerSample) {
      // assume sRGB for 8-bit images with no color profile or colorspace metadata
      return bitsPerSample === 8;
    } else {
      // assume sRGB for images with no relevant metadata
      return true;
    }
  }

  parseBitrateToBps(bitrateString: string) {
    const bitrateValue = Number.parseInt(bitrateString);

    if (Number.isNaN(bitrateValue)) {
      return 0;
    }

    if (bitrateString.toLowerCase().endsWith('k')) {
      return bitrateValue * 1000; // Kilobits per second to bits per second
    } else if (bitrateString.toLowerCase().endsWith('m')) {
      return bitrateValue * 1_000_000; // Megabits per second to bits per second
    } else {
      return bitrateValue;
    }
  }
}
