import { Injectable } from '@nestjs/common';
import { ContainerDirectoryItem, ExifDateTime, Tags } from 'exiftool-vendored';
import { Insertable } from 'kysely';
import _ from 'lodash';
import { Duration } from 'luxon';
import { Stats } from 'node:fs';
import { constants } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { Asset, AssetFace } from 'src/database';
import { OnEvent, OnJob } from 'src/decorators';
import {
  AssetType,
  AssetVisibility,
  DatabaseLock,
  ExifOrientation,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  SourceType,
} from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { ReverseGeocodeResult } from 'src/repositories/map.repository';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { AssetFaceTable } from 'src/schema/tables/asset-face.table';
import { PersonTable } from 'src/schema/tables/person.table';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { isAssetChecksumConstraint } from 'src/utils/database';
import { isFaceImportEnabled } from 'src/utils/misc';
import { upsertTags } from 'src/utils/tag';

/** look for a date from these tags (in order) */
const EXIF_DATE_TAGS: Array<keyof ImmichTags> = [
  'SubSecDateTimeOriginal',
  'SubSecCreateDate',
  'SubSecMediaCreateDate',
  'DateTimeOriginal',
  'CreationDate',
  'CreateDate',
  'MediaCreateDate',
  'DateTimeCreated',
  'GPSDateTime',
  'DateTimeUTC',
  'SonyDateTime2',
  // Undocumented, non-standard tag from insta360 in xmp.GPano namespace
  'SourceImageCreateTime' as keyof ImmichTags,
];

export function firstDateTime(tags: ImmichTags) {
  for (const tag of EXIF_DATE_TAGS) {
    const tagValue = tags?.[tag];

    if (tagValue instanceof ExifDateTime) {
      return {
        tag,
        dateTime: tagValue,
      };
    }

    if (typeof tagValue !== 'string') {
      continue;
    }

    const exifDateTime = ExifDateTime.fromEXIF(tagValue);
    if (exifDateTime) {
      return {
        tag,
        dateTime: exifDateTime,
      };
    }
  }
}

const validate = <T>(value: T): NonNullable<T> | null => {
  // handle lists of numbers
  if (Array.isArray(value)) {
    value = value[0];
  }

  if (typeof value === 'string') {
    // string means a failure to parse a number, throw out result
    return null;
  }

  if (typeof value === 'number' && (Number.isNaN(value) || !Number.isFinite(value))) {
    return null;
  }

  return value ?? null;
};

const validateRange = (value: number | undefined, min: number, max: number): NonNullable<number> | null => {
  // reutilizes the validate function
  const val = validate(value);

  // check if the value is within the range
  if (val == null || val < min || val > max) {
    return null;
  }

  return Math.round(val);
};

const getLensModel = (exifTags: ImmichTags): string | null => {
  const lensModel = String(
    exifTags.LensID ?? exifTags.LensType ?? exifTags.LensSpec ?? exifTags.LensModel ?? '',
  ).trim();
  if (lensModel === '----') {
    return null;
  }
  if (lensModel.startsWith('Unknown')) {
    return null;
  }
  return lensModel || null;
};

type ImmichTagsWithFaces = ImmichTags & { RegionInfo: NonNullable<ImmichTags['RegionInfo']> };

type Dates = {
  dateTimeOriginal: Date;
  localDateTime: Date;
};

@Injectable()
export class MetadataService extends BaseService {
  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  async onBootstrap() {
    this.logger.log('Bootstrapping metadata service');
    await this.init();
  }

