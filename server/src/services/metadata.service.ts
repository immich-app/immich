import { Inject, Injectable } from '@nestjs/common';
import { ExifDateTime, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import _ from 'lodash';
import { Duration } from 'luxon';
import { constants } from 'node:fs/promises';
import path from 'node:path';
import { Subscription } from 'rxjs';
import { StorageCore } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { IAlbumRepository } from 'src/interfaces/album.interface';
import { IAssetRepository, WithoutProperty } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ClientEvent, IEventRepository } from 'src/interfaces/event.interface';
import {
  IBaseJob,
  IEntityJob,
  IJobRepository,
  ISidecarWriteJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobName,
  JobStatus,
  QueueName,
} from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMediaRepository } from 'src/interfaces/media.interface';
import { IMetadataRepository, ImmichTags } from 'src/interfaces/metadata.interface';
import { IMoveRepository } from 'src/interfaces/move.interface';
import { IPersonRepository } from 'src/interfaces/person.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository } from 'src/interfaces/user.interface';
import { handlePromiseError } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';

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
  private subscription: Subscription | null = null;

  constructor(
    @Inject(IAlbumRepository) private albumRepository: IAlbumRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IMediaRepository) private mediaRepository: IMediaRepository,
    @Inject(IMetadataRepository) private repository: IMetadataRepository,
    @Inject(IMoveRepository) moveRepository: IMoveRepository,
    @Inject(IPersonRepository) personRepository: IPersonRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
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

  async init() {
    if (!this.subscription) {
      this.subscription = this.configCore.config$.subscribe(() => handlePromiseError(this.init(), this.logger));
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
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return JobStatus.FAILED;
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
    await this.assetRepository.update({
      id: asset.id,
      duration: tags.Duration ? this.getDuration(tags.Duration) : null,
      localDateTime,
      fileCreatedAt: exifData.dateTimeOriginal ?? undefined,
    });

    await this.assetRepository.upsertJobStatus({
      assetId: asset.id,
      metadataExtractedAt: new Date(),
    });

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

  async handleSidecarWrite(job: ISidecarWriteJob): Promise<JobStatus> {
    const { id, description, dateTimeOriginal, latitude, longitude } = job;
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset) {
      return JobStatus.FAILED;
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
    const { reverseGeocoding } = await this.configCore.getConfig();
    if (!reverseGeocoding.enabled || !longitude || !latitude) {
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

      let motionAsset = await this.assetRepository.getByChecksum(asset.libraryId, checksum);
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
          originalFileName: asset.originalFileName,
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
          await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.livePhotoVideoId } });
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
      profileDescription: tags.ProfileDescription || null,
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
