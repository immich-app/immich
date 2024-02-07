import { AssetEntity, AssetType, ExifEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject, Injectable } from '@nestjs/common';
import { ExifDateTime, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import _ from 'lodash';
import { Duration } from 'luxon';
import { constants } from 'node:fs/promises';
import { Subscription } from 'rxjs';
import { usePagination } from '../domain.util';
import { IBaseJob, IEntityJob, ISidecarWriteJob, JOBS_ASSET_PAGINATION_SIZE, JobName, QueueName } from '../job';
import {
  ClientEvent,
  DatabaseLock,
  IAlbumRepository,
  IAssetRepository,
  ICommunicationRepository,
  ICryptoRepository,
  IDatabaseRepository,
  IJobRepository,
  IMediaRepository,
  IMetadataRepository,
  IMoveRepository,
  IPersonRepository,
  IStorageRepository,
  ISystemConfigRepository,
  ImmichTags,
  WithoutProperty,
} from '../repositories';
import { StorageCore } from '../storage';
import { FeatureFlag, SystemConfigCore } from '../system-config';

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

interface DirectoryItem {
  Length?: number;
  Mime: string;
  Padding?: number;
  Semantic?: string;
}

interface DirectoryEntry {
  Item: DirectoryItem;
}

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

type ExifEntityWithoutGeocodeAndTypeOrm = Omit<
  ExifEntity,
  'city' | 'state' | 'country' | 'description' | 'exifTextSearchableColumn'
> & { dateTimeOriginal: Date };

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
  private logger = new ImmichLogger(MetadataService.name);
  private storageCore: StorageCore;
  private configCore: SystemConfigCore;
  private subscription: Subscription | null = null;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICommunicationRepository) private communicationRepository: ICommunicationRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IMetadataRepository) private repository: IMetadataRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IPersonRepository) personRepository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
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

  async init() {
    if (!this.subscription) {
      this.subscription = this.configCore.config$.subscribe(() => this.init());
    }

    const { reverseGeocoding } = await this.configCore.getConfig();
    const { enabled } = reverseGeocoding;

    if (!enabled) {
      return;
    }

    try {
      await this.jobRepository.pause(QueueName.METADATA_EXTRACTION);
      await this.databaseRepository.withLock(DatabaseLock.GeodataImport, () => this.repository.init());
      await this.jobRepository.resume(QueueName.METADATA_EXTRACTION);

      this.logger.log(`Initialized local reverse geocoder`);
    } catch (error: Error | any) {
      this.logger.error(`Unable to initialize reverse geocoding: ${error}`, error?.stack);
    }
  }

  async teardown() {
    this.subscription?.unsubscribe();
    await this.repository.teardown();
  }

  async handleLivePhotoLinking(job: IEntityJob) {
    const { id } = job;
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset?.exifInfo) {
      return false;
    }

    if (!asset.exifInfo.livePhotoCID) {
      return true;
    }

    const otherType = asset.type === AssetType.VIDEO ? AssetType.IMAGE : AssetType.VIDEO;
    const match = await this.assetRepository.findLivePhotoMatch({
      livePhotoCID: asset.exifInfo.livePhotoCID,
      ownerId: asset.ownerId,
      otherAssetId: asset.id,
      type: otherType,
    });

    if (!match) {
      return true;
    }

    const [photoAsset, motionAsset] = asset.type === AssetType.IMAGE ? [asset, match] : [match, asset];

    await this.assetRepository.save({ id: photoAsset.id, livePhotoVideoId: motionAsset.id });
    await this.assetRepository.save({ id: motionAsset.id, isVisible: false });
    await this.albumRepository.removeAsset(motionAsset.id);

    // Notify clients to hide the linked live photo asset
    this.communicationRepository.send(ClientEvent.ASSET_HIDDEN, motionAsset.ownerId, motionAsset.id);

    return true;
  }

  async handleQueueMetadataExtraction(job: IBaseJob) {
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

    return true;
  }

  async handleMetadataExtraction({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    const { exifData, tags } = await this.exifData(asset);

    if (asset.type === AssetType.VIDEO) {
      const { videoStreams } = await this.mediaRepository.probe(asset.originalPath);

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
    }

    await this.applyMotionPhotos(asset, tags);
    await this.applyReverseGeocoding(asset, exifData);
    await this.assetRepository.upsertExif(exifData);

    const dateTimeOriginal = exifData.dateTimeOriginal;
    let localDateTime = dateTimeOriginal ?? undefined;

    const timeZoneOffset = tzOffset(firstDateTime(tags as Tags)) ?? 0;

    if (dateTimeOriginal && timeZoneOffset) {
      localDateTime = new Date(dateTimeOriginal.getTime() + timeZoneOffset * 60_000);
    }
    await this.assetRepository.save({
      id: asset.id,
      duration: tags.Duration ? this.getDuration(tags.Duration) : null,
      localDateTime,
      fileCreatedAt: exifData.dateTimeOriginal ?? undefined,
    });

    await this.assetRepository.upsertJobStatus({
      assetId: asset.id,
      metadataExtractedAt: new Date(),
    });

    return true;
  }

  async handleQueueSidecar(job: IBaseJob) {
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

    return true;
  }

  handleSidecarSync({ id }: IEntityJob) {
    return this.processSidecar(id, true);
  }

  handleSidecarDiscovery({ id }: IEntityJob) {
    return this.processSidecar(id, false);
  }

  async handleSidecarWrite(job: ISidecarWriteJob) {
    const { id, description, dateTimeOriginal, latitude, longitude } = job;
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return false;
    }

    const sidecarPath = asset.sidecarPath || `${asset.originalPath}.xmp`;
    const exif = _.omitBy<Tags>(
      {
        ImageDescription: description,
        CreationDate: dateTimeOriginal,
        GPSLatitude: latitude,
        GPSLongitude: longitude,
      },
      _.isUndefined,
    );

    if (Object.keys(exif).length === 0) {
      return true;
    }

    await this.repository.writeTags(sidecarPath, exif);

    if (!asset.sidecarPath) {
      await this.assetRepository.save({ id, sidecarPath });
    }

    return true;
  }

  private async applyReverseGeocoding(asset: AssetEntity, exifData: ExifEntityWithoutGeocodeAndTypeOrm) {
    const { latitude, longitude } = exifData;
    if (!(await this.configCore.hasFeature(FeatureFlag.REVERSE_GEOCODING)) || !longitude || !latitude) {
      return;
    }

    try {
      const reverseGeocode = await this.repository.reverseGeocode({ latitude, longitude });
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

  private async applyMotionPhotos(asset: AssetEntity, tags: ImmichTags) {
    if (asset.type !== AssetType.IMAGE) {
      return;
    }

    const rawDirectory = tags.Directory;
    const isMotionPhoto = tags.MotionPhoto;
    const isMicroVideo = tags.MicroVideo;
    const videoOffset = tags.MicroVideoOffset;
    const hasMotionPhotoVideo = tags.MotionPhotoVideo;
    const hasEmbeddedVideoFile = tags.EmbeddedVideoType === 'MotionPhoto_Data' && tags.EmbeddedVideoFile;
    const directory = Array.isArray(rawDirectory) ? (rawDirectory as DirectoryEntry[]) : null;

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

      let motionAsset = await this.assetRepository.getByChecksum(asset.ownerId, checksum);
      if (motionAsset) {
        this.logger.debug(
          `Asset ${asset.id}'s motion photo video with checksum ${checksum.toString(
            'base64',
          )} already exists in the repository`,
        );
      } else {
        // We create a UUID in advance so that each extracted video can have a unique filename
        // (allowing us to delete old ones if necessary)
        const motionAssetId = this.cryptoRepository.randomUUID();
        const motionPath = StorageCore.getAndroidMotionPath(asset, motionAssetId);
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
          originalPath: motionPath,
          originalFileName: asset.originalFileName,
          isVisible: false,
          isReadOnly: false,
          deviceAssetId: 'NONE',
          deviceId: 'NONE',
        });

        this.storageCore.ensureFolders(motionPath);
        await this.storageRepository.writeFile(motionAsset.originalPath, video);
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: motionAsset.id } });
        await this.assetRepository.save({ id: asset.id, livePhotoVideoId: motionAsset.id });

        // If the asset already had an associated livePhotoVideo, delete it, because
        // its checksum doesn't match the checksum of the motionAsset we just extracted
        // (if it did, getByChecksum() would've returned non-null)
        if (asset.livePhotoVideoId) {
          await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.livePhotoVideoId } });
          this.logger.log(`Removed old motion photo video asset (${asset.livePhotoVideoId})`);
        }
      }

      this.logger.debug(`Finished motion photo video extraction (${asset.id})`);
    } catch (error: Error | any) {
      this.logger.error(`Failed to extract live photo ${asset.originalPath}: ${error}`, error?.stack);
    }
  }

  private async exifData(
    asset: AssetEntity,
  ): Promise<{ exifData: ExifEntityWithoutGeocodeAndTypeOrm; tags: ImmichTags }> {
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

    const tags = { ...mediaTags, ...sidecarTags };

    this.logger.verbose('Exif Tags', tags);

    const exifData = {
      // altitude: tags.GPSAltitude ?? null,
      assetId: asset.id,
      bitsPerSample: this.getBitsPerSample(tags),
      colorspace: tags.ColorSpace ?? null,
      dateTimeOriginal: this.getDateTimeOriginal(tags) ?? asset.fileCreatedAt,
      description: (tags.ImageDescription || tags.Description) ?? '',
      exifImageHeight: validate(tags.ImageHeight),
      exifImageWidth: validate(tags.ImageWidth),
      exposureTime: tags.ExposureTime ?? null,
      fileSizeInByte: stats.size,
      fNumber: validate(tags.FNumber),
      focalLength: validate(tags.FocalLength),
      fps: validate(Number.parseFloat(tags.VideoFrameRate!)),
      iso: validate(tags.ISO),
      latitude: validate(tags.GPSLatitude),
      lensModel: tags.LensModel ?? null,
      livePhotoCID: (tags.ContentIdentifier || tags.MediaGroupUUID) ?? null,
      autoStackId: this.getAutoStackId(tags),
      longitude: validate(tags.GPSLongitude),
      make: tags.Make ?? null,
      model: tags.Model ?? null,
      modifyDate: exifDate(tags.ModifyDate) ?? asset.fileModifiedAt,
      orientation: validate(tags.Orientation)?.toString() ?? null,
      profileDescription: tags.ProfileDescription || tags.ProfileName || null,
      projectionType: tags.ProjectionType ? String(tags.ProjectionType).toUpperCase() : null,
      timeZone: tags.tz ?? null,
    };

    if (exifData.latitude === 0 && exifData.longitude === 0) {
      this.logger.warn('Exif data has latitude and longitude of 0, setting to null');
      exifData.latitude = null;
      exifData.longitude = null;
    }

    return { exifData, tags };
  }

  private getAutoStackId(tags: ImmichTags | null): string | null {
    if (!tags) {
      return null;
    }
    return tags.BurstID ?? tags.BurstUUID ?? tags.CameraBurstID ?? tags.MediaUniqueID ?? null;
  }

  private getDateTimeOriginal(tags: ImmichTags | Tags | null) {
    if (!tags) {
      return null;
    }
    return exifDate(firstDateTime(tags as Tags, EXIF_DATE_TAGS));
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

  private getDuration(seconds?: ImmichTags['Duration']): string {
    let _seconds = seconds as number;

    if (typeof seconds === 'object') {
      _seconds = seconds.Value * (seconds?.Scale || 1);
    } else if (typeof seconds === 'string') {
      _seconds = Duration.fromISOTime(seconds).as('seconds');
    }

    return Duration.fromObject({ seconds: _seconds }).toFormat('hh:mm:ss.SSS');
  }

  private async processSidecar(id: string, isSync: boolean) {
    const [asset] = await this.assetRepository.getByIds([id]);

    if (!asset) {
      return false;
    }

    if (isSync && !asset.sidecarPath) {
      return false;
    }

    if (!isSync && (!asset.isVisible || asset.sidecarPath)) {
      return false;
    }

    const sidecarPath = `${asset.originalPath}.xmp`;
    const exists = await this.storageRepository.checkFileExists(sidecarPath, constants.R_OK);
    if (exists) {
      await this.assetRepository.save({ id: asset.id, sidecarPath });
      return true;
    }

    if (!isSync) {
      return false;
    }

    this.logger.debug(`Sidecar File '${sidecarPath}' was not found, removing sidecarPath for asset ${asset.id}`);
    await this.assetRepository.save({ id: asset.id, sidecarPath: null });

    return true;
  }
}
