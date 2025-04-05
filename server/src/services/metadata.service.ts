import { Injectable } from '@nestjs/common';
import { ContainerDirectoryItem, Maybe, Tags } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import { Insertable } from 'kysely';
import _ from 'lodash';
import { Duration } from 'luxon';
import { Stats } from 'node:fs';
import path from 'node:path';
import { JOBS_ASSET_PAGINATION_SIZE, JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { Exif } from 'src/db';
import { OnEvent, OnJob } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetFileEntity, SidecarAssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { PersonEntity } from 'src/entities/person.entity';
import {
  AssetFileType,
  AssetType,
  CrawlType,
  DatabaseLock,
  ExifOrientation,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
  SourceType,
  StorageFolder,
} from 'src/enum';
import { WithoutProperty } from 'src/repositories/asset.repository';
import { ArgOf } from 'src/repositories/event.repository';
import { AssetSyncResult } from 'src/repositories/library.repository';
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

type Dates = {
  dateTimeOriginal: Date;
  localDateTime: Date;
};

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
      throw new Error(`Metadata service init failed`);
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

    const [exifTags, stats] = await Promise.all([
      this.getExifTags(asset),
      this.storageRepository.stat(asset.originalPath),
    ]);
    this.logger.verbose('Exif Tags', exifTags);

    const dates = this.getDates(asset, exifTags, stats);

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

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_QUEUE_SYNC_FILES, queue: QueueName.SIDECAR })
  async handleQueueSidecarSyncFiles(job: JobOf<JobName.SIDECAR_QUEUE_SYNC_FILES>): Promise<JobStatus> {
    const sidecarPaths = this.storageRepository.walk({
      pathsToCrawl: job.paths,
      includeHidden: false,
      crawlType: CrawlType.SIDECARS,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
      exclusionPatterns: job.exclusionPatterns,
    });

    let sidecarImportCount = 0;
    let sidecarCount = 0;

    for await (const chunk of sidecarPaths) {
      sidecarCount += chunk.length;

      const paths = await this.assetFileRepository.filterNewSidecarPaths(chunk);

      if (paths.length > 0) {
        sidecarImportCount += paths.length;

        await this.jobRepository.queue({
          name: JobName.SIDECAR_SYNC_FILES,
          data: {
            paths,
            progressCount: sidecarCount,
          },
        });

        this.logger.log(
          `Crawled ${sidecarCount} sidecar(s) so far: ${paths.length} of current batch of ${chunk.length} will be imported...`,
        );
      }
    }
    this.logger.log(
      `Finished sidecar crawl, ${sidecarCount} file(s) found on disk and queued ${sidecarImportCount} file(s) for import`,
    );

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_SYNC_FILES, queue: QueueName.SIDECAR })
  async handleSidecarSyncFiles(job: JobOf<JobName.SIDECAR_SYNC_FILES>): Promise<JobStatus> {
    this.logger.debug(`Sidecar sync files: ${job.paths}`);
    const sidecarImports = job.paths.map((sidecarPath) => ({
      path: path.normalize(sidecarPath),
      type: AssetFileType.SIDECAR,
    }));

    const sidecarIds: string[] = [];

    for (let i = 0; i < sidecarImports.length; i += 5000) {
      // Chunk the imports to avoid the postgres limit of max parameters at once
      const chunk = sidecarImports.slice(i, i + 5000);
      await this.assetFileRepository
        .createAll(chunk)
        .then((sidecars) => sidecarIds.push(...sidecars.map((sidecar) => sidecar.id)));
    }

    const progressMessage =
      job.progressCount && job.totalCount
        ? `(${job.progressCount} of ${job.totalCount})`
        : `(${job.progressCount} done so far)`;

    this.logger.log(`Imported ${sidecarIds.length} ${progressMessage} sidecar(s), queueing sidecar mapping`);

    await this.jobRepository.queueAll(sidecarIds.map((id) => ({ name: JobName.SIDECAR_MAPPING, data: { id } })));

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_QUEUE_SYNC_EXISTING, queue: QueueName.SIDECAR })
  async handleQueueSyncSidecarExisting(): Promise<JobStatus> {
    const totalCount = await this.assetFileRepository.getSidecarCount();
    if (!totalCount) {
      this.logger.log(`No known sidecars, no need to check`);
      return JobStatus.SUCCESS;
    }

    let chunk: string[] = [];
    let progressCount = 0;

    const queueChunk = async () => {
      if (chunk.length > 0) {
        progressCount += chunk.length;

        await this.jobRepository.queue({
          name: JobName.SIDECAR_SYNC_EXISTING,
          data: {
            ids: chunk.map((id) => id),
            progressCount,
            totalCount,
          },
        });
        chunk = [];

        const completePercentage = ((100 * progressCount) / totalCount).toFixed(1);

        this.logger.log(
          `Queued check of ${progressCount} of ${totalCount} (${completePercentage} %) existing sidecar(s) so far`,
        );
      }
    };

    this.logger.log(`Scanning for sidecars missing from disk...`);
    const existingSidecars = this.assetFileRepository.streamSidecarIds();

    for await (const asset of existingSidecars) {
      chunk.push(asset.id);
      if (chunk.length === JOBS_LIBRARY_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    this.logger.log(`Finished queuing ${progressCount} sidecar check(s)`);

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_QUEUE_SCAN, queue: QueueName.SIDECAR })
  async queueSidecarScan() {
    this.logger.log(`Starting to scan sidecars`);

    const paths = [StorageCore.getBaseFolder(StorageFolder.UPLOAD), StorageCore.getBaseFolder(StorageFolder.LIBRARY)];

    await this.jobRepository.queue({
      name: JobName.SIDECAR_QUEUE_SYNC_FILES,
      data: { paths },
    });

    await this.jobRepository.queue({ name: JobName.SIDECAR_QUEUE_SYNC_EXISTING, data: {} });
  }

  @OnJob({ name: JobName.SIDECAR_SYNC_EXISTING, queue: QueueName.SIDECAR })
  async handleSidecarSyncExisting(job: JobOf<JobName.SIDECAR_SYNC_EXISTING>): Promise<JobStatus> {
    const sidecars = await this.assetFileRepository.getByIds(job.ids);

    let removedSidecars = 0;
    const sidecarIdsToRemap: string[] = [];
    const assetsToUpdate: string[] = [];

    this.logger.debug(`Checking batch of ${sidecars.length} existing sidecar(s)`);

    const stats = await Promise.all(sidecars.map((asset) => this.storageRepository.stat(asset.path).catch(() => null)));

    for (let i = 0; i < sidecars.length; i++) {
      const sidecar = sidecars[i] as SidecarAssetFileEntity;
      const stat = stats[i];
      const action = this.checkExistingSidecar(sidecar, stat);
      switch (action) {
        case AssetSyncResult.OFFLINE: {
          this.logger.debug(`Will remove sidecar ${sidecar.path}`);
          await this.assetFileRepository.delete([sidecar]);
          await this.jobRepository.queue({ name: JobName.SIDECAR_ASSET_MAPPING, data: { id: sidecar.assetId } });
          removedSidecars++;
          break;
        }
        case AssetSyncResult.UPDATE: {
          this.logger.debug(`Sidecar ${sidecar.path} has been updated, checking...`);
          if (sidecar.assetId) {
            this.logger.verbose(
              `Sidecar ${sidecar.path} has been updated, queuing metadata extraction. Asset id: ${sidecar.assetId}`,
            );
            assetsToUpdate.push(sidecar.assetId);
          } else {
            this.logger.verbose(`Sidecar ${sidecar.path} has no asset id, queuing sidecar mapping`);
            sidecarIdsToRemap.push(sidecar.id);
          }
          break;
        }
        default: {
          this.logger.error(`Unknown sidecar asset sync result ${action} for sidecar ${sidecar.id}: ${sidecar.path}`);
          return JobStatus.FAILED;
        }
      }
      this.logger.debug(`Sidecar ${sidecar.path} has been checked`);
    }

    this.logger.debug(`Now checking batch of ${sidecars.length} existing sidecar(s)`);

    const promises = [];

    if (assetsToUpdate.length > 0) {
      promises.push(
        this.jobRepository.queueAll(assetsToUpdate.map((id) => ({ name: JobName.METADATA_EXTRACTION, data: { id } }))),
      );
    }

    if (sidecarIdsToRemap.length > 0) {
      promises.push(
        this.jobRepository.queueAll(sidecarIdsToRemap.map((id) => ({ name: JobName.SIDECAR_MAPPING, data: { id } }))),
      );
    }

    await Promise.all(promises);

    this.logger.debug(`Finished checking batch of ${sidecars.length} existing sidecar(s)`);

    const remainingCount = sidecars.length - removedSidecars - assetsToUpdate.length - sidecarIdsToRemap.length;

    let progress = '';
    if (job.progressCount && job.totalCount) {
      const cumulativePercentage = ((100 * job.progressCount) / job.totalCount).toFixed(1);
      progress = `(Total progress: ${job.progressCount} of ${job.totalCount}, ${cumulativePercentage} %) `;
    }

    this.logger.log(
      `Checked existing sidecar(s): ${removedSidecars} removed, ${assetsToUpdate.length} updated, ${sidecarIdsToRemap.length} remapped, ${remainingCount} unchanged of current batch of ${sidecars.length} ${progress}.`,
    );

    return JobStatus.SUCCESS;
  }

  private checkExistingSidecar(sidecar: SidecarAssetFileEntity, stat: Stats | null): AssetSyncResult {
    if (!stat) {
      // File not found on disk or permission error

      this.logger.debug(
        `Sidecar ${sidecar.path} is no longer on disk or is inaccessible because of permissions, removing`,
      );
      return AssetSyncResult.OFFLINE;
    }

    if (!sidecar.fileModifiedAt || stat.mtime.valueOf() !== sidecar.fileModifiedAt.valueOf()) {
      this.logger.verbose(
        `Sidecar ${sidecar.path} has new mtime: ${sidecar.fileModifiedAt} does not equal ${stat.mtime}`,
      );

      if (sidecar.fileModifiedAt) {
        const diff = Math.abs(stat.mtime.valueOf() - sidecar.fileModifiedAt.valueOf());
        this.logger.debug(`Modification time difference for sidecar ${sidecar.path}: ${diff}ms`);
      }

      return AssetSyncResult.UPDATE;
    }

    return AssetSyncResult.DO_NOTHING;
  }

  @OnJob({ name: JobName.SIDECAR_MAPPING, queue: QueueName.SIDECAR })
  async handleSidecarMapping(job: JobOf<JobName.SIDECAR_MAPPING>): Promise<JobStatus> {
    this.logger.debug(`Starting sidecar mapping of ${job.id}`);
    const sidecar = (await this.assetFileRepository.getById(job.id)) as SidecarAssetFileEntity | undefined;

    if (!sidecar || sidecar.type !== AssetFileType.SIDECAR) {
      return JobStatus.FAILED;
    }

    this.logger.debug(`Mapping sidecar ${sidecar.id}: ${sidecar.path}`);

    if (!sidecar.path.toLowerCase().endsWith('.xmp')) {
      this.logger.error(`Asset file sidecar path is missing .xmp extension: ${sidecar.path}`);
      return JobStatus.FAILED;
    }

    if (!sidecar.assetId) {
      const filePath = path.parse(sidecar.path);

      const assets = await this.assetRepository.getLikeOriginalPath(filePath.dir + '/' + filePath.name);

      if (assets.length === 0) {
        this.logger.verbose(`No matching asset found for sidecar ${sidecar.id}: ${sidecar.path}`);
        return JobStatus.SUCCESS;
      }

      if (assets.length !== 1) {
        this.logger.error(
          `Ambiguous sidecar, ignoring ${sidecar.id}: ${sidecar.path}. Please ensure there is at most one file matching this sidecar, found ${assets.map((asset) => asset.originalPath).join(', ')}`,
        );
        return JobStatus.FAILED;
      }

      this.logger.verbose(
        `Mapping sidecar ${sidecar.id}: ${sidecar.path} to asset ${assets[0].id}: ${assets[0].originalPath}`,
      );

      await this.assetFileRepository.update({ ...sidecar, assetId: assets[0].id });
    }

    await this.jobRepository.queue({
      name: JobName.METADATA_EXTRACTION,
      data: { id: sidecar.assetId, source: 'upload' },
    });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.SIDECAR_ASSET_MAPPING, queue: QueueName.SIDECAR })
  async handleAssetSidecarMapping(job: JobOf<JobName.SIDECAR_ASSET_MAPPING>): Promise<JobStatus> {
    this.logger.debug(`Starting sidecar asset mapping of ${job.id}`);
    const asset = await this.assetRepository.getById(job.id);

    if (!asset) {
      return JobStatus.FAILED;
    }

    this.logger.debug(`Asset: ${asset.id}: ${asset.originalPath}`);

    const filePath = path.parse(asset.originalPath);
    const pathWithoutExtension = filePath.dir + '/' + filePath.name;

    const sidecars = await this.assetFileRepository.getSidecarsLikePath(pathWithoutExtension);

    for (const sidecar of sidecars) {
      if (!sidecar.assetId) {
        this.logger.debug(`Storing asset mapping sidecar: ${JSON.stringify(sidecar)}`);
        await this.assetFileRepository.update({ ...sidecar, assetId: asset.id });
      }
    }

    await this.jobRepository.queue({
      name: JobName.METADATA_EXTRACTION,
      data: { id: asset.id, source: 'upload' },
    });

    return JobStatus.SUCCESS;
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

    const sidecarPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (options) =>
      this.assetFileRepository.getAll(options, { assetId: asset.id, type: AssetFileType.SIDECAR }),
    );

    const sidecars: SidecarAssetFileEntity[] = [];

    for await (const sidecar of sidecarPagination) {
      sidecars.push(...(sidecar as SidecarAssetFileEntity[]));
    }

    if (sidecars.length > 1) {
      this.logger.error(`Multiple sidecars found for asset ${asset.id}: ${asset.originalPath}`);
      return JobStatus.FAILED;
    }

    const sidecar = sidecars[0];

    const sidecarPath = sidecar ? sidecar.path : `${asset.originalPath}.xmp`;
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

    if (!sidecar) {
      await this.assetFileRepository.upsert({ path: sidecarPath, assetId: asset.id, type: AssetFileType.SIDECAR });
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

  private async getExifTags(asset: AssetEntity): Promise<ImmichTags> {
    this.logger.verbose(`Getting exif tags for asset ${asset.id}: ${asset.originalPath}`);

    const sidecar = await this.assetFileRepository.getSidecarForAsset(asset.id);

    if (!sidecar && asset.type === AssetType.IMAGE) {
      const tagResult = await this.metadataRepository.readTags(asset.originalPath);
      if (tagResult.success) {
        return tagResult.tags;
      }
      return {};
    }

    return this.mergeExifTags(asset, sidecar);
  }

  private async mergeExifTags(asset: AssetEntity, sidecar: AssetFileEntity | null): Promise<ImmichTags> {
    this.logger.verbose(`Merging exif tags for asset ${asset.id}: ${asset.originalPath} and sidecar ${sidecar?.path}`);
    const [mediaTagResult, sidecarTagResult, sidecarStat, videoTags] = await Promise.all([
      this.metadataRepository.readTags(asset.originalPath),
      sidecar ? this.metadataRepository.readTags(sidecar.path) : null,
      sidecar ? this.storageRepository.stat(sidecar.path) : null,
      asset.type === AssetType.VIDEO ? this.getVideoTags(asset.originalPath) : null,
    ]);

    const mediaTags = mediaTagResult.success ? mediaTagResult.tags : {};

    const sidecarTags = sidecarTagResult?.success ? sidecarTagResult.tags : {};

    if (sidecar && !sidecarStat) {
      // Sidecar not found on disk, delete sidecar asset file from db
      // FIXME: deletion logic with muliple sidecars
      await this.assetFileRepository.delete([sidecar]);
    }

    if (sidecar && sidecarStat) {
      this.logger.verbose(`Sidecar is ${sidecar.path}. About to check sidecar dates for ${sidecar?.path}`);

      this.logger.debug(`Sidecar mtime is ${sidecarStat.mtime}, equals ${sidecarStat.mtime === sidecarStat.mtime}`);

      if (sidecar.fileModifiedAt !== sidecarStat.mtime) {
        this.logger.debug(
          `Updating sidecar fileModifiedAt for sidecar ${sidecar.path}: ${sidecar.fileModifiedAt} becomes ${sidecarStat.mtime}`,
        );
        await this.assetFileRepository.update({ ...sidecar, fileModifiedAt: sidecarStat.mtime });
      }

      if (sidecarTags) {
        // prefer dates from sidecar tags
        const sidecarDate = firstDateTime(sidecarTags as Tags, EXIF_DATE_TAGS);
        if (sidecarDate) {
          for (const tag of EXIF_DATE_TAGS) {
            delete mediaTags[tag];
          }
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

  private async applyMotionPhotos(asset: AssetEntity, tags: ImmichTags, dates: Dates, stats: Stats) {
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
        motionAsset = await this.assetRepository.create({
          id: motionAssetId,
          libraryId: asset.libraryId,
          type: AssetType.VIDEO,
          fileCreatedAt: dates.dateTimeOriginal,
          fileModifiedAt: stats.mtime,
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

  private getDates(asset: AssetEntity, exifTags: ImmichTags, stats: Stats) {
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

    let dateTimeOriginal = dateTime?.toDate();
    let localDateTime = dateTime?.toDateTime().setZone('UTC', { keepLocalTime: true }).toJSDate();
    if (!localDateTime || !dateTimeOriginal) {
      // FileCreateDate is not available on linux, likely because exiftool hasn't integrated the statx syscall yet
      // birthtime is not available in Docker on macOS, so it appears as 0
      const earliestDate = stats.birthtimeMs ? new Date(Math.min(stats.mtimeMs, stats.birthtimeMs)) : stats.mtime;
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
