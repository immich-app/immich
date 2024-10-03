import { Injectable } from '@nestjs/common';
import { dirname } from 'node:path';
import { StorageCore } from 'src/cores/storage.core';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import {
  AssetFileType,
  AssetPathType,
  AssetType,
  AudioCodec,
  Colorspace,
  LogLevel,
  StorageFolder,
  TranscodeHWAccel,
  TranscodePolicy,
  TranscodeTarget,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { UpsertFileOptions, WithoutProperty } from 'src/interfaces/asset.interface';
import {
  IBaseJob,
  IEntityJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobItem,
  JobName,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { AudioStreamInfo, TranscodeCommand, VideoFormat, VideoStreamInfo } from 'src/interfaces/media.interface';
import { BaseService } from 'src/services/base.service';
import { getAssetFiles } from 'src/utils/asset.util';
import { BaseConfig, ThumbnailConfig } from 'src/utils/media';
import { mimeTypes } from 'src/utils/mime-types';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class MediaService extends BaseService {
  private maliOpenCL?: boolean;
  private devices?: string[];

  async handleQueueGenerateThumbnails({ force }: IBaseJob): Promise<JobStatus> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination, {
            isVisible: true,
            withDeleted: true,
            withArchived: true,
          })
        : this.assetRepository.getWithout(pagination, WithoutProperty.THUMBNAIL);
    });

    for await (const assets of assetPagination) {
      const jobs: JobItem[] = [];

      for (const asset of assets) {
        const { previewFile, thumbnailFile } = getAssetFiles(asset.files);

        if (!previewFile || !thumbnailFile || !asset.thumbhash || force) {
          jobs.push({ name: JobName.GENERATE_THUMBNAILS, data: { id: asset.id } });
          continue;
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

          await this.personRepository.update({ id: person.id, faceAssetId: face.id });
        }

        jobs.push({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id: person.id } });
      }
    }

    await this.jobRepository.queueAll(jobs);

    return JobStatus.SUCCESS;
  }

  async handleQueueMigration(): Promise<JobStatus> {
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

    return JobStatus.SUCCESS;
  }

  async handleAssetMigration({ id }: IEntityJob): Promise<JobStatus> {
    const { image } = await this.getConfig({ withCache: true });
    const [asset] = await this.assetRepository.getByIds([id], { files: true });
    if (!asset) {
      return JobStatus.FAILED;
    }

    await this.storageCore.moveAssetImage(asset, AssetPathType.PREVIEW, image.preview.format);
    await this.storageCore.moveAssetImage(asset, AssetPathType.THUMBNAIL, image.thumbnail.format);
    await this.storageCore.moveAssetVideo(asset);

    return JobStatus.SUCCESS;
  }

  async handleGenerateThumbnails({ id }: IEntityJob): Promise<JobStatus> {
    const asset = await this.assetRepository.getById(id, { exifInfo: true, files: true });
    if (!asset) {
      this.logger.warn(`Thumbnail generation failed for asset ${id}: not found`);
      return JobStatus.FAILED;
    }

    if (!asset.isVisible) {
      this.logger.verbose(`Thumbnail generation skipped for asset ${id}: not visible`);
      return JobStatus.SKIPPED;
    }

    let generated: { previewPath: string; thumbnailPath: string; thumbhash: Buffer };
    if (asset.type === AssetType.IMAGE) {
      generated = await this.generateImageThumbnails(asset);
    } else if (asset.type === AssetType.VIDEO) {
      generated = await this.generateVideoThumbnails(asset);
    } else {
      this.logger.warn(`Skipping thumbnail generation for asset ${id}: ${asset.type} is not an image or video`);
      return JobStatus.SKIPPED;
    }

    const { previewFile, thumbnailFile } = getAssetFiles(asset.files);
    const toUpsert: UpsertFileOptions[] = [];
    if (previewFile?.path !== generated.previewPath) {
      toUpsert.push({ assetId: asset.id, path: generated.previewPath, type: AssetFileType.PREVIEW });
    }

    if (thumbnailFile?.path !== generated.thumbnailPath) {
      toUpsert.push({ assetId: asset.id, path: generated.thumbnailPath, type: AssetFileType.THUMBNAIL });
    }

    if (toUpsert.length > 0) {
      await this.assetRepository.upsertFiles(toUpsert);
    }

    const pathsToDelete = [];
    if (previewFile && previewFile.path !== generated.previewPath) {
      this.logger.debug(`Deleting old preview for asset ${asset.id}`);
      pathsToDelete.push(previewFile.path);
    }

    if (thumbnailFile && thumbnailFile.path !== generated.thumbnailPath) {
      this.logger.debug(`Deleting old thumbnail for asset ${asset.id}`);
      pathsToDelete.push(thumbnailFile.path);
    }

    if (pathsToDelete.length > 0) {
      await Promise.all(pathsToDelete.map((path) => this.storageRepository.unlink(path)));
    }

    if (asset.thumbhash != generated.thumbhash) {
      await this.assetRepository.update({ id: asset.id, thumbhash: generated.thumbhash });
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, previewAt: new Date(), thumbnailAt: new Date() });

    return JobStatus.SUCCESS;
  }

  private async generateImageThumbnails(asset: AssetEntity) {
    const { image } = await this.getConfig({ withCache: true });
    const previewPath = StorageCore.getImagePath(asset, AssetPathType.PREVIEW, image.preview.format);
    const thumbnailPath = StorageCore.getImagePath(asset, AssetPathType.THUMBNAIL, image.thumbnail.format);
    this.storageCore.ensureFolders(previewPath);

    const shouldExtract = image.extractEmbedded && mimeTypes.isRaw(asset.originalPath);
    const extractedPath = StorageCore.getTempPathInDir(dirname(previewPath));
    const didExtract = shouldExtract && (await this.mediaRepository.extract(asset.originalPath, extractedPath));

    try {
      const useExtracted = didExtract && (await this.shouldUseExtractedImage(extractedPath, image.preview.size));
      const inputPath = useExtracted ? extractedPath : asset.originalPath;
      const colorspace = this.isSRGB(asset) ? Colorspace.SRGB : image.colorspace;
      const processInvalidImages = process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true';

      const decodeOptions = { colorspace, processInvalidImages, size: image.preview.size };
      const { data, info } = await this.mediaRepository.decodeImage(inputPath, decodeOptions);

      const options = { colorspace, processInvalidImages, raw: info };
      const outputs = await Promise.all([
        this.mediaRepository.generateThumbnail(data, { ...image.thumbnail, ...options }, thumbnailPath),
        this.mediaRepository.generateThumbnail(data, { ...image.preview, ...options }, previewPath),
        this.mediaRepository.generateThumbhash(data, options),
      ]);

      return { previewPath, thumbnailPath, thumbhash: outputs[2] };
    } finally {
      if (didExtract) {
        await this.storageRepository.unlink(extractedPath);
      }
    }
  }

  private async generateVideoThumbnails(asset: AssetEntity) {
    const { image, ffmpeg } = await this.getConfig({ withCache: true });
    const previewPath = StorageCore.getImagePath(asset, AssetPathType.PREVIEW, image.preview.format);
    const thumbnailPath = StorageCore.getImagePath(asset, AssetPathType.THUMBNAIL, image.thumbnail.format);
    this.storageCore.ensureFolders(previewPath);

    const { audioStreams, videoStreams } = await this.mediaRepository.probe(asset.originalPath);
    const mainVideoStream = this.getMainStream(videoStreams);
    if (!mainVideoStream) {
      throw new Error(`No video streams found for asset ${asset.id}`);
    }
    const mainAudioStream = this.getMainStream(audioStreams);

    const previewConfig = ThumbnailConfig.create({ ...ffmpeg, targetResolution: image.preview.size.toString() });
    const thumbnailConfig = ThumbnailConfig.create({ ...ffmpeg, targetResolution: image.thumbnail.size.toString() });

    const previewOptions = previewConfig.getCommand(TranscodeTarget.VIDEO, mainVideoStream, mainAudioStream);
    const thumbnailOptions = thumbnailConfig.getCommand(TranscodeTarget.VIDEO, mainVideoStream, mainAudioStream);
    await this.mediaRepository.transcode(asset.originalPath, previewPath, previewOptions);
    await this.mediaRepository.transcode(asset.originalPath, thumbnailPath, thumbnailOptions);

    const thumbhash = await this.mediaRepository.generateThumbhash(previewPath, {
      colorspace: image.colorspace,
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
    });

    return { previewPath, thumbnailPath, thumbhash };
  }

  async handleQueueVideoConversion(job: IBaseJob): Promise<JobStatus> {
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

    return JobStatus.SUCCESS;
  }

  async handleVideoConversion({ id }: IEntityJob): Promise<JobStatus> {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset || asset.type !== AssetType.VIDEO) {
      return JobStatus.FAILED;
    }

    const input = asset.originalPath;
    const output = StorageCore.getEncodedVideoPath(asset);
    this.storageCore.ensureFolders(output);

    const { videoStreams, audioStreams, format } = await this.mediaRepository.probe(input, {
      countFrames: this.logger.isLevelEnabled(LogLevel.DEBUG), // makes frame count more reliable for progress logs
    });
    const mainVideoStream = this.getMainStream(videoStreams);
    const mainAudioStream = this.getMainStream(audioStreams);
    if (!mainVideoStream || !format.formatName) {
      return JobStatus.FAILED;
    }

    if (!mainVideoStream.height || !mainVideoStream.width) {
      this.logger.warn(`Skipped transcoding for asset ${asset.id}: no video streams found`);
      return JobStatus.FAILED;
    }

    const { ffmpeg } = await this.getConfig({ withCache: true });
    const target = this.getTranscodeTarget(ffmpeg, mainVideoStream, mainAudioStream);
    if (target === TranscodeTarget.NONE && !this.isRemuxRequired(ffmpeg, format)) {
      if (asset.encodedVideoPath) {
        this.logger.log(`Transcoded video exists for asset ${asset.id}, but is no longer required. Deleting...`);
        await this.jobRepository.queue({ name: JobName.DELETE_FILES, data: { files: [asset.encodedVideoPath] } });
        await this.assetRepository.update({ id: asset.id, encodedVideoPath: null });
      } else {
        this.logger.verbose(`Asset ${asset.id} does not require transcoding based on current policy, skipping`);
      }

      return JobStatus.SKIPPED;
    }

    let command: TranscodeCommand;
    try {
      const config = BaseConfig.create(ffmpeg, await this.getDevices(), await this.hasMaliOpenCL());
      command = config.getCommand(target, mainVideoStream, mainAudioStream);
    } catch (error) {
      this.logger.error(`An error occurred while configuring transcoding options: ${error}`);
      return JobStatus.FAILED;
    }

    if (ffmpeg.accel === TranscodeHWAccel.DISABLED) {
      this.logger.log(`Encoding video ${asset.id} without hardware acceleration`);
    } else {
      this.logger.log(`Encoding video ${asset.id} with ${ffmpeg.accel.toUpperCase()} acceleration`);
    }

    try {
      await this.mediaRepository.transcode(input, output, command);
    } catch (error: any) {
      this.logger.error(`Error occurred during transcoding: ${error.message}`);
      if (ffmpeg.accel === TranscodeHWAccel.DISABLED) {
        return JobStatus.FAILED;
      }
      this.logger.error(`Retrying with ${ffmpeg.accel.toUpperCase()} acceleration disabled`);
      const config = BaseConfig.create({ ...ffmpeg, accel: TranscodeHWAccel.DISABLED });
      command = config.getCommand(target, mainVideoStream, mainAudioStream);
      await this.mediaRepository.transcode(input, output, command);
    }

    this.logger.log(`Successfully encoded ${asset.id}`);

    await this.assetRepository.update({ id: asset.id, encodedVideoPath: output });

    return JobStatus.SUCCESS;
  }

  private getMainStream<T extends VideoStreamInfo | AudioStreamInfo>(streams: T[]): T {
    return streams.sort((stream1, stream2) => stream2.frameCount - stream1.frameCount)[0];
  }

  private getTranscodeTarget(
    config: SystemConfigFFmpegDto,
    videoStream?: VideoStreamInfo,
    audioStream?: AudioStreamInfo,
  ): TranscodeTarget {
    if (!videoStream && !audioStream) {
      return TranscodeTarget.NONE;
    }

    const isAudioTranscodeRequired = this.isAudioTranscodeRequired(config, audioStream);
    const isVideoTranscodeRequired = this.isVideoTranscodeRequired(config, videoStream);

    if (isAudioTranscodeRequired && isVideoTranscodeRequired) {
      return TranscodeTarget.ALL;
    }

    if (isAudioTranscodeRequired) {
      return TranscodeTarget.AUDIO;
    }

    if (isVideoTranscodeRequired) {
      return TranscodeTarget.VIDEO;
    }

    return TranscodeTarget.NONE;
  }

  private isAudioTranscodeRequired(ffmpegConfig: SystemConfigFFmpegDto, stream?: AudioStreamInfo): boolean {
    if (!stream) {
      return false;
    }

    switch (ffmpegConfig.transcode) {
      case TranscodePolicy.DISABLED: {
        return false;
      }
      case TranscodePolicy.ALL: {
        return true;
      }
      case TranscodePolicy.REQUIRED:
      case TranscodePolicy.OPTIMAL:
      case TranscodePolicy.BITRATE: {
        return !ffmpegConfig.acceptedAudioCodecs.includes(stream.codecName as AudioCodec);
      }
      default: {
        throw new Error(`Unsupported transcode policy: ${ffmpegConfig.transcode}`);
      }
    }
  }

  private isVideoTranscodeRequired(ffmpegConfig: SystemConfigFFmpegDto, stream?: VideoStreamInfo): boolean {
    if (!stream) {
      return false;
    }

    const scalingEnabled = ffmpegConfig.targetResolution !== 'original';
    const targetRes = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetRes = scalingEnabled && Math.min(stream.height, stream.width) > targetRes;
    const isLargerThanTargetBitrate = stream.bitrate > this.parseBitrateToBps(ffmpegConfig.maxBitrate);

    const isTargetVideoCodec = ffmpegConfig.acceptedVideoCodecs.includes(stream.codecName as VideoCodec);
    const isRequired = !isTargetVideoCodec || stream.isHDR;

    switch (ffmpegConfig.transcode) {
      case TranscodePolicy.DISABLED: {
        return false;
      }
      case TranscodePolicy.ALL: {
        return true;
      }
      case TranscodePolicy.REQUIRED: {
        return isRequired;
      }
      case TranscodePolicy.OPTIMAL: {
        return isRequired || isLargerThanTargetRes;
      }
      case TranscodePolicy.BITRATE: {
        return isRequired || isLargerThanTargetBitrate;
      }
      default: {
        throw new Error(`Unsupported transcode policy: ${ffmpegConfig.transcode}`);
      }
    }
  }

  private isRemuxRequired(ffmpegConfig: SystemConfigFFmpegDto, { formatName, formatLongName }: VideoFormat): boolean {
    if (ffmpegConfig.transcode === TranscodePolicy.DISABLED) {
      return false;
    }

    const name = formatLongName === 'QuickTime / MOV' ? VideoContainer.MOV : (formatName as VideoContainer);
    return name !== VideoContainer.MP4 && !ffmpegConfig.acceptedContainers.includes(name);
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

  private parseBitrateToBps(bitrateString: string) {
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

  private async shouldUseExtractedImage(extractedPath: string, targetSize: number) {
    const { width, height } = await this.mediaRepository.getImageDimensions(extractedPath);
    const extractedSize = Math.min(width, height);

    return extractedSize >= targetSize;
  }

  private async getDevices() {
    if (!this.devices) {
      try {
        this.devices = await this.storageRepository.readdir('/dev/dri');
      } catch {
        this.logger.debug('No devices found in /dev/dri.');
        this.devices = [];
      }
    }

    return this.devices;
  }

  private async hasMaliOpenCL() {
    if (this.maliOpenCL === undefined) {
      try {
        const maliIcdStat = await this.storageRepository.stat('/etc/OpenCL/vendors/mali.icd');
        const maliDeviceStat = await this.storageRepository.stat('/dev/mali0');
        this.maliOpenCL = maliIcdStat.isFile() && maliDeviceStat.isCharacterDevice();
      } catch {
        this.logger.debug('OpenCL not available for transcoding, so RKMPP acceleration will use CPU decoding');
        this.maliOpenCL = false;
      }
    }

    return this.maliOpenCL;
  }
}