  @OnEvent({ name: 'AppShutdown' })
  async onShutdown() {
    await this.metadataRepository.teardown();
  }

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  onConfigInit({ newConfig }: ArgOf<'ConfigInit'>) {
    this.metadataRepository.setMaxConcurrency(newConfig.job.metadataExtraction.concurrency);
  }

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Microservices], server: true })
  onConfigUpdate({ newConfig }: ArgOf<'ConfigUpdate'>) {
    this.metadataRepository.setMaxConcurrency(newConfig.job.metadataExtraction.concurrency);
  }

  private async init() {
    this.logger.log('Initializing metadata service');

    try {
      await this.jobRepository.pause(QueueName.MetadataExtraction);
      await this.databaseRepository.withLock(DatabaseLock.GeodataImport, () => this.mapRepository.init());
      await this.jobRepository.resume(QueueName.MetadataExtraction);

      this.logger.log(`Initialized local reverse geocoder`);
    } catch (error: Error | any) {
      this.logger.error(`Unable to initialize reverse geocoding: ${error}`, error?.stack);
      throw new Error(`Metadata service init failed`);
    }
  }

  private async linkLivePhotos(
    asset: { id: string; type: AssetType; ownerId: string; libraryId: string | null },
    exifInfo: Insertable<AssetExifTable>,
  ): Promise<void> {
    if (!exifInfo.livePhotoCID) {
      return;
    }

    const otherType = asset.type === AssetType.Video ? AssetType.Image : AssetType.Video;
    const match = await this.assetRepository.findLivePhotoMatch({
      livePhotoCID: exifInfo.livePhotoCID,
      ownerId: asset.ownerId,
      libraryId: asset.libraryId,
      otherAssetId: asset.id,
      type: otherType,
    });

    if (!match) {
      return;
    }

    const [photoAsset, motionAsset] = asset.type === AssetType.Image ? [asset, match] : [match, asset];
    await Promise.all([
      this.assetRepository.update({ id: photoAsset.id, livePhotoVideoId: motionAsset.id }),
      this.assetRepository.update({ id: motionAsset.id, visibility: AssetVisibility.Hidden }),
      this.albumRepository.removeAssetsFromAll([motionAsset.id]),
    ]);

    await this.eventRepository.emit('AssetHide', { assetId: motionAsset.id, userId: motionAsset.ownerId });
  }

  @OnJob({ name: JobName.AssetExtractMetadataQueueAll, queue: QueueName.MetadataExtraction })
  async handleQueueMetadataExtraction(job: JobOf<JobName.AssetExtractMetadataQueueAll>): Promise<JobStatus> {
    const { force } = job;

    let queue: { name: JobName.AssetExtractMetadata; data: { id: string } }[] = [];
    for await (const asset of this.assetJobRepository.streamForMetadataExtraction(force)) {
      queue.push({ name: JobName.AssetExtractMetadata, data: { id: asset.id } });

      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetExtractMetadata, queue: QueueName.MetadataExtraction })
  async handleMetadataExtraction(data: JobOf<JobName.AssetExtractMetadata>) {
    const [{ metadata, reverseGeocoding }, asset] = await Promise.all([
      this.getConfig({ withCache: true }),
      this.assetJobRepository.getForMetadataExtraction(data.id),
    ]);

    if (!asset) {
      return;
    }

    const [exifTags, stats] = await Promise.all([
      this.getExifTags(asset),
      this.storageRepository.stat(asset.originalPath),
    ]);
    this.logger.verbose('Exif Tags', exifTags);

    const dates = this.getDates(asset, exifTags, stats);

    const { width, height } = this.getImageDimensions(exifTags);
    let geo: ReverseGeocodeResult = { country: null, state: null, city: null },
      latitude: number | null = null,
      longitude: number | null = null;
    if (this.hasGeo(exifTags)) {
      latitude = exifTags.GPSLatitude;
      longitude = exifTags.GPSLongitude;
      if (reverseGeocoding.enabled) {
        geo = await this.mapRepository.reverseGeocode({ latitude, longitude });
      }
    }

    const exifData: Insertable<AssetExifTable> = {
      assetId: asset.id,

      // dates
      dateTimeOriginal: dates.dateTimeOriginal,
      modifyDate: stats.mtime,
      timeZone: dates.timeZone,

      // gps
      latitude,
      longitude,
      country: geo.country,
      state: geo.state,
      city: geo.city,

      // image/file
      fileSizeInByte: stats.size,
      exifImageHeight: validate(height),
      exifImageWidth: validate(width),
      orientation: validate(exifTags.Orientation)?.toString() ?? null,
      projectionType: exifTags.ProjectionType ? String(exifTags.ProjectionType).toUpperCase() : null,
      bitsPerSample: this.getBitsPerSample(exifTags),
      colorspace: exifTags.ColorSpace ?? null,

      // camera
      make: exifTags.Make ?? exifTags?.Device?.Manufacturer ?? exifTags.AndroidMake ?? null,
      model: exifTags.Model ?? exifTags?.Device?.ModelName ?? exifTags.AndroidModel ?? null,
      fps: validate(Number.parseFloat(exifTags.VideoFrameRate!)),
      iso: validate(exifTags.ISO) as number,
      exposureTime: exifTags.ExposureTime ?? null,
      lensModel: getLensModel(exifTags),
      fNumber: validate(exifTags.FNumber),
      focalLength: validate(exifTags.FocalLength),

      // comments
      description: String(exifTags.ImageDescription || exifTags.Description || '').trim(),
      profileDescription: exifTags.ProfileDescription || null,
      rating: validateRange(exifTags.Rating, -1, 5),

      // grouping
      livePhotoCID: (exifTags.ContentIdentifier || exifTags.MediaGroupUUID) ?? null,
      autoStackId: this.getAutoStackId(exifTags),
    };

    const promises: Promise<unknown>[] = [
      this.assetRepository.upsertExif(exifData),
      this.assetRepository.update({
        id: asset.id,
        duration: exifTags.Duration?.toString() ?? null,
        localDateTime: dates.localDateTime,
        fileCreatedAt: dates.dateTimeOriginal ?? undefined,
        fileModifiedAt: stats.mtime,
      }),
      this.applyTagList(asset, exifTags),
    ];

    if (this.isMotionPhoto(asset, exifTags)) {
      promises.push(this.applyMotionPhotos(asset, exifTags, dates, stats));
    }

    if (isFaceImportEnabled(metadata) && this.hasTaggedFaces(exifTags)) {
      promises.push(this.applyTaggedFaces(asset, exifTags));
    }

    await Promise.all(promises);
    if (exifData.livePhotoCID) {
      await this.linkLivePhotos(asset, exifData);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });

    await this.eventRepository.emit('AssetMetadataExtracted', {
      assetId: asset.id,
      userId: asset.ownerId,
      source: data.source,
    });
  }

  @OnJob({ name: JobName.SidecarQueueAll, queue: QueueName.Sidecar })
  async handleQueueSidecar({ force }: JobOf<JobName.SidecarQueueAll>): Promise<JobStatus> {
    let jobs: JobItem[] = [];
    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

    const assets = this.assetJobRepository.streamForSidecar(force);
    for await (const asset of assets) {
      jobs.push({ name: JobName.SidecarCheck, data: { id: asset.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SidecarCheck, queue: QueueName.Sidecar })
  async handleSidecarCheck({ id }: JobOf<JobName.SidecarCheck>): Promise<JobStatus | undefined> {
    const asset = await this.assetJobRepository.getForSidecarCheckJob(id);
    if (!asset) {
      return;
    }

    let sidecarPath = null;
    for (const candidate of this.getSidecarCandidates(asset)) {
      const exists = await this.storageRepository.checkFileExists(candidate, constants.R_OK);
      if (!exists) {
        continue;
      }

      sidecarPath = candidate;
      break;
    }

    const isChanged = sidecarPath !== asset.sidecarPath;

    this.logger.debug(
      `Sidecar check found old=${asset.sidecarPath}, new=${sidecarPath} will ${isChanged ? 'update' : 'do nothing for'}  asset ${asset.id}: ${asset.originalPath}`,
    );

    if (!isChanged) {
      return JobStatus.Skipped;
    }

    await this.assetRepository.update({ id: asset.id, sidecarPath });

    return JobStatus.Success;
  }

  @OnEvent({ name: 'AssetTag' })
  async handleTagAsset({ assetId }: ArgOf<'AssetTag'>) {
    await this.jobRepository.queue({ name: JobName.SidecarWrite, data: { id: assetId, tags: true } });
  }

  @OnEvent({ name: 'AssetUntag' })
  async handleUntagAsset({ assetId }: ArgOf<'AssetUntag'>) {
    await this.jobRepository.queue({ name: JobName.SidecarWrite, data: { id: assetId, tags: true } });
  }

  @OnJob({ name: JobName.SidecarWrite, queue: QueueName.Sidecar })
  async handleSidecarWrite(job: JobOf<JobName.SidecarWrite>): Promise<JobStatus> {
    const { id, description, dateTimeOriginal, latitude, longitude, rating, tags } = job;
    const asset = await this.assetJobRepository.getForSidecarWriteJob(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    const tagsList = (asset.tags || []).map((tag) => tag.value);

    const sidecarPath = asset.sidecarPath || `${asset.originalPath}.xmp`;
    const exif = _.omitBy(
      <Tags>{
        Description: description,
        ImageDescription: description,
        DateTimeOriginal: dateTimeOriginal,
        GPSLatitude: latitude,
        GPSLongitude: longitude,
        Rating: rating,
        TagsList: tags ? tagsList : undefined,
      },
      _.isUndefined,
    );

    if (Object.keys(exif).length === 0) {
      return JobStatus.Skipped;
    }

    await this.metadataRepository.writeTags(sidecarPath, exif);

    if (!asset.sidecarPath) {
      await this.assetRepository.update({ id, sidecarPath });
    }

    return JobStatus.Success;
  }

  private getSidecarCandidates({ sidecarPath, originalPath }: { sidecarPath: string | null; originalPath: string }) {
    const candidates: string[] = [];

    if (sidecarPath) {
      candidates.push(sidecarPath);
    }

    const assetPath = parse(originalPath);

    candidates.push(
      // IMG_123.jpg.xmp
      `${originalPath}.xmp`,
      // IMG_123.xmp
      `${join(assetPath.dir, assetPath.name)}.xmp`,
    );

    return candidates;
  }

  private getImageDimensions(exifTags: ImmichTags): { width?: number; height?: number } {
    /*
     * The "true" values for width and height are a bit hidden, depending on the camera model and file format.
     * For RAW images in the CR2 or RAF format, the "ImageSize" value seems to be correct,
     * but ImageWidth and ImageHeight are not correct (they contain the dimensions of the preview image).
     */
    let [width, height] = exifTags.ImageSize?.split('x').map((dim) => Number.parseInt(dim) || undefined) || [];
    if (!width || !height) {
      [width, height] = [exifTags.ImageWidth, exifTags.ImageHeight];
    }
    return { width, height };
  }

  private getExifTags(asset: {
    originalPath: string;
    sidecarPath: string | null;
    type: AssetType;
  }): Promise<ImmichTags> {
    if (!asset.sidecarPath && asset.type === AssetType.Image) {
      return this.metadataRepository.readTags(asset.originalPath);
    }

    return this.mergeExifTags(asset);
  }

  private async mergeExifTags(asset: {
    originalPath: string;
    sidecarPath: string | null;
    type: AssetType;
  }): Promise<ImmichTags> {
    const [mediaTags, sidecarTags, videoTags] = await Promise.all([
      this.metadataRepository.readTags(asset.originalPath),
      asset.sidecarPath ? this.metadataRepository.readTags(asset.sidecarPath) : null,
      asset.type === AssetType.Video ? this.getVideoTags(asset.originalPath) : null,
    ]);

    // prefer dates from sidecar tags
    if (sidecarTags) {
      const result = firstDateTime(sidecarTags);
      const sidecarDate = result?.dateTime;
      if (sidecarDate) {
        for (const tag of EXIF_DATE_TAGS) {
          delete mediaTags[tag];
        }
      }
    }

    // prefer duration from video tags
    delete mediaTags.Duration;
    delete sidecarTags?.Duration;

    return { ...mediaTags, ...videoTags, ...sidecarTags };
  }

  private getTagList(exifTags: ImmichTags): string[] {
    let tags: string[];
    if (exifTags.TagsList) {
      tags = exifTags.TagsList.map(String);
    } else if (exifTags.HierarchicalSubject) {
      tags = exifTags.HierarchicalSubject.map((tag) =>
        // convert | to /
        typeof tag === 'number'
          ? String(tag)
          : tag
              .split('|')
              .map((tag) => tag.replaceAll('/', '|'))
              .join('/'),
      );
    } else if (exifTags.Keywords) {
      let keywords = exifTags.Keywords;
      if (!Array.isArray(keywords)) {
        keywords = [keywords];
      }
      tags = keywords.map(String);
    } else {
      tags = [];
    }
    return tags;
  }

  private async applyTagList(asset: { id: string; ownerId: string }, exifTags: ImmichTags) {
    const tags = this.getTagList(exifTags);
    const results = await upsertTags(this.tagRepository, { userId: asset.ownerId, tags });
    await this.tagRepository.replaceAssetTags(
      asset.id,
      results.map((tag) => tag.id),
    );
  }

  private isMotionPhoto(asset: { type: AssetType }, tags: ImmichTags): boolean {
    return asset.type === AssetType.Image && !!(tags.MotionPhoto || tags.MicroVideo);
  }

  private async applyMotionPhotos(asset: Asset, tags: ImmichTags, dates: Dates, stats: Stats) {
    const isMotionPhoto = tags.MotionPhoto;
    const isMicroVideo = tags.MicroVideo;
    const videoOffset = tags.MicroVideoOffset;
    const hasMotionPhotoVideo = tags.MotionPhotoVideo;
    const hasEmbeddedVideoFile = tags.EmbeddedVideoType === 'MotionPhoto_Data' && tags.EmbeddedVideoFile;
    const directory = Array.isArray(tags.ContainerDirectory)
      ? (tags.ContainerDirectory as ContainerDirectoryItem[])
      : null;

    let length = 0;
    let padding = 0;

    if (isMotionPhoto && directory) {
      for (const entry of directory) {
        if (entry?.Item?.Semantic === 'MotionPhoto') {
          length = entry.Item.Length ?? 0;
          padding = entry.Item.Padding ?? 0;
          break;
        }
      }
    }

    if (isMicroVideo && typeof videoOffset === 'number') {
      length = videoOffset;
    }

    if (!length && !hasEmbeddedVideoFile && !hasMotionPhotoVideo) {
      return;
    }

    this.logger.debug(`Starting motion photo video extraction for asset ${asset.id}: ${asset.originalPath}`);

    try {
      const position = stats.size - length - padding;
      let video: Buffer;
      // Samsung MotionPhoto video extraction
      //     HEIC-encoded
      if (hasMotionPhotoVideo) {
        video = await this.metadataRepository.extractBinaryTag(asset.originalPath, 'MotionPhotoVideo');
      }
      //     JPEG-encoded; HEIC also contains these tags, so this conditional must come second
      else if (hasEmbeddedVideoFile) {
        video = await this.metadataRepository.extractBinaryTag(asset.originalPath, 'EmbeddedVideoFile');
      }
      // Default video extraction
      else {
        video = await this.storageRepository.readFile(asset.originalPath, {
          buffer: Buffer.alloc(length),
          position,
          length,
        });
      }
      const checksum = this.cryptoRepository.hashSha1(video);
      const checksumQuery = { ownerId: asset.ownerId, libraryId: asset.libraryId ?? undefined, checksum };

      let motionAsset = await this.assetRepository.getByChecksum(checksumQuery);
      let isNewMotionAsset = false;

      if (!motionAsset) {
        try {
          const motionAssetId = this.cryptoRepository.randomUUID();
          motionAsset = await this.assetRepository.create({
            id: motionAssetId,
            libraryId: asset.libraryId,
            type: AssetType.Video,
            fileCreatedAt: dates.dateTimeOriginal,
            fileModifiedAt: stats.mtime,
            localDateTime: dates.localDateTime,
            checksum,
            ownerId: asset.ownerId,
            originalPath: StorageCore.getAndroidMotionPath(asset, motionAssetId),
            originalFileName: `${parse(asset.originalFileName).name}.mp4`,
            visibility: AssetVisibility.Hidden,
            deviceAssetId: 'NONE',
            deviceId: 'NONE',
          });

          isNewMotionAsset = true;

          if (!asset.isExternal) {
            await this.userRepository.updateUsage(asset.ownerId, video.byteLength);
          }
        } catch (error) {
          if (!isAssetChecksumConstraint(error)) {
            throw error;
          }

          motionAsset = await this.assetRepository.getByChecksum(checksumQuery);
          if (!motionAsset) {
            this.logger.warn(`Unable to find existing motion video asset for ${asset.id}: ${asset.originalPath}`);
            return;
          }
        }
      }

      if (!isNewMotionAsset) {
        this.logger.debugFn(() => {
          const base64Checksum = checksum.toString('base64');
          return `Motion asset with checksum ${base64Checksum} already exists for asset ${asset.id}: ${asset.originalPath}`;
        });
      }

      // Hide the motion photo video asset if it's not already hidden to prepare for linking
      if (motionAsset.visibility === AssetVisibility.Timeline) {
        await this.assetRepository.update({
          id: motionAsset.id,
          visibility: AssetVisibility.Hidden,
        });
        this.logger.log(`Hid unlinked motion photo video asset (${motionAsset.id})`);
      }

      if (asset.livePhotoVideoId !== motionAsset.id) {
        await this.assetRepository.update({ id: asset.id, livePhotoVideoId: motionAsset.id });

        // If the asset already had an associated livePhotoVideo, delete it, because
        // its checksum doesn't match the checksum of the motionAsset we just extracted
        // (if it did, getByChecksum() would've returned a motionAsset with the same ID as livePhotoVideoId)
        // note asset.livePhotoVideoId is not motionAsset.id yet
        if (asset.livePhotoVideoId) {
          await this.jobRepository.queue({
            name: JobName.AssetDelete,
            data: { id: asset.livePhotoVideoId, deleteOnDisk: true },
          });
          this.logger.log(`Removed old motion photo video asset (${asset.livePhotoVideoId})`);
        }
      }

      // write extracted motion video to disk, especially if the encoded-video folder has been deleted
      const existsOnDisk = await this.storageRepository.checkFileExists(motionAsset.originalPath);
      if (!existsOnDisk) {
        this.storageCore.ensureFolders(motionAsset.originalPath);
        await this.storageRepository.createFile(motionAsset.originalPath, video);
        this.logger.log(`Wrote motion photo video to ${motionAsset.originalPath}`);

        await this.handleMetadataExtraction({ id: motionAsset.id });
        await this.jobRepository.queue({ name: JobName.AssetEncodeVideo, data: { id: motionAsset.id } });
      }

      this.logger.debug(`Finished motion photo video extraction for asset ${asset.id}: ${asset.originalPath}`);
    } catch (error: Error | any) {
      this.logger.error(
        `Failed to extract motion video for ${asset.id}: ${asset.originalPath}: ${error}`,
        error?.stack,
      );
    }
  }

  private hasTaggedFaces(tags: ImmichTags): tags is ImmichTagsWithFaces {
    return (
      tags.RegionInfo !== undefined && tags.RegionInfo.AppliedToDimensions && tags.RegionInfo.RegionList.length > 0
    );
  }

  private orientRegionInfo(
    regionInfo: ImmichTagsWithFaces['RegionInfo'],
    orientation: ExifOrientation | undefined,
  ): ImmichTagsWithFaces['RegionInfo'] {
    // skip default Orientation
    if (orientation === undefined || orientation === ExifOrientation.Horizontal) {
      return regionInfo;
    }

    const isSidewards = [
      ExifOrientation.MirrorHorizontalRotate270CW,
      ExifOrientation.Rotate90CW,
      ExifOrientation.MirrorHorizontalRotate90CW,
      ExifOrientation.Rotate270CW,
    ].includes(orientation);

    // swap image dimensions in AppliedToDimensions if orientation is sidewards
    const adjustedAppliedToDimensions = isSidewards
      ? {
          ...regionInfo.AppliedToDimensions,
          W: regionInfo.AppliedToDimensions.H,
          H: regionInfo.AppliedToDimensions.W,
        }
      : regionInfo.AppliedToDimensions;

    // update area coordinates and dimensions in RegionList assuming "normalized" unit as per MWG guidelines
    const adjustedRegionList = regionInfo.RegionList.map((region) => {
      let { X, Y, W, H } = region.Area;
      switch (orientation) {
        case ExifOrientation.MirrorHorizontal: {
          X = 1 - X;
          break;
        }
        case ExifOrientation.Rotate180: {
          [X, Y] = [1 - X, 1 - Y];
          break;
        }
        case ExifOrientation.MirrorVertical: {
          Y = 1 - Y;
          break;
        }
        case ExifOrientation.MirrorHorizontalRotate270CW: {
          [X, Y] = [Y, X];
          break;
        }
        case ExifOrientation.Rotate90CW: {
          [X, Y] = [1 - Y, X];
          break;
        }
        case ExifOrientation.MirrorHorizontalRotate90CW: {
          [X, Y] = [1 - Y, 1 - X];
          break;
        }
        case ExifOrientation.Rotate270CW: {
          [X, Y] = [Y, 1 - X];
          break;
        }
      }
      if (isSidewards) {
        [W, H] = [H, W];
      }
      return {
        ...region,
        Area: { ...region.Area, X, Y, W, H },
      };
    });

    return {
      ...regionInfo,
      AppliedToDimensions: adjustedAppliedToDimensions,
      RegionList: adjustedRegionList,
    };
  }

  private async applyTaggedFaces(
    asset: { id: string; ownerId: string; faces: AssetFace[]; originalPath: string },
    tags: ImmichTags,
  ) {
    if (!tags.RegionInfo?.AppliedToDimensions || tags.RegionInfo.RegionList.length === 0) {
      return;
    }

    const facesToAdd: (Insertable<AssetFaceTable> & { assetId: string })[] = [];
    const existingNames = await this.personRepository.getDistinctNames(asset.ownerId, { withHidden: true });
    const existingNameMap = new Map(existingNames.map(({ id, name }) => [name.toLowerCase(), id]));
    const missing: (Insertable<PersonTable> & { ownerId: string })[] = [];
    const missingWithFaceAsset: { id: string; ownerId: string; faceAssetId: string }[] = [];

    const adjustedRegionInfo = this.orientRegionInfo(tags.RegionInfo, tags.Orientation);
    const imageWidth = adjustedRegionInfo.AppliedToDimensions.W;
    const imageHeight = adjustedRegionInfo.AppliedToDimensions.H;

    for (const region of adjustedRegionInfo.RegionList) {
      if (!region.Name) {
        continue;
      }

      const loweredName = region.Name.toLowerCase();
      const personId = existingNameMap.get(loweredName) || this.cryptoRepository.randomUUID();

      const face = {
        id: this.cryptoRepository.randomUUID(),
        personId,
        assetId: asset.id,
        imageWidth,
        imageHeight,
        boundingBoxX1: Math.floor((region.Area.X - region.Area.W / 2) * imageWidth),
        boundingBoxY1: Math.floor((region.Area.Y - region.Area.H / 2) * imageHeight),
        boundingBoxX2: Math.floor((region.Area.X + region.Area.W / 2) * imageWidth),
        boundingBoxY2: Math.floor((region.Area.Y + region.Area.H / 2) * imageHeight),
        sourceType: SourceType.Exif,
      };

      facesToAdd.push(face);
      if (!existingNameMap.has(loweredName)) {
        missing.push({ id: personId, ownerId: asset.ownerId, name: region.Name });
        missingWithFaceAsset.push({ id: personId, ownerId: asset.ownerId, faceAssetId: face.id });
      }
    }

    if (missing.length > 0) {
      this.logger.debugFn(() => `Creating missing persons: ${missing.map((p) => `${p.name}/${p.id}`)}`);
      const newPersonIds = await this.personRepository.createAll(missing);
      const jobs = newPersonIds.map((id) => ({ name: JobName.PersonGenerateThumbnail, data: { id } }) as const);
      await this.jobRepository.queueAll(jobs);
    }

    const facesToRemove = asset.faces.filter((face) => face.sourceType === SourceType.Exif).map((face) => face.id);
    if (facesToRemove.length > 0) {
      this.logger.debug(`Removing ${facesToRemove.length} faces for asset ${asset.id}: ${asset.originalPath}`);
    }

    if (facesToAdd.length > 0) {
      this.logger.debug(
        `Creating ${facesToAdd.length} faces from metadata for asset ${asset.id}: ${asset.originalPath}`,
      );
    }

    if (facesToRemove.length > 0 || facesToAdd.length > 0) {
      await this.personRepository.refreshFaces(facesToAdd, facesToRemove);
    }

    if (missingWithFaceAsset.length > 0) {
      await this.personRepository.updateAll(missingWithFaceAsset);
    }
  }

  private getDates(
    asset: { id: string; originalPath: string; fileCreatedAt: Date },
    exifTags: ImmichTags,
    stats: Stats,
  ) {
    const result = firstDateTime(exifTags);
    const tag = result?.tag;
    const dateTime = result?.dateTime;
    this.logger.verbose(
      `Date and time is ${dateTime} using exifTag ${tag} for asset ${asset.id}: ${asset.originalPath}`,
    );

    // timezone
    let timeZone = exifTags.tz ?? null;
    if (timeZone == null && dateTime?.rawValue?.endsWith('+00:00')) {
      // exiftool-vendored returns "no timezone" information even though "+00:00" might be set explicitly
      // https://github.com/photostructure/exiftool-vendored.js/issues/203
      timeZone = 'UTC+0';
    }

    if (timeZone) {
      this.logger.verbose(
        `Found timezone ${timeZone} via ${exifTags.tzSource} for asset ${asset.id}: ${asset.originalPath}`,
      );
    } else {
      this.logger.debug(`No timezone information found for asset ${asset.id}: ${asset.originalPath}`);
    }

    let dateTimeOriginal = dateTime?.toDate();
    let localDateTime = dateTime?.toDateTime().setZone('UTC', { keepLocalTime: true }).toJSDate();
    if (!localDateTime || !dateTimeOriginal) {
      // FileCreateDate is not available on linux, likely because exiftool hasn't integrated the statx syscall yet
      // birthtime is not available in Docker on macOS, so it appears as 0
      const earliestDate = new Date(
        Math.min(
          asset.fileCreatedAt.getTime(),
          stats.birthtimeMs ? Math.min(stats.mtimeMs, stats.birthtimeMs) : stats.mtime.getTime(),
        ),
      );
      this.logger.debug(
        `No exif date time found, falling back on ${earliestDate.toISOString()}, earliest of file creation and modification for asset ${asset.id}: ${asset.originalPath}`,
      );
      dateTimeOriginal = localDateTime = earliestDate;
    }

    this.logger.verbose(
      `Found local date time ${localDateTime.toISOString()} for asset ${asset.id}: ${asset.originalPath}`,
    );

    return {
      dateTimeOriginal,
      timeZone,
      localDateTime,
    };
  }

  private hasGeo(tags: ImmichTags): tags is ImmichTags & { GPSLatitude: number; GPSLongitude: number } {
    return (
      tags.GPSLatitude !== undefined &&
      tags.GPSLongitude !== undefined &&
      (tags.GPSLatitude !== 0 || tags.GPSLatitude !== 0)
    );
  }

  private getAutoStackId(tags: ImmichTags | null): string | null {
    if (!tags) {
      return null;
    }
    return tags.BurstID ?? tags.BurstUUID ?? tags.CameraBurstID ?? tags.MediaUniqueID ?? null;
  }

  private getBitsPerSample(tags: ImmichTags): number | null {
    const bitDepthTags = [
      tags.BitsPerSample,
      tags.ComponentBitDepth,
      tags.ImagePixelDepth,
      tags.BitDepth,
      tags.ColorBitDepth,
      // `numericTags` doesn't parse values like '12 12 12'
    ].map((tag) => (typeof tag === 'string' ? Number.parseInt(tag) : tag));

    let bitsPerSample = bitDepthTags.find((tag) => typeof tag === 'number' && !Number.isNaN(tag)) ?? null;
    if (bitsPerSample && bitsPerSample >= 24 && bitsPerSample % 3 === 0) {
      bitsPerSample /= 3; // converts per-pixel bit depth to per-channel
    }

    return bitsPerSample;
  }

  private async getVideoTags(originalPath: string) {
    const { videoStreams, format } = await this.mediaRepository.probe(originalPath);

    const tags: Pick<ImmichTags, 'Duration' | 'Orientation'> = {};

    if (videoStreams[0]) {
      switch (videoStreams[0].rotation) {
        case -90: {
          tags.Orientation = ExifOrientation.Rotate90CW;
          break;
        }
        case 0: {
          tags.Orientation = ExifOrientation.Horizontal;
          break;
        }
        case 90: {
          tags.Orientation = ExifOrientation.Rotate270CW;
          break;
        }
        case 180: {
          tags.Orientation = ExifOrientation.Rotate180;
          break;
        }
      }
    }

    if (format.duration) {
      tags.Duration = Duration.fromObject({ seconds: format.duration }).toFormat('hh:mm:ss.SSS');
    }

    return tags;
  }
}
