import { Inject, Injectable } from '@nestjs/common';
import { ContainerDirectoryItem, ExifDateTime, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import _ from 'lodash';
import { Duration } from 'luxon';
import { constants } from 'node:fs/promises';
import path from 'node:path';
import { SystemConfig } from 'src/config';
import { StorageCore } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnEmit } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { PersonEntity } from 'src/entities/person.entity';
import { AssetType, SourceType } from 'src/enum';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ArgOf, ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import {
  IBaseJob,
  IEntityJob,
  IJobRepository,
  ISidecarWriteJob,
  JobName,
  JOBS_ASSET_PAGINATION_SIZE,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMapRepository } from 'src/interfaces/map.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IMetadataRepository, ImmichTags } from 'src/interfaces/metadata.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { ITagRepository } from 'src/interfaces/tag.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
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
  Horizontal = '1',
  MirrorHorizontal = '2',
  Rotate180 = '3',
  MirrorVertical = '4',
  MirrorHorizontalRotate270CW = '5',
  Rotate90CW = '6',
  MirrorHorizontalRotate90CW = '7',
  Rotate270CW = '8',
}

type ExifEntityWithoutGeocodeAndTypeOrm = Omit<ExifEntity, 'city' | 'state' | 'country' | 'description'> & {
  dateTimeOriginal: Date;
};

const exifDate = (dt: ExifDateTime | string | undefined) => (dt instanceof ExifDateTime ? dt?.toDate() : null);
const tzOffset = (dt: ExifDateTime | string | undefined) => (dt instanceof ExifDateTime ? dt?.tzoffsetMinutes : null);

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

