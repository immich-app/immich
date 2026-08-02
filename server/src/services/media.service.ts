import { Injectable } from '@nestjs/common';
import { SystemConfig } from 'src/config';
import { FACE_THUMBNAIL_SIZE, JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { ImagePathOptions, StorageCore, ThumbnailPathEntity } from 'src/cores/storage.core';
import { AssetFile } from 'src/database';
import { OnEvent, OnJob } from 'src/decorators';
import {
  AssetEditAction,
  CropParameters,
  FujiDevelopParametersSchema,
} from 'src/dtos/editing.dto';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import {
  AssetFileType,
  AssetType,
  AssetVisibility,
  AudioCodec,
  Colorspace,
  ImageFormat,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  RawExtractedFormat,
  StorageFolder,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  TranscodeTarget,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { AssetJobRepository } from 'src/repositories/asset-job.repository';
import { BoundingBox } from 'src/repositories/machine-learning.repository';
import { getFujiRendererTimeout } from 'src/repositories/media.repository';
import { BaseService } from 'src/services/base.service';
import {
  AudioStreamInfo,
  DecodeToBufferOptions,
  GenerateThumbnailOptions,
  ImageDimensions,
  JobItem,
  JobOf,
  VideoFormat,
  VideoInterfaces,
  VideoStreamInfo,
} from 'src/types';
import { getAssetFile, getDimensions } from 'src/utils/asset.util';
import {
  checkFaceVisibility,
  checkOcrVisibility,
  getAssetEditRevision,
  getSpatialAssetEdits,
} from 'src/utils/editor';
import { getFujiRevisionPath, isFujiRenderedPath, isLegacyEditedPath } from 'src/utils/fuji';
import { BaseConfig, ThumbnailConfig } from 'src/utils/media';
import { mimeTypes } from 'src/utils/mime-types';
import { clamp } from 'src/utils/misc';
import { getOutputDimensions } from 'src/utils/transform';

const FUJI_RENDER_CLEANUP_GRACE_MS = 5 * 60 * 1000;

interface UpsertFileOptions {
  assetId: string;
  type: AssetFileType;
  path: string;
  isEdited: boolean;
  isProgressive: boolean;
  isTransparent: boolean;
}

type ThumbnailAsset = NonNullable<Awaited<ReturnType<AssetJobRepository['getForGenerateThumbnailJob']>>>;

@Injectable()
export class MediaService extends BaseService {
  videoInterfaces: VideoInterfaces = { dri: [], mali: false };

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  async onBootstrap() {
    this.videoInterfaces = await this.storageCore.getVideoInterfaces();
  }

  @OnJob({ name: JobName.AssetGenerateThumbnailsQueueAll, queue: QueueName.ThumbnailGeneration })
  async handleQueueGenerateThumbnails({ force }: JobOf<JobName.AssetGenerateThumbnailsQueueAll>): Promise<JobStatus> {
    const config = await this.getConfig({ withCache: true });
    let jobs: JobItem[] = [];

    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

    const isFullsizeEnabled = config.image.fullsize.enabled;
    for await (const asset of this.assetJobRepository.streamForThumbnailJob({
      force,
      fullsizeEnabled: isFullsizeEnabled,
    })) {
      if (force || !asset.isEdited) {
        jobs.push({ name: JobName.AssetGenerateThumbnails, data: { id: asset.id } });
      }

      if (asset.isEdited) {
        jobs.push({ name: JobName.AssetEditThumbnailGeneration, data: { id: asset.id } });
      }

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    const people = this.personRepository.getAll(force ? undefined : { thumbnailPath: '' });

    for await (const person of people) {
      if (!person.faceAssetId) {
        const face = await this.personRepository.getRandomFace(person.id);
        if (!face) {
          continue;
        }

        await this.personRepository.update({ id: person.id, faceAssetId: face.id });
      }

      jobs.push({ name: JobName.PersonGenerateThumbnail, data: { id: person.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.FileMigrationQueueAll, queue: QueueName.Migration })
  async handleQueueMigration(): Promise<JobStatus> {
    const { active, waiting } = await this.jobRepository.getJobCounts(QueueName.Migration);
    if (active === 1 && waiting === 0) {
      await this.storageCore.removeEmptyDirs(StorageFolder.Thumbnails);
      await this.storageCore.removeEmptyDirs(StorageFolder.EncodedVideo);
    }

    let jobs: JobItem[] = [];
    const assets = this.assetJobRepository.streamForMigrationJob();
    for await (const asset of assets) {
      jobs.push({ name: JobName.AssetFileMigration, data: { id: asset.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);
    jobs = [];

    for await (const person of this.personRepository.getAll()) {
      jobs.push({ name: JobName.PersonFileMigration, data: { id: person.id } });

      if (jobs.length === JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(jobs);
        jobs = [];
      }
    }

    await this.jobRepository.queueAll(jobs);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetFileMigration, queue: QueueName.Migration })
  async handleAssetMigration({ id }: JobOf<JobName.AssetFileMigration>): Promise<JobStatus> {
    const { image } = await this.getConfig({ withCache: true });
    const asset = await this.assetJobRepository.getForMigrationJob(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    await this.storageCore.moveAssetImage(asset, AssetFileType.FullSize, image.fullsize.format);
    await this.storageCore.moveAssetImage(asset, AssetFileType.Preview, image.preview.format);
    await this.storageCore.moveAssetImage(asset, AssetFileType.Thumbnail, image.thumbnail.format);
    await this.storageCore.moveAssetVideo(asset);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetEditThumbnailGeneration, queue: QueueName.Editor })
  async handleAssetEditThumbnailGeneration(job: JobOf<JobName.AssetEditThumbnailGeneration>): Promise<JobStatus> {
    const { id } = job;
    const currentEdits = await this.assetEditRepository.getAll(id);
    const currentRevision = getAssetEditRevision(currentEdits);
    job.revision ??= currentRevision;
    if (job.revision !== currentRevision) {
      this.logger.debug(`Skipping stale edit render for asset ${id}`);
      return JobStatus.Skipped;
    }

    if (currentEdits.some((edit) => edit.action === AssetEditAction.FujiDevelop)) {
      job.cleanupFuji = true;
    }

    const asset = await this.assetJobRepository.getForGenerateThumbnailJob(id);
    const config = await this.getConfig({ withCache: true });

    if (!asset) {
      this.logger.warn(`Thumbnail generation failed for asset ${id}: not found in database or missing metadata`);
      return JobStatus.Failed;
    }

    const editSnapshot = { ...asset, edits: currentEdits };
    const generated = await this.generateEditedThumbnails(editSnapshot, config, job.revision);
    if (generated?.isStale) {
      return JobStatus.Skipped;
    }

    let thumbhash: Buffer | undefined = generated?.thumbhash;
    if (!thumbhash) {
      const extractedImage = await this.extractOriginalImage(asset, config.image);
      const { info, data, colorspace } = extractedImage;

      thumbhash = await this.mediaRepository.generateThumbhash(data, {
        colorspace,
        processInvalidImages: false,
        raw: info,
        edits: [],
      });
    }

    const fullsizeDimensions = generated?.fullsizeDimensions ?? getDimensions(asset.exifInfo!);
    const reservedFujiPaths =
      generated && 'reservedFujiPaths' in generated ? (generated.reservedFujiPaths as string[]) : [];
    const committed = await this.commitEditedGeneration({
      asset: editSnapshot,
      expectedEditIds: currentEdits.map(({ id: editId }) => editId),
      files: generated?.files ?? [],
      reservedFujiPaths,
      deleteLegacyWithFujiRenderer: job.cleanupFuji === true,
      thumbhash,
      fullsizeDimensions,
      revision: job.revision,
    });
    return committed ? JobStatus.Success : JobStatus.Skipped;
  }

  @OnJob({ name: JobName.AssetGenerateThumbnails, queue: QueueName.ThumbnailGeneration })
  async handleGenerateThumbnails({ id }: JobOf<JobName.AssetGenerateThumbnails>): Promise<JobStatus> {
    const asset = await this.assetJobRepository.getForGenerateThumbnailJob(id);
    const config = await this.getConfig({ withCache: true });

    if (!asset) {
      this.logger.warn(`Thumbnail generation failed for asset ${id}: not found in database or missing metadata`);
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      this.logger.verbose(`Thumbnail generation skipped for asset ${id}: not visible`);
      return JobStatus.Skipped;
    }

    let generated: Awaited<ReturnType<MediaService['generateImageThumbnails']>>;
    if (asset.type === AssetType.Video || asset.originalFileName.toLowerCase().endsWith('.gif')) {
      this.logger.verbose(`Thumbnail generation for video ${id} ${asset.originalPath}`);
      generated = await this.generateVideoThumbnails(asset, config);
    } else if (asset.type === AssetType.Image) {
      this.logger.verbose(`Thumbnail generation for image ${id} ${asset.originalPath}`);
      generated = await this.generateImageThumbnails(asset, config);
    } else {
      this.logger.warn(`Skipping thumbnail generation for asset ${id}: ${asset.type} is not an image or video`);
      return JobStatus.Skipped;
    }

    const queriedHasFujiDevelop = asset.edits.some((edit) => edit.action === AssetEditAction.FujiDevelop);
    const persistedEdits = await this.assetEditRepository.getAll(asset.id);
    const editSnapshot = { ...asset, edits: persistedEdits };
    const hasFujiDevelop = persistedEdits.some((edit) => edit.action === AssetEditAction.FujiDevelop);
    const cleanupFuji = queriedHasFujiDevelop || hasFujiDevelop;
    const editRevision = getAssetEditRevision(persistedEdits);
    const editedGenerated = await this.generateEditedThumbnails(editSnapshot, config, editRevision);
    await this.syncFiles(
      asset.files.filter((file) => !file.isEdited),
      generated.files.filter((file) => !file.isEdited),
    );

    if (persistedEdits.length === 0 && !asset.files.some((file) => file.isEdited)) {
      if (!asset.thumbhash || Buffer.compare(asset.thumbhash, generated.thumbhash) !== 0) {
        await this.assetRepository.update({ id: asset.id, thumbhash: generated.thumbhash });
      }
      return JobStatus.Success;
    }

    if (editedGenerated?.isStale) {
      return JobStatus.Success;
    }

    const reservedFujiPaths =
      editedGenerated && 'reservedFujiPaths' in editedGenerated
        ? (editedGenerated.reservedFujiPaths as string[])
        : [];
    await this.commitEditedGeneration({
      asset: editSnapshot,
      expectedEditIds: persistedEdits.map(({ id: editId }) => editId),
      files: editedGenerated?.files ?? [],
      reservedFujiPaths,
      deleteLegacyWithFujiRenderer: cleanupFuji,
      thumbhash: editedGenerated?.thumbhash ?? generated.thumbhash,
      fullsizeDimensions: editedGenerated?.fullsizeDimensions ?? generated.fullsizeDimensions,
      revision: editRevision,
    });

    return JobStatus.Success;
  }

  private async extractImage(originalPath: string, minSize: number) {
    let extracted = await this.mediaRepository.extract(originalPath);
    if (extracted && !(await this.shouldUseExtractedImage(extracted.buffer, minSize))) {
      extracted = null;
    }

    return extracted;
  }

  private async decodeImage(thumbSource: string | Buffer, exifInfo: ThumbnailAsset['exifInfo'], targetSize?: number) {
    const { image } = await this.getConfig({ withCache: true });
    const colorspace = this.isSRGB(exifInfo) ? Colorspace.Srgb : image.colorspace;
    const decodeOptions: DecodeToBufferOptions = {
      colorspace,
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
      size: targetSize,
      orientation: exifInfo.orientation ? Number(exifInfo.orientation) : undefined,
    };

    const { info, data } = await this.mediaRepository.decodeImage(thumbSource, decodeOptions);
    return { info, data, colorspace };
  }

  private async extractOriginalImage(asset: ThumbnailAsset, image: SystemConfig['image'], useEdits = false) {
    const isExtractEmbedded = image.extractEmbedded && mimeTypes.isRaw(asset.originalFileName);
    const extracted = isExtractEmbedded ? await this.extractImage(asset.originalPath, image.preview.size) : null;
    const isGenerateFullsize =
      ((image.fullsize.enabled || asset.exifInfo.projectionType === 'EQUIRECTANGULAR') &&
        !mimeTypes.isWebSupportedImage(asset.originalPath)) ||
      useEdits;
    const isConvertFullsize =
      isGenerateFullsize && (!extracted || !mimeTypes.isWebSupportedImage(` .${extracted.format}`));

    const thumbSource = extracted ? extracted.buffer : asset.originalPath;
    const { data, info, colorspace } = await this.decodeImage(
      thumbSource,
      // only specify orientation to extracted images which don't have EXIF orientation data
      // or it can double rotate the image
      extracted ? asset.exifInfo : { ...asset.exifInfo, orientation: null },
      isConvertFullsize ? undefined : image.preview.size,
    );

    let isTransparent = false;
    if (!extracted && mimeTypes.canBeTransparent(asset.originalPath)) {
      ({ isTransparent } = await this.mediaRepository.getImageMetadata(asset.originalPath));
    }

    return {
      extracted,
      data,
      info,
      colorspace,
      convertFullsize: isConvertFullsize,
      generateFullsize: isGenerateFullsize,
      isTransparent,
    };
  }

  private async generateImageThumbnails(asset: ThumbnailAsset, { image }: SystemConfig, useEdits: boolean = false) {
    // Handle embedded preview extraction for RAW files
    const extractedImage = await this.extractOriginalImage(asset, image, useEdits);
    const { info, data, colorspace, generateFullsize, convertFullsize, extracted, isTransparent } = extractedImage;

    const previewFormat = image.preview.format;
    this.warnOnTransparencyLoss(isTransparent, previewFormat, asset.id);

    const thumbnailFormat = image.thumbnail.format;
    this.warnOnTransparencyLoss(isTransparent, thumbnailFormat, asset.id);

    const previewFile = this.getImageFile(asset, {
      fileType: AssetFileType.Preview,
      format: previewFormat,
      isEdited: useEdits,
      isProgressive: !!image.preview.progressive && previewFormat !== ImageFormat.Webp,
      isTransparent,
    });
    const thumbnailFile = this.getImageFile(asset, {
      fileType: AssetFileType.Thumbnail,
      format: thumbnailFormat,
      isEdited: useEdits,
      isProgressive: !!image.thumbnail.progressive && thumbnailFormat !== ImageFormat.Webp,
      isTransparent,
    });
    this.storageCore.ensureFolders(previewFile.path);

    // generate final images
    const baseOptions = { colorspace, processInvalidImages: false, raw: info, edits: useEdits ? asset.edits : [] };
    const thumbnailOptions = { ...image.thumbnail, ...baseOptions, format: thumbnailFormat };
    const previewOptions = { ...image.preview, ...baseOptions, format: previewFormat };
    const promises = [
      this.mediaRepository.generateThumbhash(data, baseOptions),
      this.mediaRepository.generateThumbnail(data, thumbnailOptions, thumbnailFile.path),
      this.mediaRepository.generateThumbnail(data, previewOptions, previewFile.path),
    ];

    let fullsizeFile: UpsertFileOptions | undefined;
    if (convertFullsize) {
      const fullsizeFormat = image.fullsize.format;
      this.warnOnTransparencyLoss(isTransparent, fullsizeFormat, asset.id);
      // convert a new fullsize image from the same source as the thumbnail
      fullsizeFile = this.getImageFile(asset, {
        fileType: AssetFileType.FullSize,
        format: fullsizeFormat,
        isEdited: useEdits,
        isProgressive: !!image.fullsize.progressive && fullsizeFormat !== ImageFormat.Webp,
        isTransparent,
      });
      const fullsizeOptions = {
        ...baseOptions,
        format: fullsizeFormat,
        quality: image.fullsize.quality,
        progressive: image.fullsize.progressive,
      };
      promises.push(this.mediaRepository.generateThumbnail(data, fullsizeOptions, fullsizeFile.path));
    } else if (generateFullsize && extracted && extracted.format === RawExtractedFormat.Jpeg) {
      fullsizeFile = this.getImageFile(asset, {
        fileType: AssetFileType.FullSize,
        format: extracted.format,
        isEdited: false,
        isProgressive: !!image.fullsize.progressive && image.fullsize.format !== ImageFormat.Webp,
        isTransparent,
      });
      this.storageCore.ensureFolders(fullsizeFile.path);

      // Write the buffer to disk with essential EXIF data
      await this.storageRepository.createOrOverwriteFile(fullsizeFile.path, extracted.buffer);
      await this.mediaRepository.writeExif(
        {
          orientation: asset.exifInfo.orientation,
          colorspace: asset.exifInfo.colorspace,
        },
        fullsizeFile.path,
      );
    }

    const outputs = await Promise.all(promises);

    if (asset.exifInfo.projectionType === 'EQUIRECTANGULAR') {
      const promises = [
        this.mediaRepository.copyTagGroup('XMP-GPano', asset.originalPath, previewFile.path),
        fullsizeFile
          ? this.mediaRepository.copyTagGroup('XMP-GPano', asset.originalPath, fullsizeFile.path)
          : Promise.resolve(),
      ];
      await Promise.all(promises);
    }

    const decodedDimensions = { width: info.width, height: info.height };
    const fullsizeDimensions = useEdits ? getOutputDimensions(asset.edits, decodedDimensions) : decodedDimensions;

    return {
      files: fullsizeFile ? [previewFile, thumbnailFile, fullsizeFile] : [previewFile, thumbnailFile],
      thumbhash: outputs[0] as Buffer,
      fullsizeDimensions,
    };
  }

  @OnJob({ name: JobName.PersonGenerateThumbnail, queue: QueueName.ThumbnailGeneration })
  async handleGeneratePersonThumbnail({ id }: JobOf<JobName.PersonGenerateThumbnail>): Promise<JobStatus> {
    const { image } = await this.getConfig({ withCache: true });
    const data = await this.personRepository.getDataForThumbnailGenerationJob(id);
    if (!data) {
      this.logger.error(`Could not generate person thumbnail for ${id}: missing data`);
      return JobStatus.Failed;
    }

    const { ownerId, x1, y1, x2, y2, oldWidth, oldHeight, exifOrientation, previewPath, originalPath } = data;
    let inputImage: string | Buffer;
    if (data.type === AssetType.Video) {
      if (!previewPath) {
        this.logger.error(`Could not generate person thumbnail for video ${id}: missing preview path`);
        return JobStatus.Failed;
      }
      inputImage = previewPath;
    } else if (image.extractEmbedded && mimeTypes.isRaw(originalPath)) {
      const extracted = await this.extractImage(originalPath, image.preview.size);
      inputImage = extracted ? extracted.buffer : originalPath;
    } else {
      inputImage = originalPath;
    }

    const { data: decodedImage, info } = await this.mediaRepository.decodeImage(inputImage, {
      colorspace: image.colorspace,
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
      // if this is an extracted image, it may not have orientation metadata
      orientation: Buffer.isBuffer(inputImage) && exifOrientation ? Number(exifOrientation) : undefined,
    });

    const thumbnailPath = StorageCore.getPersonThumbnailPath({ id, ownerId });
    this.storageCore.ensureFolders(thumbnailPath);

    const thumbnailOptions: GenerateThumbnailOptions = {
      colorspace: image.colorspace,
      format: ImageFormat.Jpeg,
      raw: info,
      quality: image.thumbnail.quality,
      progressive: false,
      processInvalidImages: false,
      size: FACE_THUMBNAIL_SIZE,
      edits: [
        {
          action: AssetEditAction.Crop,
          parameters: this.getCrop(
            { old: { width: oldWidth, height: oldHeight }, new: { width: info.width, height: info.height } },
            { x1, y1, x2, y2 },
          ),
        },
      ],
    };

    await this.mediaRepository.generateThumbnail(decodedImage, thumbnailOptions, thumbnailPath);
    await this.personRepository.update({ id, thumbnailPath });

    return JobStatus.Success;
  }

  private getCrop(
    dims: { old: ImageDimensions; new: ImageDimensions },
    { x1, y1, x2, y2 }: BoundingBox,
  ): CropParameters {
    // face bounding boxes can spill outside the image dimensions
    const clampedX1 = clamp(x1, 0, dims.old.width);
    const clampedY1 = clamp(y1, 0, dims.old.height);
    const clampedX2 = clamp(x2, 0, dims.old.width);
    const clampedY2 = clamp(y2, 0, dims.old.height);

    const widthScale = dims.new.width / dims.old.width;
    const heightScale = dims.new.height / dims.old.height;

    const halfWidth = (widthScale * (clampedX2 - clampedX1)) / 2;
    const halfHeight = (heightScale * (clampedY2 - clampedY1)) / 2;

    const middleX = Math.round(widthScale * clampedX1 + halfWidth);
    const middleY = Math.round(heightScale * clampedY1 + halfHeight);

    // zoom out 10%
    const targetHalfSize = Math.floor(Math.max(halfWidth, halfHeight) * 1.1);

    // get the longest distance from the center of the image without overflowing
    const newHalfSize = Math.min(
      middleX - Math.max(0, middleX - targetHalfSize),
      middleY - Math.max(0, middleY - targetHalfSize),
      Math.min(dims.new.width - 1, middleX + targetHalfSize) - middleX,
      Math.min(dims.new.height - 1, middleY + targetHalfSize) - middleY,
    );

    return {
      x: middleX - newHalfSize,
      y: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };
  }

  private async generateVideoThumbnails(asset: ThumbnailAsset, { ffmpeg, image }: SystemConfig) {
    const previewFile = this.getImageFile(asset, {
      fileType: AssetFileType.Preview,
      format: image.preview.format,
      isEdited: false,
      isProgressive: false,
      isTransparent: false,
    });
    const thumbnailFile = this.getImageFile(asset, {
      fileType: AssetFileType.Thumbnail,
      format: image.thumbnail.format,
      isEdited: false,
      isProgressive: false,
      isTransparent: false,
    });
    this.storageCore.ensureFolders(previewFile.path);

    const { videoStream, format } = asset;
    if (!videoStream || !format) {
      throw new Error(`Missing video metadata for asset ${asset.id}`);
    }

    const previewConfig = ThumbnailConfig.create({ ...ffmpeg, targetResolution: image.preview.size.toString() });
    const thumbConfig = ThumbnailConfig.create({ ...ffmpeg, targetResolution: image.thumbnail.size.toString() });
    const previewOptions = previewConfig.getCommand(TranscodeTarget.Video, videoStream, undefined, format ?? undefined);
    const thumbnailOptions = thumbConfig.getCommand(TranscodeTarget.Video, videoStream, undefined, format ?? undefined);

    await this.mediaRepository.transcode(asset.originalPath, previewFile.path, previewOptions);
    await this.mediaRepository.transcode(asset.originalPath, thumbnailFile.path, thumbnailOptions);

    const thumbhash = await this.mediaRepository.generateThumbhash(previewFile.path, {
      colorspace: image.colorspace,
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
    });

    return {
      files: [previewFile, thumbnailFile],
      thumbhash,
      fullsizeDimensions: { width: videoStream.width, height: videoStream.height },
    };
  }

  @OnJob({ name: JobName.AssetEncodeVideoQueueAll, queue: QueueName.VideoConversion })
  async handleQueueVideoConversion(job: JobOf<JobName.AssetEncodeVideoQueueAll>): Promise<JobStatus> {
    const { force } = job;

    let queue: { name: JobName.AssetEncodeVideo; data: { id: string } }[] = [];
    for await (const asset of this.assetJobRepository.streamForVideoConversion(force)) {
      queue.push({ name: JobName.AssetEncodeVideo, data: { id: asset.id } });

      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetEncodeVideo, queue: QueueName.VideoConversion })
  async handleVideoConversion({ id }: JobOf<JobName.AssetEncodeVideo>): Promise<JobStatus> {
    const asset = await this.assetJobRepository.getForVideoConversion(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    const input = asset.originalPath;
    const output = StorageCore.getEncodedVideoPath(asset);
    this.storageCore.ensureFolders(output);

    const { videoStream, format } = asset;
    const audioStream = asset.audioStream ?? undefined;
    if (!videoStream || !format) {
      this.logger.warn(`Skipped transcoding for asset ${asset.id}: missing metadata; re-run extraction first`);
      return JobStatus.Failed;
    }
    if (!videoStream.height || !videoStream.width) {
      this.logger.warn(`Skipped transcoding for asset ${asset.id}: no video dimensions`);
      return JobStatus.Failed;
    }

    let { ffmpeg } = await this.getConfig({ withCache: true });
    const target = this.getTranscodeTarget(ffmpeg, videoStream, audioStream);
    if (target === TranscodeTarget.None && !this.isRemuxRequired(ffmpeg, format)) {
      const encodedVideo = getAssetFile(asset.files, AssetFileType.EncodedVideo, { isEdited: false });
      if (encodedVideo) {
        this.logger.log(`Transcoded video exists for asset ${asset.id}, but is no longer required. Deleting...`);
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [encodedVideo.path] } });
        await this.assetRepository.deleteFiles([encodedVideo]);
      } else {
        this.logger.verbose(`Asset ${asset.id} does not require transcoding based on current policy, skipping`);
      }

      return JobStatus.Skipped;
    }

    const command = BaseConfig.create(ffmpeg, this.videoInterfaces).getCommand(target, videoStream, audioStream);
    if (ffmpeg.accel === TranscodeHardwareAcceleration.Disabled) {
      this.logger.log(`Transcoding video ${asset.id} without hardware acceleration`);
    } else {
      this.logger.log(
        `Transcoding video ${asset.id} with ${ffmpeg.accel.toUpperCase()}-accelerated encoding and${ffmpeg.accelDecode ? '' : ' software'} decoding`,
      );
    }

    try {
      await this.mediaRepository.transcode(input, output, command);
    } catch (error: any) {
      this.logger.error(`Error occurred during transcoding: ${error.message}`);
      if (ffmpeg.accel === TranscodeHardwareAcceleration.Disabled) {
        return JobStatus.Failed;
      }

      let isPartialFallbackSuccess = false;
      if (ffmpeg.accelDecode) {
        try {
          this.logger.error(`Retrying with ${ffmpeg.accel.toUpperCase()}-accelerated encoding and software decoding`);
          ffmpeg = { ...ffmpeg, accelDecode: false };
          const command = BaseConfig.create(ffmpeg, this.videoInterfaces).getCommand(target, videoStream, audioStream);
          await this.mediaRepository.transcode(input, output, command);
          isPartialFallbackSuccess = true;
        } catch (error: any) {
          this.logger.error(`Error occurred during transcoding: ${error.message}`);
        }
      }

      if (!isPartialFallbackSuccess) {
        this.logger.error(`Retrying with ${ffmpeg.accel.toUpperCase()} acceleration disabled`);
        ffmpeg = { ...ffmpeg, accel: TranscodeHardwareAcceleration.Disabled };
        const command = BaseConfig.create(ffmpeg, this.videoInterfaces).getCommand(target, videoStream, audioStream);
        await this.mediaRepository.transcode(input, output, command);
      }
    }

    this.logger.log(`Successfully encoded ${asset.id}`);

    await this.assetRepository.upsertFile({
      assetId: asset.id,
      type: AssetFileType.EncodedVideo,
      path: output,
      isEdited: false,
    });

    return JobStatus.Success;
  }

  private getTranscodeTarget(
    config: SystemConfigFFmpegDto,
    videoStream: VideoStreamInfo,
    audioStream?: AudioStreamInfo,
  ): TranscodeTarget {
    const isAudioTranscodeRequired = this.isAudioTranscodeRequired(config, audioStream);
    const isVideoTranscodeRequired = this.isVideoTranscodeRequired(config, videoStream);

    if (isAudioTranscodeRequired && isVideoTranscodeRequired) {
      return TranscodeTarget.All;
    }

    if (isAudioTranscodeRequired) {
      return TranscodeTarget.Audio;
    }

    if (isVideoTranscodeRequired) {
      return TranscodeTarget.Video;
    }

    return TranscodeTarget.None;
  }

  private isAudioTranscodeRequired(ffmpegConfig: SystemConfigFFmpegDto, stream?: AudioStreamInfo): boolean {
    if (!stream) {
      return false;
    }

    switch (ffmpegConfig.transcode) {
      case TranscodePolicy.Disabled: {
        return false;
      }
      case TranscodePolicy.All: {
        return true;
      }
      case TranscodePolicy.Required:
      case TranscodePolicy.Optimal:
      case TranscodePolicy.Bitrate: {
        return !ffmpegConfig.acceptedAudioCodecs.includes(stream.codecName as AudioCodec);
      }
      default: {
        throw new Error(`Unsupported transcode policy: ${ffmpegConfig.transcode}`);
      }
    }
  }

  private isVideoTranscodeRequired(ffmpegConfig: SystemConfigFFmpegDto, stream: VideoStreamInfo): boolean {
    const isScalingEnabled = ffmpegConfig.targetResolution !== 'original';
    const targetRes = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetRes = isScalingEnabled && Math.min(stream.height, stream.width) > targetRes;
    const maxBitrate = this.parseBitrateToBps(ffmpegConfig.maxBitrate);
    const isLargerThanTargetBitrate = maxBitrate > 0 && stream.bitrate > maxBitrate;

    const isTargetVideoCodec = ffmpegConfig.acceptedVideoCodecs.includes(stream.codecName as VideoCodec);
    const isRequired = !isTargetVideoCodec || !stream.pixelFormat.endsWith('420p');

    switch (ffmpegConfig.transcode) {
      case TranscodePolicy.Disabled: {
        return false;
      }
      case TranscodePolicy.All: {
        return true;
      }
      case TranscodePolicy.Required: {
        return isRequired;
      }
      case TranscodePolicy.Optimal: {
        return isRequired || isLargerThanTargetRes;
      }
      case TranscodePolicy.Bitrate: {
        return isRequired || isLargerThanTargetBitrate;
      }
      default: {
        throw new Error(`Unsupported transcode policy: ${ffmpegConfig.transcode}`);
      }
    }
  }

  private isRemuxRequired(ffmpegConfig: SystemConfigFFmpegDto, { formatName, formatLongName }: VideoFormat): boolean {
    if (ffmpegConfig.transcode === TranscodePolicy.Disabled) {
      return false;
    }

    const formatLongNameMapping: Record<string, VideoContainer> = {
      'QuickTime / MOV': VideoContainer.Mov,
      'Matroska / WebM': VideoContainer.Webm,
    };

    const name = (formatLongName ? formatLongNameMapping[formatLongName] : undefined) ?? (formatName as VideoContainer);

    return name !== VideoContainer.Mp4 && !ffmpegConfig.acceptedContainers.includes(name);
  }

  isSRGB({
    colorspace,
    profileDescription,
    bitsPerSample,
  }: {
    colorspace: string | null;
    profileDescription: string | null;
    bitsPerSample: number | null;
  }): boolean {
    if (colorspace || profileDescription) {
      return [colorspace, profileDescription].some((s) => s?.toLowerCase().includes('srgb'));
    }
    if (bitsPerSample) {
      // assume sRGB for 8-bit images with no color profile or colorspace metadata
      return bitsPerSample === 8;
    }
    // assume sRGB for images with no relevant metadata
    return true;
  }

  private parseBitrateToBps(bitrateString: string) {
    const bitrateValue = Number.parseInt(bitrateString);

    if (Number.isNaN(bitrateValue)) {
      this.logger.log(`Maximum bitrate '${bitrateString} is not a number and will be ignored.`);
      return 0;
    }

    if (bitrateString.toLowerCase().endsWith('k')) {
      return bitrateValue * 1000; // Kilobits per second to bits per second
    }
    if (bitrateString.toLowerCase().endsWith('m')) {
      return bitrateValue * 1_000_000; // Megabits per second to bits per second
    }
    return bitrateValue;
  }

  private async shouldUseExtractedImage(extractedPathOrBuffer: string | Buffer, targetSize: number) {
    const { width, height } = await this.mediaRepository.getImageMetadata(extractedPathOrBuffer);
    const extractedSize = Math.min(width, height);
    return extractedSize >= targetSize;
  }

  private async commitEditedGeneration({
    asset,
    expectedEditIds,
    files,
    reservedFujiPaths,
    deleteLegacyWithFujiRenderer,
    thumbhash,
    fullsizeDimensions,
    revision,
  }: {
    asset: ThumbnailAsset;
    expectedEditIds: string[];
    files: UpsertFileOptions[];
    reservedFujiPaths: string[];
    deleteLegacyWithFujiRenderer: boolean;
    thumbhash: Buffer;
    fullsizeDimensions: ImageDimensions;
    revision: string;
  }): Promise<boolean> {
    const result = await this.assetRepository.commitEditedFilesIfCurrent({
      assetId: asset.id,
      expectedEditIds,
      files,
      reservedFujiPaths,
      deleteLegacyWithFujiRenderer,
      thumbhash,
      ...fullsizeDimensions,
    });

    const cleanupJobs: JobItem[] = [];
    if (result.standardPathsToDelete.length > 0) {
      cleanupJobs.push({
        name: JobName.FileDelete,
        data: { files: result.standardPathsToDelete },
      });
    }
    if (result.fujiCleanupPending) {
      cleanupJobs.push({ name: JobName.FujiFileCleanup, data: {} });
    }
    await this.jobRepository.queueAll(cleanupJobs);

    if (!result.committed) {
      this.logger.debug(`Discarding stale edit render result for asset ${asset.id}`);
      return false;
    }

    if (asset.type === AssetType.Image && (asset.files.length > 0 || asset.edits.length > 0)) {
      await this.updateEditDerivedMetadata(asset, revision);
    }
    return true;
  }

  private async syncFiles(
    oldFiles: (AssetFile & { isProgressive: boolean; isTransparent: boolean })[],
    newFiles: UpsertFileOptions[],
    { deleteWithFujiRenderer = false }: { deleteWithFujiRenderer?: boolean } = {},
  ) {
    const toUpsert: UpsertFileOptions[] = [];
    const pathsToDelete: string[] = [];
    const toDelete = new Set(oldFiles);

    for (const newFile of newFiles) {
      const existingFile = oldFiles.find((file) => file.type === newFile.type && file.isEdited === newFile.isEdited);
      if (existingFile) {
        toDelete.delete(existingFile);
      }

      // upsert new file path
      if (
        existingFile?.path !== newFile.path ||
        existingFile.isProgressive !== newFile.isProgressive ||
        existingFile.isTransparent !== newFile.isTransparent
      ) {
        toUpsert.push(newFile);

        // delete old file from disk
        if (existingFile && existingFile.path !== newFile.path) {
          this.logger.debug(
            `Deleting old ${newFile.type} image for asset ${newFile.assetId} in favor of a replacement`,
          );
          pathsToDelete.push(existingFile.path);
        }
      }
    }

    if (toDelete.size > 0) {
      const toDeleteArray = [...toDelete];
      for (const file of toDeleteArray) {
        pathsToDelete.push(file.path);
      }
    }

    const fujiPathsToDelete = pathsToDelete.filter(
      (path) => isFujiRenderedPath(path) || (deleteWithFujiRenderer && isLegacyEditedPath(path)),
    );
    if (fujiPathsToDelete.length > 0) {
      throw new Error('Fuji-owned edited files must be swapped through the revision-checked cleanup outbox');
    }

    if (toUpsert.length > 0) {
      await this.assetRepository.upsertFiles(toUpsert);
    }

    if (toDelete.size > 0) {
      const toDeleteArray = [...toDelete];
      await this.assetRepository.deleteFiles(toDeleteArray);
    }

    if (pathsToDelete.length > 0) {
      await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: pathsToDelete } });
    }
  }

  private async isEditRevisionCurrent(assetId: string, revision: string): Promise<boolean> {
    const edits = await this.assetEditRepository.getAll(assetId);
    return getAssetEditRevision(edits) === revision;
  }

  private async generateFujiEditedThumbnails(
    asset: ThumbnailAsset,
    { image }: SystemConfig,
    revision: string,
  ) {
    const fujiEdit = asset.edits.find((edit) => edit.action === AssetEditAction.FujiDevelop);
    if (!fujiEdit) {
      throw new Error(`Missing Fuji development edit for asset ${asset.id}`);
    }

    if (!(await this.isEditRevisionCurrent(asset.id, revision))) {
      return null;
    }

    const parameters = FujiDevelopParametersSchema.parse(fujiEdit.parameters);
    const spatialEdits = getSpatialAssetEdits(asset.edits);
    const fullSizeFile = this.getFujiImageFile(
      asset,
      {
        fileType: AssetFileType.FullSize,
        format: ImageFormat.Jpeg,
        isEdited: true,
        isProgressive: false,
        isTransparent: false,
      },
      revision,
    );
    const previewFile = this.getFujiImageFile(
      asset,
      {
        fileType: AssetFileType.Preview,
        format: image.preview.format,
        isEdited: true,
        isProgressive: !!image.preview.progressive && image.preview.format !== ImageFormat.Webp,
        isTransparent: false,
      },
      revision,
    );
    const thumbnailFile = this.getFujiImageFile(
      asset,
      {
        fileType: AssetFileType.Thumbnail,
        format: image.thumbnail.format,
        isEdited: true,
        isProgressive: !!image.thumbnail.progressive && image.thumbnail.format !== ImageFormat.Webp,
        isTransparent: false,
      },
      revision,
    );

    const settings = {
      exposure: parameters.exposure,
      contrast: parameters.contrast,
      highlights: parameters.highlights,
      shadows: parameters.shadows,
      whites: parameters.whites,
      blacks: parameters.blacks,
      temperature: parameters.temperature,
      tint: parameters.tint,
      vibrance: parameters.vibrance,
      saturation: parameters.saturation,
    };

    const reservedFujiPaths = [fullSizeFile.path, previewFile.path, thumbnailFile.path];
    const cleanupAvailableAt = new Date(Date.now() + getFujiRendererTimeout() + FUJI_RENDER_CLEANUP_GRACE_MS);
    await this.assetRepository.reserveFujiRenderOutputs(asset.id, reservedFujiPaths, cleanupAvailableAt);
    // Queue the deadline before starting the expensive render. If this process
    // crashes after publication, the DB reservation remains enough for a
    // restarted worker to discover and remove the uncommitted files.
    await this.jobRepository.queue({
      name: JobName.FujiFileCleanup,
      data: { delay: Math.max(0, cleanupAvailableAt.getTime() - Date.now()) },
    });

    const rendered = await this.mediaRepository.renderFujiRaw({
      inputPath: asset.originalPath,
      profileSlug: parameters.profileSlug,
      renderRevision: revision,
      settings,
      spatialEdits,
      outputs: {
        fullSizePath: fullSizeFile.path,
        previewPath: previewFile.path,
        thumbnailPath: thumbnailFile.path,
      },
      image: {
        preview: {
          format: image.preview.format,
          quality: image.preview.quality,
          progressive: !!image.preview.progressive,
          size: image.preview.size,
        },
        thumbnail: {
          format: image.thumbnail.format,
          quality: image.thumbnail.quality,
          progressive: !!image.thumbnail.progressive,
          size: image.thumbnail.size,
        },
      },
    });

    const thumbhash = await this.mediaRepository.generateThumbhash(rendered.outputs.fullSize.path, {
      colorspace: Colorspace.Srgb,
      processInvalidImages: false,
      edits: [],
    });

    return {
      files: [previewFile, thumbnailFile, fullSizeFile],
      thumbhash,
      fullsizeDimensions: {
        width: rendered.outputs.fullSize.width,
        height: rendered.outputs.fullSize.height,
      },
      reservedFujiPaths,
    };
  }

  private async generateEditedThumbnails(asset: ThumbnailAsset, config: SystemConfig, revision?: string) {
    if (asset.type !== AssetType.Image || (asset.files.length === 0 && asset.edits.length === 0)) {
      return;
    }

    const hasFujiDevelop = asset.edits.some((edit) => edit.action === AssetEditAction.FujiDevelop);
    let generated;
    if (hasFujiDevelop) {
      if (!revision) {
        throw new Error(`Missing edit revision for Fuji development of asset ${asset.id}`);
      }
      generated = await this.generateFujiEditedThumbnails(asset, config, revision);
      if (!generated) {
        return { isStale: true as const };
      }
    } else {
      generated = asset.edits.length > 0 ? await this.generateImageThumbnails(asset, config, true) : undefined;
    }

    return generated ? { ...generated, isStale: false as const } : undefined;
  }

  private async updateEditDerivedMetadata(asset: ThumbnailAsset, revision: string) {
    if (!(await this.isEditRevisionCurrent(asset.id, revision))) {
      return;
    }

    const crop = asset.edits.find((edit) => edit.action === AssetEditAction.Crop);
    const cropBox = crop
      ? {
          x1: crop.parameters.x,
          y1: crop.parameters.y,
          x2: crop.parameters.x + crop.parameters.width,
          y2: crop.parameters.y + crop.parameters.height,
        }
      : undefined;
    const originalDimensions = getDimensions(asset.exifInfo!);
    const [assetFaces, ocrData] = await Promise.all([
      this.personRepository.getFaces(asset.id, {}),
      this.ocrRepository.getByAssetId(asset.id, {}),
    ]);

    // These mutations are intentionally after the derivative CAS. Recheck
    // immediately before each independent metadata write so a stale crop job
    // cannot hide faces or OCR after a newer edit list has committed.
    if (!(await this.isEditRevisionCurrent(asset.id, revision))) {
      return;
    }
    const faceStatuses = checkFaceVisibility(assetFaces, originalDimensions, cropBox);
    await this.personRepository.updateVisibility(faceStatuses.visible, faceStatuses.hidden);

    if (!(await this.isEditRevisionCurrent(asset.id, revision))) {
      return;
    }
    const ocrStatuses = checkOcrVisibility(ocrData, originalDimensions, cropBox);
    await this.ocrRepository.updateOcrVisibilities(asset.id, ocrStatuses.visible, ocrStatuses.hidden);
  }

  private warnOnTransparencyLoss(isTransparent: boolean, format: ImageFormat, assetId: string) {
    if (isTransparent && format === ImageFormat.Jpeg) {
      this.logger.warn(
        `Asset ${assetId} has transparency but the configured format is ${format} which does not support it, consider using a format that does, such as ${ImageFormat.Webp}`,
      );
    }
  }

  private getImageFile(
    asset: ThumbnailPathEntity,
    options: ImagePathOptions & { isProgressive: boolean; isTransparent: boolean },
  ) {
    const path = StorageCore.getImagePath(asset, options);
    return {
      assetId: asset.id,
      type: options.fileType,
      path,
      isEdited: options.isEdited,
      isProgressive: options.isProgressive,
      isTransparent: options.isTransparent,
    };
  }

  private getFujiImageFile(
    asset: ThumbnailPathEntity,
    options: ImagePathOptions & { isProgressive: boolean; isTransparent: boolean },
    revision: string,
  ) {
    const file = this.getImageFile(asset, options);
    return { ...file, path: getFujiRevisionPath(file.path, revision) };
  }
}
