import { Injectable } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { FACE_THUMBNAIL_SIZE, JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { StorageCore, ThumbnailPathEntity } from 'src/cores/storage.core';
import { Exif } from 'src/database';
import { OnEvent, OnJob } from 'src/decorators';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import {
  AssetFileType,
  AssetPathType,
  AssetType,
  AssetVisibility,
  AudioCodec,
  Colorspace,
  ImageFormat,
  JobName,
  JobStatus,
  LogLevel,
  QueueName,
  RawExtractedFormat,
  StorageBackend,
  StorageFolder,
  StorageLocationType,
  ToneMapping,
  TranscodeHardwareAcceleration,
  TranscodePolicy,
  TranscodeTarget,
  VideoCodec,
  VideoContainer,
} from 'src/enum';
import { BoundingBox } from 'src/repositories/machine-learning.repository';
import { IStorageAdapter, StorageWriteOptions } from 'src/repositories/storage/storage-adapter.interface';
import { BaseService } from 'src/services/base.service';
import {
  AudioStreamInfo,
  CropOptions,
  DecodeToBufferOptions,
  ImageDimensions,
  JobItem,
  JobOf,
  VideoFormat,
  VideoInterfaces,
  VideoStreamInfo,
} from 'src/types';
import { getAssetFiles } from 'src/utils/asset.util';
import { BaseConfig, ThumbnailConfig } from 'src/utils/media';
import { mimeTypes } from 'src/utils/mime-types';
import { clamp, isFaceImportEnabled, isFacialRecognitionEnabled } from 'src/utils/misc';
interface UpsertFileOptions {
  assetId: string;
  type: AssetFileType;
  path: string;
}

@Injectable()
export class MediaService extends BaseService {
  videoInterfaces: VideoInterfaces = { dri: [], mali: false };

  @OnEvent({ name: 'AppBootstrap' })
  async onBootstrap() {
    const [dri, mali] = await Promise.all([this.getDevices(), this.hasMaliOpenCL()]);
    this.videoInterfaces = { dri, mali };
  }

  @OnJob({ name: JobName.AssetGenerateThumbnailsQueueAll, queue: QueueName.AssetThumbnailGeneration })
  async handleQueueGenerateAssetThumbnails({
    force,
  }: JobOf<JobName.AssetGenerateThumbnailsQueueAll>): Promise<JobStatus> {
    let jobs: JobItem[] = [];

    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

    for await (const asset of this.assetJobRepository.streamForThumbnailJob(!!force)) {
      jobs.push({ name: JobName.AssetGenerateThumbnails, data: { id: asset.id } });

      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.PersonGenerateThumbnailsQueueAll, queue: QueueName.PersonThumbnailGeneration })
  async handleQueueGeneratePersonThumbnails({
    force,
  }: JobOf<JobName.PersonGenerateThumbnailsQueueAll>): Promise<JobStatus> {
    let jobs: JobItem[] = [];

    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

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

    await this.storageCore.moveAssetImage(asset, AssetPathType.FullSize, image.fullsize.format);
    await this.storageCore.moveAssetImage(asset, AssetPathType.Preview, image.preview.format);
    await this.storageCore.moveAssetImage(asset, AssetPathType.Thumbnail, image.thumbnail.format);
    await this.storageCore.moveAssetVideo(asset);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetGenerateThumbnails, queue: QueueName.AssetThumbnailGeneration })
  async handleGenerateThumbnails(data: JobOf<JobName.AssetGenerateThumbnails>): Promise<JobStatus> {
    const { id } = data;
    const asset = await this.assetJobRepository.getForGenerateThumbnailJob(id);
    if (!asset) {
      this.logger.warn(`Thumbnail generation failed for asset ${id}: not found in database or missing metadata`);
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      this.logger.verbose(`Thumbnail generation skipped for asset ${id}: not visible`);
      return JobStatus.Skipped;
    }

    // Determine the local file path to use for processing
    // Priority: 1) localPath from job data (fresh upload), 2) download from S3 if needed
    let filePath = data.localPath;
    let downloadedFromS3 = false;

    if (filePath && (await this.storageRepository.checkFileExists(filePath))) {
      // Use localPath from job data (temp file from upload)
      this.logger.debug(`Using localPath from job data for thumbnail generation: ${filePath}`);
    } else {
      // No localPath or file doesn't exist - download from S3 or use local asset path
      const result = await this.ensureLocalFile(
        id,
        asset.ownerId,
        asset.originalPath,
        asset.storageBackend,
        asset.s3Bucket,
        asset.s3Key,
        'thumbnail generation',
      );
      filePath = result.localPath;
      downloadedFromS3 = result.downloadedFromS3;
    }

    // Create a modified asset object with the local file path for processing
    const assetForProcessing = { ...asset, originalPath: filePath };

    let generated: {
      previewPath: string;
      thumbnailPath: string;
      fullsizePath?: string;
      thumbhash: Buffer;
    };

    if (asset.type === AssetType.Video || asset.originalFileName.toLowerCase().endsWith('.gif')) {
      this.logger.verbose(`Thumbnail generation for video ${id} ${filePath}`);
      generated = await this.generateVideoThumbnails(assetForProcessing);
    } else if (asset.type === AssetType.Image) {
      this.logger.verbose(`Thumbnail generation for image ${id} ${filePath}`);
      generated = await this.generateImageThumbnails(assetForProcessing);
    } else {
      this.logger.warn(`Skipping thumbnail generation for asset ${id}: ${asset.type} is not an image or video`);
      return JobStatus.Skipped;
    }

    const { previewFile, thumbnailFile, fullsizeFile } = getAssetFiles(asset.files);
    const toUpsert: UpsertFileOptions[] = [];
    if (previewFile?.path !== generated.previewPath) {
      toUpsert.push({ assetId: asset.id, path: generated.previewPath, type: AssetFileType.Preview });
    }

    if (thumbnailFile?.path !== generated.thumbnailPath) {
      toUpsert.push({ assetId: asset.id, path: generated.thumbnailPath, type: AssetFileType.Thumbnail });
    }

    if (generated.fullsizePath && fullsizeFile?.path !== generated.fullsizePath) {
      toUpsert.push({ assetId: asset.id, path: generated.fullsizePath, type: AssetFileType.FullSize });
    }

    if (toUpsert.length > 0) {
      await this.assetRepository.upsertFiles(toUpsert);
    }

    const pathsToDelete: string[] = [];
    if (previewFile && previewFile.path !== generated.previewPath) {
      this.logger.debug(`Deleting old preview for asset ${asset.id}`);
      pathsToDelete.push(previewFile.path);
    }

    if (thumbnailFile && thumbnailFile.path !== generated.thumbnailPath) {
      this.logger.debug(`Deleting old thumbnail for asset ${asset.id}`);
      pathsToDelete.push(thumbnailFile.path);
    }

    if (fullsizeFile && fullsizeFile.path !== generated.fullsizePath) {
      this.logger.debug(`Deleting old fullsize preview image for asset ${asset.id}`);
      pathsToDelete.push(fullsizeFile.path);
      if (!generated.fullsizePath) {
        // did not generate a new fullsize image, delete the existing record
        await this.assetRepository.deleteFiles([fullsizeFile]);
      }
    }

    if (pathsToDelete.length > 0) {
      await Promise.all(pathsToDelete.map((path) => this.storageRepository.unlink(path)));
    }

    if (!asset.thumbhash || Buffer.compare(asset.thumbhash, generated.thumbhash) !== 0) {
      await this.assetRepository.update({ id: asset.id, thumbhash: generated.thumbhash });
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, previewAt: new Date(), thumbnailAt: new Date() });

    // Upload thumbnails to S3 inline (not queued) to ensure they're uploaded before worker stops
    await this.uploadThumbnailsToS3Inline(asset.id, asset.ownerId, generated.thumbnailPath, generated.previewPath);

    // Clean up downloaded S3 file (it's already in S3, no need to keep local copy)
    // Note: Don't cleanup localPath from job data - that's handled by job.service after all jobs complete
    // For recovery videos, keep the file - it's needed for video encoding
    const isRecoveryVideo = data.source === 'recovery' && asset.type === AssetType.Video;
    if (!isRecoveryVideo) {
      await this.cleanupDownloadedFile(id, filePath, downloadedFromS3);
    } else if (downloadedFromS3) {
      this.logger.debug(`Recovery video: keeping downloaded file for encoding at ${filePath}`);
    }

    return JobStatus.Success;
  }

  /**
   * Upload a file to S3 with verification that the upload completed successfully.
   * Compares file sizes between local and S3 to detect partial uploads.
   * Cleans up the S3 object if verification fails.
   */
  private async uploadAndVerifyToS3(
    s3Adapter: IStorageAdapter,
    localAdapter: IStorageAdapter,
    localPath: string,
    s3Key: string,
    options: StorageWriteOptions,
  ): Promise<void> {
    const readStream: Readable = createReadStream(localPath);

    try {
      // Step 1: Upload to S3
      await s3Adapter.writeStreamAsync!(s3Key, readStream, options);

      // Step 2: Verify upload by comparing sizes
      const [s3Stat, localStat] = await Promise.all([s3Adapter.stat(s3Key), localAdapter.stat(localPath)]);

      if (s3Stat.size !== localStat.size) {
        // Size mismatch - clean up and throw
        await s3Adapter.delete(s3Key);
        throw new Error(`S3 upload size mismatch for ${s3Key}: local=${localStat.size}, s3=${s3Stat.size}`);
      }
    } catch (error) {
      // Clean up partial upload on any error (best effort)
      await s3Adapter.delete(s3Key).catch(() => {});
      throw error;
    }
  }

  /**
   * Upload thumbnails directly to S3 inline (synchronously) instead of queueing.
   * This ensures thumbnails are persisted before the worker potentially stops.
   */
  private async uploadThumbnailsToS3Inline(
    assetId: string,
    ownerId: string,
    thumbnailPath: string,
    previewPath: string,
  ): Promise<void> {
    const { storage } = await this.getConfig({ withCache: true });

    // Check if S3 is enabled for thumbnails or previews
    const uploadThumbnails = storage.s3.enabled && storage.locations.thumbnails === StorageBackend.S3;
    const uploadPreviews = storage.s3.enabled && storage.locations.previews === StorageBackend.S3;

    if (!uploadThumbnails && !uploadPreviews) {
      this.logger.debug(`S3 upload skipped for thumbnails ${assetId}: S3 not enabled for thumbnails/previews`);
      return;
    }

    const s3Manager = this.s3Manager;
    const localAdapter = s3Manager.getLocalAdapter();

    try {
      // Upload thumbnail to S3
      if (uploadThumbnails && thumbnailPath) {
        const {
          adapter: s3Adapter,
          bucket,
          storageClass,
        } = await s3Manager.getConfigForLocation(StorageLocationType.Thumbnails);
        const s3Key = `users/${ownerId}/${assetId}/thumbnail.webp`;

        const localFileExists = await localAdapter.exists(thumbnailPath);
        if (localFileExists) {
          this.logger.log(`Uploading thumbnail inline for asset ${assetId} to S3: ${s3Key}`);

          // Upload with verification before updating database
          await this.uploadAndVerifyToS3(s3Adapter, localAdapter, thumbnailPath, s3Key, {
            contentType: 'image/webp',
            storageClass,
          });

          // Update asset_file record only after verified upload
          await this.assetRepository.upsertFileWithS3({
            assetId,
            type: AssetFileType.Thumbnail,
            path: thumbnailPath,
            storageBackend: StorageBackend.S3,
            s3Bucket: bucket,
            s3Key,
          });

          // Don't delete local thumbnail here - ML jobs still need to read it
          // Cleanup happens after ML jobs complete

          this.logger.log(`Successfully uploaded thumbnail inline for asset ${assetId} to S3`);
        }
      }

      // Upload preview to S3
      if (uploadPreviews && previewPath) {
        const {
          adapter: s3Adapter,
          bucket,
          storageClass,
        } = await s3Manager.getConfigForLocation(StorageLocationType.Previews);
        const s3Key = `users/${ownerId}/${assetId}/preview.webp`;

        const localFileExists = await localAdapter.exists(previewPath);
        if (localFileExists) {
          this.logger.log(`Uploading preview inline for asset ${assetId} to S3: ${s3Key}`);

          // Upload with verification before updating database
          await this.uploadAndVerifyToS3(s3Adapter, localAdapter, previewPath, s3Key, {
            contentType: 'image/webp',
            storageClass,
          });

          // Update asset_file record only after verified upload
          await this.assetRepository.upsertFileWithS3({
            assetId,
            type: AssetFileType.Preview,
            path: previewPath,
            storageBackend: StorageBackend.S3,
            s3Bucket: bucket,
            s3Key,
          });

          // Don't delete local preview here - ML jobs still need to read it
          // Cleanup happens after ML jobs complete

          this.logger.log(`Successfully uploaded preview inline for asset ${assetId} to S3`);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to upload thumbnails inline to S3 for asset ${assetId}: ${error}`);
      // Don't fail the job - thumbnails are generated locally and can be re-uploaded later
    }
  }

  private async extractImage(originalPath: string, minSize: number) {
    let extracted = await this.mediaRepository.extract(originalPath);
    if (extracted && !(await this.shouldUseExtractedImage(extracted.buffer, minSize))) {
      extracted = null;
    }

    return extracted;
  }

  private async decodeImage(thumbSource: string | Buffer, exifInfo: Exif, targetSize?: number) {
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

  private async generateImageThumbnails(asset: {
    id: string;
    ownerId: string;
    originalFileName: string;
    originalPath: string;
    exifInfo: Exif;
  }) {
    const { image } = await this.getConfig({ withCache: true });
    const previewPath = StorageCore.getImagePath(asset, AssetPathType.Preview, image.preview.format);
    const thumbnailPath = StorageCore.getImagePath(asset, AssetPathType.Thumbnail, image.thumbnail.format);
    this.storageCore.ensureFolders(previewPath);

    // Handle embedded preview extraction for RAW files
    const extractEmbedded = image.extractEmbedded && mimeTypes.isRaw(asset.originalFileName);
    const extracted = extractEmbedded ? await this.extractImage(asset.originalPath, image.preview.size) : null;
    const generateFullsize =
      (image.fullsize.enabled || asset.exifInfo.projectionType == 'EQUIRECTANGULAR') &&
      !mimeTypes.isWebSupportedImage(asset.originalPath);
    const convertFullsize = generateFullsize && (!extracted || !mimeTypes.isWebSupportedImage(` .${extracted.format}`));

    const { info, data, colorspace } = await this.decodeImage(
      extracted ? extracted.buffer : asset.originalPath,
      // only specify orientation to extracted images which don't have EXIF orientation data
      // or it can double rotate the image
      extracted ? asset.exifInfo : { ...asset.exifInfo, orientation: null },
      convertFullsize ? undefined : image.preview.size,
    );

    // generate final images
    const thumbnailOptions = { colorspace, processInvalidImages: false, raw: info };
    const promises = [
      this.mediaRepository.generateThumbhash(data, thumbnailOptions),
      this.mediaRepository.generateThumbnail(data, { ...image.thumbnail, ...thumbnailOptions }, thumbnailPath),
      this.mediaRepository.generateThumbnail(data, { ...image.preview, ...thumbnailOptions }, previewPath),
    ];

    let fullsizePath: string | undefined;

    if (convertFullsize) {
      // convert a new fullsize image from the same source as the thumbnail
      fullsizePath = StorageCore.getImagePath(asset, AssetPathType.FullSize, image.fullsize.format);
      const fullsizeOptions = { format: image.fullsize.format, quality: image.fullsize.quality, ...thumbnailOptions };
      promises.push(this.mediaRepository.generateThumbnail(data, fullsizeOptions, fullsizePath));
    } else if (generateFullsize && extracted && extracted.format === RawExtractedFormat.Jpeg) {
      fullsizePath = StorageCore.getImagePath(asset, AssetPathType.FullSize, extracted.format);
      this.storageCore.ensureFolders(fullsizePath);

      // Write the buffer to disk with essential EXIF data
      await this.storageRepository.createOrOverwriteFile(fullsizePath, extracted.buffer);
      await this.mediaRepository.writeExif(
        {
          orientation: asset.exifInfo.orientation,
          colorspace: asset.exifInfo.colorspace,
        },
        fullsizePath,
      );
    }

    const outputs = await Promise.all(promises);

    if (asset.exifInfo.projectionType === 'EQUIRECTANGULAR') {
      const promises = [
        this.mediaRepository.copyTagGroup('XMP-GPano', asset.originalPath, previewPath),
        fullsizePath
          ? this.mediaRepository.copyTagGroup('XMP-GPano', asset.originalPath, fullsizePath)
          : Promise.resolve(),
      ];
      await Promise.all(promises);
    }

    return { previewPath, thumbnailPath, fullsizePath, thumbhash: outputs[0] as Buffer };
  }

  @OnJob({ name: JobName.PersonGenerateThumbnail, queue: QueueName.PersonThumbnailGeneration })
  async handleGeneratePersonThumbnail({ id }: JobOf<JobName.PersonGenerateThumbnail>): Promise<JobStatus> {
    const { machineLearning, metadata, image } = await this.getConfig({ withCache: true });
    if (!isFacialRecognitionEnabled(machineLearning) && !isFaceImportEnabled(metadata)) {
      return JobStatus.Skipped;
    }

    const data = await this.personRepository.getDataForThumbnailGenerationJob(id);
    if (!data) {
      this.logger.error(`Could not generate person thumbnail for ${id}: missing data`);
      return JobStatus.Failed;
    }

    const { ownerId, assetId, x1, y1, x2, y2, oldWidth, oldHeight, exifOrientation, previewPath, originalPath } = data;

    let inputImage: string | Buffer;
    let downloadedFromS3 = false;
    let s3LocalPath: string | undefined;

    if (data.type === AssetType.Video) {
      if (!previewPath) {
        this.logger.error(`Could not generate person thumbnail for video ${id}: missing preview path`);
        return JobStatus.Failed;
      }
      // For S3-backed previews, download from S3 if not available locally
      const result = await this.ensureLocalFile(
        assetId,
        ownerId,
        previewPath,
        data.previewStorageBackend,
        data.previewS3Bucket,
        data.previewS3Key,
        'person thumbnail generation (video preview)',
      );
      downloadedFromS3 = result.downloadedFromS3;
      s3LocalPath = result.localPath;
      inputImage = s3LocalPath;
    } else {
      // Ensure local file exists, download from S3 if needed
      const result = await this.ensureLocalFile(
        assetId,
        ownerId,
        originalPath,
        data.storageBackend,
        data.s3Bucket,
        data.s3Key,
        'person thumbnail generation',
      );
      downloadedFromS3 = result.downloadedFromS3;
      s3LocalPath = result.localPath;

      if (image.extractEmbedded && mimeTypes.isRaw(s3LocalPath)) {
        const extracted = await this.extractImage(s3LocalPath, image.preview.size);
        inputImage = extracted ? extracted.buffer : s3LocalPath;
      } else {
        inputImage = s3LocalPath;
      }
    }

    const { data: decodedImage, info } = await this.mediaRepository.decodeImage(inputImage, {
      colorspace: image.colorspace,
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
      // if this is an extracted image, it may not have orientation metadata
      orientation: Buffer.isBuffer(inputImage) && exifOrientation ? Number(exifOrientation) : undefined,
    });

    const thumbnailPath = StorageCore.getPersonThumbnailPath({ id, ownerId });
    this.storageCore.ensureFolders(thumbnailPath);

    const thumbnailOptions = {
      colorspace: image.colorspace,
      format: ImageFormat.Jpeg,
      raw: info,
      quality: image.thumbnail.quality,
      crop: this.getCrop(
        { old: { width: oldWidth, height: oldHeight }, new: { width: info.width, height: info.height } },
        { x1, y1, x2, y2 },
      ),
      processInvalidImages: false,
      size: FACE_THUMBNAIL_SIZE,
    };

    await this.mediaRepository.generateThumbnail(decodedImage, thumbnailOptions, thumbnailPath);
    await this.personRepository.update({ id, thumbnailPath });

    // Upload person thumbnail to S3 inline (not queued) to ensure it's uploaded before worker stops
    await this.uploadPersonThumbnailToS3Inline(id, ownerId, thumbnailPath);

    // Clean up downloaded S3 file if we downloaded it
    if (s3LocalPath) {
      await this.cleanupDownloadedFile(id, s3LocalPath, downloadedFromS3);
    }

    return JobStatus.Success;
  }

  /**
   * Upload person thumbnail directly to S3 inline instead of queueing.
   * This ensures person thumbnails are persisted before the worker potentially stops.
   */
  private async uploadPersonThumbnailToS3Inline(
    personId: string,
    ownerId: string,
    thumbnailPath: string,
  ): Promise<void> {
    const { storage } = await this.getConfig({ withCache: true });
    const uploadToS3 = storage.s3.enabled && storage.locations.thumbnails === StorageBackend.S3;

    if (!uploadToS3) {
      return;
    }

    const s3Manager = this.s3Manager;
    const localAdapter = s3Manager.getLocalAdapter();

    try {
      const {
        adapter: s3Adapter,
        bucket,
        storageClass,
      } = await s3Manager.getConfigForLocation(StorageLocationType.Thumbnails);

      const s3Key = `users/${ownerId}/persons/${personId}/thumbnail.jpeg`;

      if (!(await localAdapter.exists(thumbnailPath))) {
        this.logger.warn(`Local person thumbnail not found: ${thumbnailPath}`);
        return;
      }

      this.logger.log(`Uploading person thumbnail for ${personId} to S3: ${s3Key}`);

      await this.uploadAndVerifyToS3(s3Adapter, localAdapter, thumbnailPath, s3Key, {
        contentType: 'image/jpeg',
        storageClass,
      });

      try {
        await this.personRepository.update({
          id: personId,
          storageBackend: StorageBackend.S3,
          s3Bucket: bucket,
          s3Key,
        });
      } catch (dbError) {
        await s3Adapter.delete(s3Key).catch(() => {});
        throw dbError;
      }

      if (storage.upload.deleteLocalAfterUpload) {
        await this.storageRepository.unlink(thumbnailPath).catch(() => {});
      }

      this.logger.log(`Successfully uploaded person thumbnail for ${personId}`);
    } catch (error) {
      this.logger.error(`Failed to upload person thumbnail to S3: ${error}`);
      // Don't throw - local file exists as fallback
    }
  }

  private getCrop(dims: { old: ImageDimensions; new: ImageDimensions }, { x1, y1, x2, y2 }: BoundingBox): CropOptions {
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
      left: middleX - newHalfSize,
      top: middleY - newHalfSize,
      width: newHalfSize * 2,
      height: newHalfSize * 2,
    };
  }

  private async generateVideoThumbnails(asset: ThumbnailPathEntity & { originalPath: string }) {
    const { image, ffmpeg } = await this.getConfig({ withCache: true });
    const previewPath = StorageCore.getImagePath(asset, AssetPathType.Preview, image.preview.format);
    const thumbnailPath = StorageCore.getImagePath(asset, AssetPathType.Thumbnail, image.thumbnail.format);
    this.storageCore.ensureFolders(previewPath);

    const { format, audioStreams, videoStreams } = await this.mediaRepository.probe(asset.originalPath);
    const mainVideoStream = this.getMainStream(videoStreams);
    if (!mainVideoStream) {
      throw new Error(`No video streams found for asset ${asset.id}`);
    }
    const mainAudioStream = this.getMainStream(audioStreams);

    const previewConfig = ThumbnailConfig.create({ ...ffmpeg, targetResolution: image.preview.size.toString() });
    const thumbnailConfig = ThumbnailConfig.create({ ...ffmpeg, targetResolution: image.thumbnail.size.toString() });
    const previewOptions = previewConfig.getCommand(TranscodeTarget.Video, mainVideoStream, mainAudioStream, format);
    const thumbnailOptions = thumbnailConfig.getCommand(
      TranscodeTarget.Video,
      mainVideoStream,
      mainAudioStream,
      format,
    );

    await this.mediaRepository.transcode(asset.originalPath, previewPath, previewOptions);
    await this.mediaRepository.transcode(asset.originalPath, thumbnailPath, thumbnailOptions);

    const thumbhash = await this.mediaRepository.generateThumbhash(previewPath, {
      colorspace: image.colorspace,
      processInvalidImages: process.env.IMMICH_PROCESS_INVALID_IMAGES === 'true',
    });

    return { previewPath, thumbnailPath, thumbhash };
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
  async handleVideoConversion(data: JobOf<JobName.AssetEncodeVideo>): Promise<JobStatus> {
    const { id } = data;
    const asset = await this.assetJobRepository.getForVideoConversion(id);
    if (!asset) {
      this.logger.error(`Video conversion failed for ${id}: asset not found in database`);
      return JobStatus.Failed;
    }

    // Skip if already encoded to S3
    if (asset.s3KeyEncodedVideo) {
      this.logger.verbose(`Asset ${asset.id} already has S3-encoded video, skipping`);
      return JobStatus.Skipped;
    }

    // Determine the local file path to use for processing
    // Priority: 1) localPath from job data (fresh upload), 2) download from S3 if needed
    let filePath = data.localPath;
    let downloadedFromS3 = false;

    if (filePath && (await this.storageRepository.checkFileExists(filePath))) {
      // Use localPath from job data (temp file from upload)
      this.logger.debug(`Using localPath from job data for video conversion: ${filePath}`);
    } else {
      // No localPath or file doesn't exist - download from S3 or use local asset path
      const result = await this.ensureLocalFile(
        id,
        asset.ownerId,
        asset.originalPath,
        asset.storageBackend,
        asset.s3Bucket,
        asset.s3Key,
        'video conversion',
      );
      filePath = result.localPath;
      downloadedFromS3 = result.downloadedFromS3;
    }

    this.logger.debug(`Using local file for video encoding: ${filePath}`);
    const input = filePath;

    const output = StorageCore.getEncodedVideoPath(asset);
    this.storageCore.ensureFolders(output);

    const { videoStreams, audioStreams, format } = await this.mediaRepository.probe(input, {
      countFrames: this.logger.isLevelEnabled(LogLevel.Debug), // makes frame count more reliable for progress logs
    });
    const videoStream = this.getMainStream(videoStreams);
    const audioStream = this.getMainStream(audioStreams);
    if (!videoStream || !format.formatName) {
      return JobStatus.Failed;
    }

    if (!videoStream.height || !videoStream.width) {
      this.logger.warn(`Skipped transcoding for asset ${asset.id}: no video streams found`);
      return JobStatus.Failed;
    }

    let { ffmpeg } = await this.getConfig({ withCache: true });
    const target = this.getTranscodeTarget(ffmpeg, videoStream, audioStream);
    if (target === TranscodeTarget.None && !this.isRemuxRequired(ffmpeg, format)) {
      if (asset.encodedVideoPath) {
        this.logger.log(`Transcoded video exists for asset ${asset.id}, but is no longer required. Deleting...`);
        await this.jobRepository.queue({ name: JobName.FileDelete, data: { files: [asset.encodedVideoPath] } });
        await this.assetRepository.update({ id: asset.id, encodedVideoPath: null });
      } else {
        this.logger.verbose(`Asset ${asset.id} does not require transcoding based on current policy, skipping`);
      }

      // Mark video encoding as complete (skipped) for encryption coordination
      await this.assetRepository.upsertJobStatus({ assetId: asset.id, videoEncodedAt: new Date() });

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

      let partialFallbackSuccess = false;
      if (ffmpeg.accelDecode) {
        try {
          this.logger.error(`Retrying with ${ffmpeg.accel.toUpperCase()}-accelerated encoding and software decoding`);
          ffmpeg = { ...ffmpeg, accelDecode: false };
          const command = BaseConfig.create(ffmpeg, this.videoInterfaces).getCommand(target, videoStream, audioStream);
          await this.mediaRepository.transcode(input, output, command);
          partialFallbackSuccess = true;
        } catch (error: any) {
          this.logger.error(`Error occurred during transcoding: ${error.message}`);
        }
      }

      if (!partialFallbackSuccess) {
        this.logger.error(`Retrying with ${ffmpeg.accel.toUpperCase()} acceleration disabled`);
        ffmpeg = { ...ffmpeg, accel: TranscodeHardwareAcceleration.Disabled };
        const command = BaseConfig.create(ffmpeg, this.videoInterfaces).getCommand(target, videoStream, audioStream);
        await this.mediaRepository.transcode(input, output, command);
      }
    }

    this.logger.log(`Successfully encoded ${asset.id}`);

    await this.assetRepository.update({ id: asset.id, encodedVideoPath: output });

    // Track video encoding completion for encryption coordination
    await this.assetRepository.upsertJobStatus({ assetId: asset.id, videoEncodedAt: new Date() });

    // Upload encoded video to S3 inline (not queued) to ensure it's uploaded before worker stops
    await this.uploadEncodedVideoToS3Inline(asset.id, asset.ownerId, output);

    // Clean up downloaded S3 file if we downloaded it
    // Note: Don't cleanup localPath from job data - that's handled by job.service after all jobs complete
    await this.cleanupDownloadedFile(id, filePath, downloadedFromS3);

    return JobStatus.Success;
  }

  /**
   * Upload encoded video directly to S3 inline instead of queueing.
   */
  private async uploadEncodedVideoToS3Inline(
    assetId: string,
    ownerId: string,
    encodedVideoPath: string,
  ): Promise<void> {
    const s3Manager = this.s3Manager;
    const { storage } = await this.getConfig({ withCache: true });

    // Check if S3 is enabled for encoded videos
    if (!(await s3Manager.isS3EnabledForLocation(StorageLocationType.EncodedVideos))) {
      this.logger.debug(`S3 upload skipped for encoded video ${assetId}: S3 not enabled for encoded videos`);
      return;
    }

    const localAdapter = s3Manager.getLocalAdapter();

    try {
      const {
        adapter: s3Adapter,
        bucket,
        storageClass,
      } = await s3Manager.getConfigForLocation(StorageLocationType.EncodedVideos);
      const s3Key = `users/${ownerId}/${assetId}/encoded.mp4`;

      const localFileExists = await localAdapter.exists(encodedVideoPath);
      if (!localFileExists) {
        this.logger.warn(`Local encoded video not found for asset ${assetId}: ${encodedVideoPath}`);
        return;
      }

      this.logger.log(`Uploading encoded video inline for asset ${assetId} to S3: ${s3Key}`);
      const readStream = createReadStream(encodedVideoPath);
      await s3Adapter.writeStreamAsync(s3Key, readStream, {
        contentType: 'video/mp4',
        storageClass,
      });

      // Update database with S3 key and bucket
      await this.assetRepository.update({
        id: assetId,
        s3KeyEncodedVideo: s3Key,
        s3BucketEncodedVideo: bucket,
      });

      // Delete local encoded video after successful upload if configured
      if (storage.upload.deleteLocalAfterUpload) {
        try {
          await this.storageRepository.unlink(encodedVideoPath);
          await this.assetRepository.update({
            id: assetId,
            encodedVideoPath: null,
          });
          this.logger.debug(`Deleted local encoded video for asset ${assetId}`);
        } catch (error) {
          this.logger.warn(`Failed to delete local encoded video: ${error}`);
        }
      }

      this.logger.log(`Successfully uploaded encoded video inline for asset ${assetId} to S3`);
    } catch (error) {
      this.logger.error(`Failed to upload encoded video inline to S3 for asset ${assetId}: ${error}`);
      // Don't fail the job - video is encoded locally and can be re-uploaded later
    }
  }

  private getMainStream<T extends VideoStreamInfo | AudioStreamInfo>(streams: T[]): T {
    return streams
      .filter((stream) => stream.codecName !== 'unknown')
      .toSorted((stream1, stream2) => stream2.bitrate - stream1.bitrate)[0];
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
    const scalingEnabled = ffmpegConfig.targetResolution !== 'original';
    const targetRes = Number.parseInt(ffmpegConfig.targetResolution);
    const isLargerThanTargetRes = scalingEnabled && Math.min(stream.height, stream.width) > targetRes;
    const isLargerThanTargetBitrate = stream.bitrate > this.parseBitrateToBps(ffmpegConfig.maxBitrate);

    const isTargetVideoCodec = ffmpegConfig.acceptedVideoCodecs.includes(stream.codecName as VideoCodec);
    // Accept both 8-bit (yuv420p) and 10-bit (yuv420p10le/yuv420p10be) 4:2:0 formats
    const isAcceptedPixelFormat = stream.pixelFormat.startsWith('yuv420p');
    const shouldTonemap = stream.isHDR && ffmpegConfig.tonemap !== ToneMapping.Disabled;
    const isRequired = !isTargetVideoCodec || !isAcceptedPixelFormat || shouldTonemap;

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

    let name: VideoContainer;
    if (formatLongName === 'QuickTime / MOV') {
      name = VideoContainer.Mov;
    } else if (formatName === 'matroska,webm') {
      name = VideoContainer.Matroska;
    } else {
      name = formatName as VideoContainer;
    }

    return name !== VideoContainer.Mp4 && !ffmpegConfig.acceptedContainers.includes(name);
  }

  isSRGB({ colorspace, profileDescription, bitsPerSample }: Exif): boolean {
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

  private async shouldUseExtractedImage(extractedPathOrBuffer: string | Buffer, targetSize: number) {
    const { width, height } = await this.mediaRepository.getImageDimensions(extractedPathOrBuffer);
    const extractedSize = Math.min(width, height);
    return extractedSize >= targetSize;
  }

  private async getDevices() {
    try {
      return await this.storageRepository.readdir('/dev/dri');
    } catch {
      this.logger.debug('No devices found in /dev/dri.');
      return [];
    }
  }

  private async hasMaliOpenCL() {
    try {
      const [maliIcdStat, maliDeviceStat] = await Promise.all([
        this.storageRepository.stat('/etc/OpenCL/vendors/mali.icd'),
        this.storageRepository.stat('/dev/mali0'),
      ]);
      return maliIcdStat.isFile() && maliDeviceStat.isCharacterDevice();
    } catch {
      this.logger.debug('OpenCL not available for transcoding, so RKMPP acceleration will use CPU tonemapping');
      return false;
    }
  }
}