@Injectable()
export class MetadataService {
  private storageCore: StorageCore;
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMapRepository) private mapRepository: IMapRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IMetadataRepository) private repository: IMetadataRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IPersonRepository) private personRepository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ITagRepository) private tagRepository: ITagRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(MetadataService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
    this.storageCore = StorageCore.create(
      assetRepository,
      cryptoRepository,
      moveRepository,
      personRepository,
      storageRepository,
      systemMetadataRepository,
      this.logger,
    );
  }

  @OnEmit({ event: 'app.bootstrap' })
  async onBootstrap(app: ArgOf<'app.bootstrap'>) {
    if (app !== 'microservices') {
      return;
    }
    const config = await this.configCore.getConfig({ withCache: false });
    await this.init(config);
  }

  @OnEmit({ event: 'config.update' })
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

  @OnEmit({ event: 'app.shutdown' })
  async onShutdown() {
    await this.repository.teardown();
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

    // Notify clients to hide the linked live photo asset
    this.eventRepository.clientSend(ClientEvent.ASSET_HIDDEN, motionAsset.ownerId, motionAsset.id);

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
    const { metadata } = await this.configCore.getConfig({ withCache: true });
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return JobStatus.FAILED;
    }

    const { exifData, exifTags } = await this.exifData(asset);

    if (asset.type === AssetType.VIDEO) {
      await this.applyVideoMetadata(asset, exifData);
    }

    await this.applyMotionPhotos(asset, exifTags);
    await this.applyReverseGeocoding(asset, exifData);
    await this.applyTagList(asset, exifTags);

    await this.assetRepository.upsertExif(exifData);

    const dateTimeOriginal = exifData.dateTimeOriginal;
    let localDateTime = dateTimeOriginal ?? undefined;

    const timeZoneOffset = tzOffset(firstDateTime(exifTags as Tags)) ?? 0;

    if (dateTimeOriginal && timeZoneOffset) {
      localDateTime = new Date(dateTimeOriginal.getTime() + timeZoneOffset * 60_000);
    }

    await this.assetRepository.update({
      id: asset.id,
      duration: asset.duration,
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

  @OnEmit({ event: 'asset.tag' })
  async handleTagAsset({ assetId }: ArgOf<'asset.tag'>) {
    await this.jobRepository.queue({ name: JobName.SIDECAR_WRITE, data: { id: assetId, tags: true } });
  }

  @OnEmit({ event: 'asset.untag' })
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

    await this.repository.writeTags(sidecarPath, exif);

    if (!asset.sidecarPath) {
      await this.assetRepository.update({ id, sidecarPath });
    }

    return JobStatus.SUCCESS;
  }

  private async applyReverseGeocoding(asset: AssetEntity, exifData: ExifEntityWithoutGeocodeAndTypeOrm) {
    const { latitude, longitude } = exifData;
    const { reverseGeocoding } = await this.configCore.getConfig({ withCache: true });
    if (!reverseGeocoding.enabled || !longitude || !latitude) {
      return;
    }

    try {
      const reverseGeocode = await this.mapRepository.reverseGeocode({ latitude, longitude });
      if (!reverseGeocode) {
        return;
      }
      Object.assign(exifData, reverseGeocode);
    } catch (error: Error | any) {
      this.logger.warn(
        `Unable to run reverse geocoding due to ${error} for asset ${asset.id} at ${asset.originalPath}`,
        error?.stack,
      );
    }
  }

  private async applyTagList(asset: AssetEntity, exifTags: ImmichTags) {
    const tags: unknown[] = [];
    if (exifTags.TagsList) {
      tags.push(...exifTags.TagsList);
    } else if (exifTags.HierarchicalSubject) {
      tags.push(
        exifTags.HierarchicalSubject.map((tag) =>
          tag
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
      tags.push(...keywords);
    }

    const results = await upsertTags(this.tagRepository, { userId: asset.ownerId, tags: tags.map(String) });
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
        if (entry.Item.Semantic == 'MotionPhoto') {
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
        video = await this.repository.extractBinaryTag(asset.originalPath, 'MotionPhotoVideo');
      }
      //     JPEG-encoded; HEIC also contains these tags, so this conditional must come second
      else if (hasEmbeddedVideoFile) {
        video = await this.repository.extractBinaryTag(asset.originalPath, 'EmbeddedVideoFile');
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
        await this.storageRepository.writeFile(motionAsset.originalPath, video);
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

    const discoveredFaces: Partial<AssetFaceEntity>[] = [];
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

      discoveredFaces.push(face);
      if (!existingNameMap.has(loweredName)) {
        missing.push({ id: personId, ownerId: asset.ownerId, name: region.Name });
        missingWithFaceAsset.push({ id: personId, faceAssetId: face.id });
      }
    }

    if (missing.length > 0) {
      this.logger.debug(`Creating missing persons: ${missing.map((p) => `${p.name}/${p.id}`)}`);
    }

    const newPersons = await this.personRepository.create(missing);

    const faceIds = await this.personRepository.replaceFaces(asset.id, discoveredFaces, SourceType.EXIF);
    this.logger.debug(`Created ${faceIds.length} faces for asset ${asset.id}`);

    await this.personRepository.update(missingWithFaceAsset);

    await this.jobRepository.queueAll(
      newPersons.map((person) => ({
        name: JobName.GENERATE_PERSON_THUMBNAIL,
        data: { id: person.id },
      })),
    );
  }

  private async exifData(
    asset: AssetEntity,
  ): Promise<{ exifData: ExifEntityWithoutGeocodeAndTypeOrm; exifTags: ImmichTags }> {
    const stats = await this.storageRepository.stat(asset.originalPath);
    const mediaTags = await this.repository.readTags(asset.originalPath);
    const sidecarTags = asset.sidecarPath ? await this.repository.readTags(asset.sidecarPath) : null;

    // ensure date from sidecar is used if present
    const hasDateOverride = !!this.getDateTimeOriginal(sidecarTags);
    if (mediaTags && hasDateOverride) {
      for (const tag of EXIF_DATE_TAGS) {
        delete mediaTags[tag];
      }
    }

    const exifTags = { ...mediaTags, ...sidecarTags };

    this.logger.verbose('Exif Tags', exifTags);

    const dateTimeOriginalWithRawValue = this.getDateTimeOriginalWithRawValue(exifTags);
    const dateTimeOriginal = dateTimeOriginalWithRawValue.exifDate ?? asset.fileCreatedAt;
    const timeZone = this.getTimeZone(exifTags, dateTimeOriginalWithRawValue.rawValue);

    const exifData = {
      // altitude: tags.GPSAltitude ?? null,
      assetId: asset.id,
      bitsPerSample: this.getBitsPerSample(exifTags),
      colorspace: exifTags.ColorSpace ?? null,
      dateTimeOriginal,
      description: String(exifTags.ImageDescription || exifTags.Description || '').trim(),
      exifImageHeight: validate(exifTags.ImageHeight),
      exifImageWidth: validate(exifTags.ImageWidth),
      exposureTime: exifTags.ExposureTime ?? null,
      fileSizeInByte: stats.size,
      fNumber: validate(exifTags.FNumber),
      focalLength: validate(exifTags.FocalLength),
      fps: validate(Number.parseFloat(exifTags.VideoFrameRate!)),
      iso: validate(exifTags.ISO),
      latitude: validate(exifTags.GPSLatitude),
      lensModel: exifTags.LensModel ?? null,
      livePhotoCID: (exifTags.ContentIdentifier || exifTags.MediaGroupUUID) ?? null,
      autoStackId: this.getAutoStackId(exifTags),
      longitude: validate(exifTags.GPSLongitude),
      make: exifTags.Make ?? null,
      model: exifTags.Model ?? null,
      modifyDate: exifDate(exifTags.ModifyDate) ?? asset.fileModifiedAt,
      orientation: validate(exifTags.Orientation)?.toString() ?? null,
      profileDescription: exifTags.ProfileDescription || null,
      projectionType: exifTags.ProjectionType ? String(exifTags.ProjectionType).toUpperCase() : null,
      timeZone,
      rating: exifTags.Rating ?? null,
    };

    if (exifData.latitude === 0 && exifData.longitude === 0) {
      this.logger.warn('Exif data has latitude and longitude of 0, setting to null');
      exifData.latitude = null;
      exifData.longitude = null;
    }

    return { exifData, exifTags };
  }

  private getAutoStackId(tags: ImmichTags | null): string | null {
    if (!tags) {
      return null;
    }
    return tags.BurstID ?? tags.BurstUUID ?? tags.CameraBurstID ?? tags.MediaUniqueID ?? null;
  }

  private getDateTimeOriginal(tags: ImmichTags | Tags | null) {
    return this.getDateTimeOriginalWithRawValue(tags).exifDate;
  }

  private getDateTimeOriginalWithRawValue(tags: ImmichTags | Tags | null): { exifDate: Date | null; rawValue: string } {
    if (!tags) {
      return { exifDate: null, rawValue: '' };
    }
    const first = firstDateTime(tags as Tags, EXIF_DATE_TAGS);
    return { exifDate: exifDate(first), rawValue: first?.rawValue ?? '' };
  }

  private getTimeZone(exifTags: ImmichTags, rawValue: string) {
    const timeZone = exifTags.tz ?? null;
    if (timeZone == null && rawValue.endsWith('+00:00')) {
      // exiftool-vendored returns "no timezone" information even though "+00:00" might be set explicitly
      // https://github.com/photostructure/exiftool-vendored.js/issues/203
      return 'UTC+0';
    }
    return timeZone;
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

  private async applyVideoMetadata(asset: AssetEntity, exifData: ExifEntityWithoutGeocodeAndTypeOrm) {
    const { videoStreams, format } = await this.mediaRepository.probe(asset.originalPath);

    if (videoStreams[0]) {
      switch (videoStreams[0].rotation) {
        case -90: {
          exifData.orientation = Orientation.Rotate90CW;
          break;
        }
        case 0: {
          exifData.orientation = Orientation.Horizontal;
          break;
        }
        case 90: {
          exifData.orientation = Orientation.Rotate270CW;
          break;
        }
        case 180: {
          exifData.orientation = Orientation.Rotate180;
          break;
        }
      }
    }

    if (format.duration) {
      asset.duration = Duration.fromObject({ seconds: format.duration }).toFormat('hh:mm:ss.SSS');
    }
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
