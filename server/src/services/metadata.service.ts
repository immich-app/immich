import { Injectable } from '@nestjs/common';
import { ContainerDirectoryItem, ExifDateTime, Maybe, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import _ from 'lodash';
import { Duration } from 'luxon';
import { constants } from 'node:fs/promises';
import path from 'node:path';
import { SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { AssetType, ImmichWorker, SourceType } from 'src/enum';
import { WithoutProperty } from 'src/interfaces/asset.interface';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
import {
  IBaseJob,
  IEntityJob,
  ISidecarWriteJob,
  JobName,
  JOBS_ASSET_PAGINATION_SIZE,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { ReverseGeocodeResult } from 'src/interfaces/map.interface';
import { ImmichTags } from 'src/interfaces/metadata.interface';
import { BaseService } from 'src/services/base.service';
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

export enum Orientation {
  Horizontal = 1,
  MirrorHorizontal = 2,
  Rotate180 = 3,
  MirrorVertical = 4,
  MirrorHorizontalRotate270CW = 5,
  Rotate90CW = 6,
  MirrorHorizontalRotate90CW = 7,
  Rotate270CW = 8,
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

  return val;
};

@Injectable()
export class MetadataService extends BaseService {
  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap(app: ArgOf<'app.bootstrap'>) {
    if (app !== ImmichWorker.MICROSERVICES) {
      return;
    }
    const config = await this.getConfig({ withCache: false });
    await this.init(config);
  }

  @OnEvent({ name: 'app.shutdown' })
  async onShutdown() {
    await this.metadataRepository.teardown();
  }

  @OnEvent({ name: 'config.update' })
  async onConfigUpdate({ newConfig }: ArgOf<'config.update'>) {
    await this.init(newConfig);
  }

  private async init({ reverseGeocoding }: SystemConfig) {
    const { enabled } = reverseGeocoding;

    if (!enabled) {
      return;
    }

    try {
      await this.jobRepository.pause(QueueName.METADATA_EXTRACTION);
      await this.databaseRepository.withLock(DatabaseLock.GeodataImport, () => this.mapRepository.init());
      await this.jobRepository.resume(QueueName.METADATA_EXTRACTION);

      this.logger.log(`Initialized local reverse geocoder`);
    } catch (error: Error | any) {
      this.logger.error(`Unable to initialize reverse geocoding: ${error}`, error?.stack);
    }
  }

  async handleLivePhotoLinking(job: IEntityJob): Promise<JobStatus> {
    const { id } = job;
    const [asset] = await this.assetRepository.getByIds([id], { exifInfo: true });
    if (!asset?.exifInfo) {
      return JobStatus.FAILED;
    }

    if (!asset.exifInfo.livePhotoCID) {
      return JobStatus.SKIPPED;
    }

    const otherType = asset.type === AssetType.VIDEO ? AssetType.IMAGE : AssetType.VIDEO;
    const match = await this.assetRepository.findLivePhotoMatch({
      livePhotoCID: asset.exifInfo.livePhotoCID,
      ownerId: asset.ownerId,
      libraryId: asset.libraryId,
      otherAssetId: asset.id,
      type: otherType,
    });

    if (!match) {
      return JobStatus.SKIPPED;
    }

    const [photoAsset, motionAsset] = asset.type === AssetType.IMAGE ? [asset, match] : [match, asset];

    await this.assetRepository.update({ id: photoAsset.id, livePhotoVideoId: motionAsset.id });
    await this.assetRepository.update({ id: motionAsset.id, isVisible: false });
    await this.albumRepository.removeAsset(motionAsset.id);

    await this.eventRepository.emit('asset.hide', { assetId: motionAsset.id, userId: motionAsset.ownerId });

    return JobStatus.SUCCESS;
  }

  async handleQueueMetadataExtraction(job: IBaseJob): Promise<JobStatus> {
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

  async handleMetadataExtraction({ id }: IEntityJob): Promise<JobStatus> {
    const { metadata, reverseGeocoding } = await this.getConfig({ withCache: true });
    const [asset] = await this.assetRepository.getByIds([id], { faces: { person: false } });
    if (!asset) {
      return JobStatus.FAILED;
    }

    const stats = await this.storageRepository.stat(asset.originalPath);

    const exifTags = await this.getExifTags(asset);

    this.logger.verbose('Exif Tags', exifTags);

    const { dateTimeOriginal, localDateTime, timeZone, modifyDate } = this.getDates(asset, exifTags);
    const { latitude, longitude, country, state, city } = await this.getGeo(exifTags, reverseGeocoding);

    const exifData: Partial<ExifEntity> = {
      assetId: asset.id,

      // dates
      dateTimeOriginal,
      modifyDate,
      timeZone,

      // gps
      latitude,
      longitude,
      country,
      state,
      city,

      // image/file
      fileSizeInByte: stats.size,
      exifImageHeight: validate(exifTags.ImageHeight),
      exifImageWidth: validate(exifTags.ImageWidth),
      orientation: validate(exifTags.Orientation)?.toString() ?? null,
      projectionType: exifTags.ProjectionType ? String(exifTags.ProjectionType).toUpperCase() : null,
      bitsPerSample: this.getBitsPerSample(exifTags),
      colorspace: exifTags.ColorSpace ?? null,

      // camera
      make: exifTags.Make ?? null,
      model: exifTags.Model ?? null,
      fps: validate(Number.parseFloat(exifTags.VideoFrameRate!)),
      iso: validate(exifTags.ISO) as number,
      exposureTime: exifTags.ExposureTime ?? null,
      lensModel: exifTags.LensModel ?? null,
      fNumber: validate(exifTags.FNumber),
      focalLength: validate(exifTags.FocalLength),

      // comments
      description: String(exifTags.ImageDescription || exifTags.Description || '').trim(),
      profileDescription: exifTags.ProfileDescription || null,
      rating: validateRange(exifTags.Rating, 0, 5),

      // grouping
      livePhotoCID: (exifTags.ContentIdentifier || exifTags.MediaGroupUUID) ?? null,
      autoStackId: this.getAutoStackId(exifTags),
    };

    await this.applyTagList(asset, exifTags);
    await this.applyMotionPhotos(asset, exifTags);

    await this.assetRepository.upsertExif(exifData);

    await this.assetRepository.update({
      id: asset.id,
      duration: exifTags.Duration?.toString() ?? null,
      localDateTime,
      fileCreatedAt: exifData.dateTimeOriginal ?? undefined,
    });

    await this.assetRepository.upsertJobStatus({
      assetId: asset.id,
      metadataExtractedAt: new Date(),
    });

    if (isFaceImportEnabled(metadata)) {
      await this.applyTaggedFaces(asset, exifTags);
    }

    return JobStatus.SUCCESS;
  }

  async handleQueueSidecar(job: IBaseJob): Promise<JobStatus> {
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

  handleSidecarSync({ id }: IEntityJob): Promise<JobStatus> {
    return this.processSidecar(id, true);
  }

  handleSidecarDiscovery({ id }: IEntityJob): Promise<JobStatus> {
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

  async handleSidecarWrite(job: ISidecarWriteJob): Promise<JobStatus> {
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

  private async getExifTags(asset: AssetEntity): Promise<ImmichTags> {
    const mediaTags = await this.metadataRepository.readTags(asset.originalPath);
    const sidecarTags = asset.sidecarPath ? await this.metadataRepository.readTags(asset.sidecarPath) : {};
    const videoTags = asset.type === AssetType.VIDEO ? await this.getVideoTags(asset.originalPath) : {};

    // make sure dates comes from sidecar
    const sidecarDate = firstDateTime(sidecarTags as Tags, EXIF_DATE_TAGS);
    if (sidecarDate) {
      for (const tag of EXIF_DATE_TAGS) {
        delete mediaTags[tag];
      }
    }

    return { ...mediaTags, ...videoTags, ...sidecarTags };
  }

  private async applyTagList(asset: AssetEntity, exifTags: ImmichTags) {
    const tags: string[] = [];
    if (exifTags.TagsList) {
      tags.push(...exifTags.TagsList.map(String));
    } else if (exifTags.HierarchicalSubject) {
      tags.push(
        ...exifTags.HierarchicalSubject.map((tag) =>
          String(tag)
            // convert | to /
            .replaceAll('/', '<PLACEHOLDER>')
            .replaceAll('|', '/')
            .replaceAll('<PLACEHOLDER>', '|'),
        ),
      );
    } else if (exifTags.Keywords) {
      let keywords = exifTags.Keywords;
      if (!Array.isArray(keywords)) {
        keywords = [keywords];
      }
      tags.push(...keywords.map(String));
    }

    const results = await upsertTags(this.tagRepository, { userId: asset.ownerId, tags });
    await this.tagRepository.upsertAssetTags({ assetId: asset.id, tagIds: results.map((tag) => tag.id) });
  }

  private async applyMotionPhotos(asset: AssetEntity, tags: ImmichTags) {
    if (asset.type !== AssetType.IMAGE) {
      return;
    }

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
        if (entry?.Item?.Semantic == 'MotionPhoto') {
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

    this.logger.debug(`Starting motion photo video extraction (${asset.id})`);

    try {
      const stat = await this.storageRepository.stat(asset.originalPath);
      const position = stat.size - length - padding;
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
        this.logger.debug(
          `Asset ${asset.id}'s motion photo video with checksum ${checksum.toString(
            'base64',
          )} already exists in the repository`,
        );

        // Hide the motion photo video asset if it's not already hidden to prepare for linking
        if (motionAsset.isVisible) {
          await this.assetRepository.update({ id: motionAsset.id, isVisible: false });
          this.logger.log(`Hid unlinked motion photo video asset (${motionAsset.id})`);
        }
      } else {
        const motionAssetId = this.cryptoRepository.randomUUID();
        const createdAt = asset.fileCreatedAt ?? asset.createdAt;
        motionAsset = await this.assetRepository.create({
          id: motionAssetId,
          libraryId: asset.libraryId,
          type: AssetType.VIDEO,
          fileCreatedAt: createdAt,
          fileModifiedAt: asset.fileModifiedAt,
          localDateTime: createdAt,
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

      this.logger.debug(`Finished motion photo video extraction (${asset.id})`);
    } catch (error: Error | any) {
      this.logger.error(`Failed to extract live photo ${asset.originalPath}: ${error}`, error?.stack);
    }
  }

  private async applyTaggedFaces(asset: AssetEntity, tags: ImmichTags) {
    if (!tags.RegionInfo?.AppliedToDimensions || tags.RegionInfo.RegionList.length === 0) {
      return;
    }

    const facesToAdd: Partial<AssetFaceEntity>[] = [];
    const existingNames = await this.personRepository.getDistinctNames(asset.ownerId, { withHidden: true });
    const existingNameMap = new Map(existingNames.map(({ id, name }) => [name.toLowerCase(), id]));
    const missing: Partial<PersonEntity>[] = [];
    const missingWithFaceAsset: Partial<PersonEntity>[] = [];
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
        missingWithFaceAsset.push({ id: personId, faceAssetId: face.id });
      }
    }

    if (missing.length > 0) {
      this.logger.debug(`Creating missing persons: ${missing.map((p) => `${p.name}/${p.id}`)}`);
      const newPersonIds = await this.personRepository.createAll(missing);
      const jobs = newPersonIds.map((id) => ({ name: JobName.GENERATE_PERSON_THUMBNAIL, data: { id } }) as const);
      await this.jobRepository.queueAll(jobs);
    }

    const facesToRemove = asset.faces.filter((face) => face.sourceType === SourceType.EXIF).map((face) => face.id);
    if (facesToRemove.length > 0) {
      this.logger.debug(`Removing ${facesToRemove.length} faces for asset ${asset.id}`);
    }

    if (facesToAdd.length > 0) {
      this.logger.debug(`Creating ${facesToAdd} faces from metadata for asset ${asset.id}`);
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
    this.logger.debug(`Asset ${asset.id} date time is ${dateTime}`);

    // timezone
    let timeZone = exifTags.tz ?? null;
    if (timeZone == null && dateTime?.rawValue?.endsWith('+00:00')) {
      // exiftool-vendored returns "no timezone" information even though "+00:00" might be set explicitly
      // https://github.com/photostructure/exiftool-vendored.js/issues/203
      timeZone = 'UTC+0';
    }

    if (timeZone) {
      this.logger.debug(`Asset ${asset.id} timezone is ${timeZone} (via ${exifTags.tzSource})`);
    } else {
      this.logger.warn(`Asset ${asset.id} has no time zone information`);
    }

    let dateTimeOriginal = dateTime?.toDate();
    let localDateTime = dateTime?.toDateTime().setZone('UTC', { keepLocalTime: true }).toJSDate();
    if (!localDateTime || !dateTimeOriginal) {
      this.logger.warn(`Asset ${asset.id} has no valid date, falling back to asset.fileCreatedAt`);
      dateTimeOriginal = asset.fileCreatedAt;
      localDateTime = asset.fileCreatedAt;
    }

    this.logger.debug(`Asset ${asset.id} has a local time of ${localDateTime.toISOString()}`);

    let modifyDate = asset.fileModifiedAt;
    try {
      modifyDate = (exifTags.ModifyDate as ExifDateTime)?.toDate() ?? modifyDate;
    } catch {}

    return {
      dateTimeOriginal,
      timeZone,
      localDateTime,
      modifyDate,
    };
  }

  private async getGeo(tags: ImmichTags, reverseGeocoding: SystemConfig['reverseGeocoding']) {
    let latitude = validate(tags.GPSLatitude);
    let longitude = validate(tags.GPSLongitude);

    // TODO take ref into account

    if (latitude === 0 && longitude === 0) {
      this.logger.warn('Latitude and longitude of 0, setting to null');
      latitude = null;
      longitude = null;
    }

    let result: ReverseGeocodeResult = { country: null, state: null, city: null };
    if (reverseGeocoding.enabled && longitude && latitude) {
      result = await this.mapRepository.reverseGeocode({ latitude, longitude });
    }

    return { ...result, latitude, longitude };
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
          tags.Orientation = Orientation.Rotate90CW;
          break;
        }
        case 0: {
          tags.Orientation = Orientation.Horizontal;
          break;
        }
        case 90: {
          tags.Orientation = Orientation.Rotate270CW;
          break;
        }
        case 180: {
          tags.Orientation = Orientation.Rotate180;
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

    if (!isSync && (!asset.isVisible || asset.sidecarPath)) {
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

    if (sidecarPath) {
      await this.assetRepository.update({ id: asset.id, sidecarPath });
      return JobStatus.SUCCESS;
    }

    if (!isSync) {
      return JobStatus.FAILED;
    }

    this.logger.debug(
      `Sidecar file was not found. Checked paths '${sidecarPathWithExt}' and '${sidecarPathWithoutExt}'. Removing sidecarPath for asset ${asset.id}`,
    );
    await this.assetRepository.update({ id: asset.id, sidecarPath: null });

    return JobStatus.SUCCESS;
  }
}
