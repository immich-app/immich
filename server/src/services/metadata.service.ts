import { Injectable } from '@nestjs/common';
import { ContainerDirectoryItem, ExifDateTime, Maybe, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import { Insertable } from 'kysely';
import _ from 'lodash';
import { Duration } from 'luxon';
import { constants } from 'node:fs/promises';
import path from 'node:path';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { Exif } from 'src/db';
import { OnEvent, OnJob } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import {
  AssetType,
  DatabaseLock,
  ExifOrientation,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  SourceType,
} from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { ReverseGeocodeResult } from 'src/repositories/map.repository';
import { ImmichTags } from 'src/repositories/metadata.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { isFaceImportEnabled } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';
import { upsertTags } from 'src/utils/tag';

/** look for a date from these tags (in order) */
const EXIF_DATE_TAGS: Array<keyof Tags> = [
  'SubSecDateTimeOriginal',
  'DateTimeOriginal',
  'SubSecCreateDate',
  'CreationDate',
  'CreateDate',
  'SubSecMediaCreateDate',
  'MediaCreateDate',
  'DateTimeCreated',
];

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

  return val;
};

type ImmichTagsWithFaces = ImmichTags & { RegionInfo: NonNullable<ImmichTags['RegionInfo']> };

@Injectable()
export class MetadataService extends BaseService {
  @OnEvent({ name: 'app.bootstrap', workers: [ImmichWorker.MICROSERVICES] })
  async onBootstrap() {
    this.logger.log('Bootstrapping metadata service');
    await this.init();
  }

  @OnEvent({ name: 'app.shutdown' })
  async onShutdown() {
    await this.metadataRepository.teardown();
  }

  @OnEvent({ name: 'config.init', workers: [ImmichWorker.MICROSERVICES] })
  onConfigInit({ newConfig }: ArgOf<'config.init'>) {
    this.metadataRepository.setMaxConcurrency(newConfig.job.metadataExtraction.concurrency);
  }

  @OnEvent({ name: 'config.update', workers: [ImmichWorker.MICROSERVICES], server: true })
  onConfigUpdate({ newConfig }: ArgOf<'config.update'>) {
    this.metadataRepository.setMaxConcurrency(newConfig.job.metadataExtraction.concurrency);
  }

  private async init() {
    this.logger.log('Initializing metadata service');

    try {
      await this.jobRepository.pause(QueueName.METADATA_EXTRACTION);
      await this.databaseRepository.withLock(DatabaseLock.GeodataImport, () => this.mapRepository.init());
      await this.jobRepository.resume(QueueName.METADATA_EXTRACTION);

      this.logger.log(`Initialized local reverse geocoder`);
    } catch (error: Error | any) {
      this.logger.error(`Unable to initialize reverse geocoding: ${error}`, error?.stack);
    }
  }

  private async linkLivePhotos(asset: AssetEntity, exifInfo: Insertable<Exif>): Promise<void> {
    if (!exifInfo.livePhotoCID) {
      return;
    }

    const otherType = asset.type === AssetType.VIDEO ? AssetType.IMAGE : AssetType.VIDEO;
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

    const [photoAsset, motionAsset] = asset.type === AssetType.IMAGE ? [asset, match] : [match, asset];
    await Promise.all([
      this.assetRepository.update({ id: photoAsset.id, livePhotoVideoId: motionAsset.id }),
      this.assetRepository.update({ id: motionAsset.id, isVisible: false }),
      this.albumRepository.removeAsset(motionAsset.id),
    ]);

    await this.eventRepository.emit('asset.hide', { assetId: motionAsset.id, userId: motionAsset.ownerId });
  }

  @OnJob({ name: JobName.QUEUE_METADATA_EXTRACTION, queue: QueueName.METADATA_EXTRACTION })
  async handleQueueMetadataExtraction(job: JobOf<JobName.QUEUE_METADATA_EXTRACTION>): Promise<JobStatus> {
    const { force } = job;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.EXIF);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.METADATA_EXTRACTION, queue: QueueName.METADATA_EXTRACTION })
  async handleMetadataExtraction(data: JobOf<JobName.METADATA_EXTRACTION>): Promise<JobStatus> {
    const [{ metadata, reverseGeocoding }, [asset]] = await Promise.all([
      this.getConfig({ withCache: true }),
      this.assetRepository.getByIds([data.id], { faces: { person: false } }),
    ]);

    if (!asset) {
      return JobStatus.FAILED;
    }

    const exifTags = await this.getExifTags(asset);
    if (!exifTags.FileCreateDate || !exifTags.FileModifyDate || exifTags.FileSize === undefined) {
      this.logger.warn(`Missing file creation or modification date for asset ${asset.id}: ${asset.originalPath}`);
      const stat = await this.storageRepository.stat(asset.originalPath);
      exifTags.FileCreateDate = stat.ctime.toISOString();
      exifTags.FileModifyDate = stat.mtime.toISOString();
      exifTags.FileSize = stat.size.toString();
    }

    this.logger.verbose('Exif Tags', exifTags);

    const { dateTimeOriginal, localDateTime, timeZone, modifyDate } = this.getDates(asset, exifTags);

    const { width, height } = this.getImageDimensions(exifTags);
    let geo: ReverseGeocodeResult, latitude: number | null, longitude: number | null;
    if (reverseGeocoding.enabled && this.hasGeo(exifTags)) {
      latitude = exifTags.GPSLatitude;
      longitude = exifTags.GPSLongitude;
      geo = await this.mapRepository.reverseGeocode({ latitude, longitude });
    } else {
      latitude = null;
      longitude = null;
      geo = { country: null, state: null, city: null };
    }

    const exifData: Insertable<Exif> = {
      assetId: asset.id,

      // dates
      dateTimeOriginal,
      modifyDate,
      timeZone,

      // gps
      latitude,
      longitude,
      country: geo.country,
      state: geo.state,
      city: geo.city,

      // image/file
      fileSizeInByte: Number.parseInt(exifTags.FileSize!),
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
      lensModel: exifTags.LensModel ?? null,
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
        localDateTime,
        fileCreatedAt: exifData.dateTimeOriginal ?? undefined,
        fileModifiedAt: exifData.modifyDate ?? undefined,
      }),
      this.applyTagList(asset, exifTags),
    ];

    if (this.isMotionPhoto(asset, exifTags)) {
      promises.push(this.applyMotionPhotos(asset, exifTags, exifData.fileSizeInByte!));
    }

    if (isFaceImportEnabled(metadata) && this.hasTaggedFaces(exifTags)) {
      promises.push(this.applyTaggedFaces(asset, exifTags));
    }

    await Promise.all(promises);
    if (exifData.livePhotoCID) {
      await this.linkLivePhotos(asset, exifData);
    }

    await this.assetRepository.upsertJobStatus({ assetId: asset.id, metadataExtractedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.QUEUE_SIDECAR, queue: QueueName.SIDECAR })
  async handleQueueSidecar(job: JobOf<JobName.QUEUE_SIDECAR>): Promise<JobStatus> {
    const { force } = job;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.SIDECAR);
    });

    for await (const assets of assetPagination) {
      await this.jobRepository.queueAll(
        assets.map((asset) => ({
          name: force ? JobName.SIDECAR_SYNC : JobName.SIDECAR_DISCOVERY,
          data: { id: asset.id },
        })),
      );
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_SYNC, queue: QueueName.SIDECAR })
  handleSidecarSync({ id }: JobOf<JobName.SIDECAR_SYNC>): Promise<JobStatus> {
    return this.processSidecar(id, true);
  }

  @OnJob({ name: JobName.SIDECAR_DISCOVERY, queue: QueueName.SIDECAR })
  handleSidecarDiscovery({ id }: JobOf<JobName.SIDECAR_DISCOVERY>): Promise<JobStatus> {
    return this.processSidecar(id, false);
  }

  @OnEvent({ name: 'asset.tag' })
  async handleTagAsset({ assetId }: ArgOf<'asset.tag'>) {
    await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id: assetId, tags: true } });
  }

  @OnEvent({ name: 'asset.untag' })
  async handleUntagAsset({ assetId }: ArgOf<'asset.untag'>) {
    await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id: assetId, tags: true } });
  }

  @OnJob({ name: JobName.SIDECAR_WRITE, queue: QueueName.SIDECAR })
  async handleSidecarWrite(job: JobOf<JobName.SIDECAR_WRITE>): Promise<JobStatus> {
    const { id, description, dateTimeOriginal, latitude, longitude, rating, tags } = job;
    const [asset] = await this.assetRepository.getByIds([id], { tags: true });
    if (!asset) {
      return JobStatus.FAILED;
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
      return JobStatus.SKIPPED;
    }

    await this.metadataRepository.writeTags(sidecarPath, exif);

    if (!asset.sidecarPath) {
      await this.assetRepository.update({ id, sidecarPath });
    }

    return JobStatus.SUCCESS;
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

  private getExifTags(asset: AssetEntity): Promise<ImmichTags> {
    if (!asset.sidecarPath && asset.type === AssetType.IMAGE) {
      return this.metadataRepository.readTags(asset.originalPath);
    }

    return this.mergeExifTags(asset);
  }

  private async mergeExifTags(asset: AssetEntity): Promise<ImmichTags> {
    const [mediaTags, sidecarTags, videoTags] = await Promise.all([
      this.metadataRepository.readTags(asset.originalPath),
      asset.sidecarPath ? this.metadataRepository.readTags(asset.sidecarPath) : null,
      asset.type === AssetType.VIDEO ? this.getVideoTags(asset.originalPath) : null,
    ]);

    // prefer dates from sidecar tags
    if (sidecarTags) {
      const sidecarDate = firstDateTime(sidecarTags as Tags, EXIF_DATE_TAGS);
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

  private async applyTagList(asset: AssetEntity, exifTags: ImmichTags) {
    const tags = this.getTagList(exifTags);
    const results = await upsertTags(this.tagRepository, { userId: asset.ownerId, tags });
    await this.tagRepository.replaceAssetTags(
      asset.id,
      results.map((tag) => tag.id),
    );
  }

  private isMotionPhoto(asset: AssetEntity, tags: ImmichTags): boolean {
    return asset.type === AssetType.IMAGE && !!(tags.MotionPhoto || tags.MicroVideo);
  }

  private async applyMotionPhotos(asset: AssetEntity, tags: ImmichTags, fileSize: number) {
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
      const position = fileSize - length - padding;
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

      let motionAsset = await this.assetRepository.getByChecksum({
        ownerId: asset.ownerId,
        libraryId: asset.libraryId ?? undefined,
        checksum,
      });
      if (motionAsset) {
        this.logger.debugFn(() => {
          const base64Checksum = checksum.toString('base64');
          return `Motion asset with checksum ${base64Checksum} already exists for asset ${asset.id}: ${asset.originalPath}`;
        });

        // Hide the motion photo video asset if it's not already hidden to prepare for linking
        if (motionAsset.isVisible) {
          await this.assetRepository.update({ id: motionAsset.id, isVisible: false });
          this.logger.log(`Hid unlinked motion photo video asset (${motionAsset.id})`);
        }
      } else {
        const motionAssetId = this.cryptoRepository.randomUUID();
        const dates = this.getDates(asset, tags);
        motionAsset = await this.assetRepository.create({
          id: motionAssetId,
          libraryId: asset.libraryId,
          type: AssetType.VIDEO,
          fileCreatedAt: dates.dateTimeOriginal,
          fileModifiedAt: dates.modifyDate,
          localDateTime: dates.localDateTime,
          checksum,
          ownerId: asset.ownerId,
          originalPath: StorageCore.getAndroidMotionPath(asset, motionAssetId),
          originalFileName: `${path.parse(asset.originalFileName).name}.mp4`,
          isVisible: false,
          deviceAssetId: 'NONE',
          deviceId: 'NONE',
        });

        if (!asset.isExternal) {
          await this.userRepository.updateUsage(asset.ownerId, video.byteLength);
        }
      }

      if (asset.livePhotoVideoId !== motionAsset.id) {
        await this.assetRepository.update({ id: asset.id, livePhotoVideoId: motionAsset.id });

        // If the asset already had an associated livePhotoVideo, delete it, because
        // its checksum doesn't match the checksum of the motionAsset we just extracted
        // (if it did, getByChecksum() would've returned a motionAsset with the same ID as livePhotoVideoId)
        // note asset.livePhotoVideoId is not motionAsset.id yet
        if (asset.livePhotoVideoId) {
          await this.jobRepository.queue({
            name: JobName.ASSET_DELETION,
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
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: motionAsset.id } });
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

  private async applyTaggedFaces(asset: AssetEntity, tags: ImmichTags) {
    if (!tags.RegionInfo?.AppliedToDimensions || tags.RegionInfo.RegionList.length === 0) {
      return;
    }

    const facesToAdd: (Partial<AssetFaceEntity> & { assetId: string })[] = [];
    const existingNames = await this.personRepository.getDistinctNames(asset.ownerId, { withHidden: true });
    const existingNameMap = new Map(existingNames.map(({ id, name }) => [name.toLowerCase(), id]));
    const missing: (Partial<PersonEntity> & { ownerId: string })[] = [];
    const missingWithFaceAsset: { id: string; ownerId: string; faceAssetId: string }[] = [];
    for (const region of tags.RegionInfo.RegionList) {
      if (!region.Name) {
        continue;
      }

      const imageWidth = tags.RegionInfo.AppliedToDimensions.W;
      const imageHeight = tags.RegionInfo.AppliedToDimensions.H;
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
        sourceType: SourceType.EXIF,
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
      const jobs = newPersonIds.map((id) => ({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } }) as const);
      await this.jobRepository.queueAll(jobs);
    }

    const facesToRemove = asset.faces.filter((face) => face.sourceType === SourceType.EXIF).map((face) => face.id);
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

  private getDates(asset: AssetEntity, exifTags: ImmichTags) {
    const dateTime = firstDateTime(exifTags as Maybe<Tags>, EXIF_DATE_TAGS);
    this.logger.verbose(`Date and time is ${dateTime} for asset ${asset.id}: ${asset.originalPath}`);

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

    const modifyDate = this.toDate(exifTags.FileModifyDate!);
    let dateTimeOriginal = dateTime?.toDate();
    let localDateTime = dateTime?.toDateTime().setZone('UTC', { keepLocalTime: true }).toJSDate();
    if (!localDateTime || !dateTimeOriginal) {
      const fileCreatedAt = this.toDate(exifTags.FileCreateDate!);
      const earliestDate = this.earliestDate(fileCreatedAt, modifyDate);
      this.logger.debug(
        `No exif date time found, falling back on ${earliestDate.toISOString()}, earliest of file creation and modification for assset ${asset.id}: ${asset.originalPath}`,
      );
      dateTimeOriginal = earliestDate;
      localDateTime = earliestDate;
    }

    this.logger.verbose(
      `Found local date time ${localDateTime.toISOString()} for asset ${asset.id}: ${asset.originalPath}`,
    );

    return {
      dateTimeOriginal,
      timeZone,
      localDateTime,
      modifyDate,
    };
  }

  private toDate(date: string | ExifDateTime): Date {
    return typeof date === 'string' ? new Date(date) : date.toDate();
  }

  private earliestDate(a: Date, b: Date) {
    return new Date(Math.min(a.valueOf(), b.valueOf()));
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

  private async processSidecar(id: string, isSync: boolean): Promise<JobStatus> {
    const [asset] = await this.assetRepository.getByIds([id]);

    if (!asset) {
      return JobStatus.FAILED;
    }

    if (isSync && !asset.sidecarPath) {
      return JobStatus.FAILED;
    }

    if (!isSync && (!asset.isVisible || asset.sidecarPath) && !asset.isExternal) {
      return JobStatus.FAILED;
    }

    // XMP sidecars can come in two filename formats. For a photo named photo.ext, the filenames are photo.ext.xmp and photo.xmp
    const assetPath = path.parse(asset.originalPath);
    const assetPathWithoutExt = path.join(assetPath.dir, assetPath.name);
    const sidecarPathWithoutExt = `${assetPathWithoutExt}.xmp`;
    const sidecarPathWithExt = `${asset.originalPath}.xmp`;

    const [sidecarPathWithExtExists, sidecarPathWithoutExtExists] = await Promise.all([
      this.storageRepository.checkFileExists(sidecarPathWithExt, constants.R_OK),
      this.storageRepository.checkFileExists(sidecarPathWithoutExt, constants.R_OK),
    ]);

    let sidecarPath = null;
    if (sidecarPathWithExtExists) {
      sidecarPath = sidecarPathWithExt;
    } else if (sidecarPathWithoutExtExists) {
      sidecarPath = sidecarPathWithoutExt;
    }

    if (asset.isExternal) {
      if (sidecarPath !== asset.sidecarPath) {
        await this.assetRepository.update({ id: asset.id, sidecarPath });
      }
      return JobStatus.SUCCESS;
    }

    if (sidecarPath) {
      this.logger.debug(`Detected sidecar at '${sidecarPath}' for asset ${asset.id}: ${asset.originalPath}`);
      await this.assetRepository.update({ id: asset.id, sidecarPath });
      return JobStatus.SUCCESS;
    }

    if (!isSync) {
      return JobStatus.FAILED;
    }

    this.logger.debug(`No sidecar found for asset ${asset.id}: ${asset.originalPath}`);
    await this.assetRepository.update({ id: asset.id, sidecarPath: null });

    return JobStatus.SUCCESS;
  }
}
