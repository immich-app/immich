import { BadRequestException, Injectable } from '@nestjs/common';
import { R_OK } from 'node:constants';
import path, { basename, isAbsolute, parse } from 'node:path';
import picomatch from 'picomatch';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  mapLibrary,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryImportPathResponseDto,
  ValidateLibraryResponseDto,
} from 'src/dtos/library.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { LibraryEntity } from 'src/entities/library.entity';
import { AssetStatus, AssetType, ImmichWorker } from 'src/enum';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
import { JobName, JobOf, JOBS_LIBRARY_PAGINATION_SIZE, JobStatus, QueueName } from 'src/interfaces/job.interface';
import { AssetSyncResult } from 'src/interfaces/library.interface';
import { BaseService } from 'src/services/base.service';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';

@Injectable()
export class LibraryService extends BaseService {
  private watchLibraries = false;
  private lock = false;
  private watchers: Record<string, () => Promise<void>> = {};

  @OnEvent({ name: 'config.init', workers: [ImmichWorker.MICROSERVICES] })
  async onConfigInit({
    newConfig: {
      library: { watch, scan },
    },
  }: ArgOf<'config.init'>) {
    // This ensures that library watching only occurs in one microservice
    this.lock = await this.databaseRepository.tryLock(DatabaseLock.Library);

    this.watchLibraries = this.lock && watch.enabled;

    if (this.lock) {
      this.cronRepository.create({
        name: 'libraryScan',
        expression: scan.cronExpression,
        onTick: () =>
          handlePromiseError(this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SYNC_ALL }), this.logger),
        start: scan.enabled,
      });
    }

    if (this.watchLibraries) {
      await this.watchAll();
    }
  }

  @OnEvent({ name: 'config.update', server: true })
  async onConfigUpdate({ newConfig: { library } }: ArgOf<'config.update'>) {
    if (!this.lock) {
      return;
    }

    this.cronRepository.update({
      name: 'libraryScan',
      expression: library.scan.cronExpression,
      start: library.scan.enabled,
    });

    if (library.watch.enabled !== this.watchLibraries) {
      // Watch configuration changed, update accordingly
      this.watchLibraries = library.watch.enabled;
      await (this.watchLibraries ? this.watchAll() : this.unwatchAll());
    }
  }

  private async watch(id: string): Promise<boolean> {
    if (!this.watchLibraries) {
      return false;
    }

    const library = await this.findOrFail(id);
    if (library.importPaths.length === 0) {
      return false;
    }

    await this.unwatch(id);

    this.logger.log(`Starting to watch library ${library.id} with import path(s) ${library.importPaths}`);

    const matcher = picomatch(`**/*{${mimeTypes.getSupportedFileExtensions().join(',')}}`, {
      nocase: true,
      ignore: library.exclusionPatterns,
    });

    let _resolve: () => void;
    const ready$ = new Promise<void>((resolve) => (_resolve = resolve));

    const handler = async (event: string, path: string) => {
      if (matcher(path)) {
        this.logger.debug(`File ${event} event received for ${path} in library ${library.id}}`);
        await this.syncFiles(library, [path]);
      } else {
        this.logger.verbose(`Ignoring file ${event} event for ${path} in library ${library.id}`);
      }
    };

    this.watchers[id] = this.storageRepository.watch(
      library.importPaths,
      {
        usePolling: false,
        ignoreInitial: true,
      },
      {
        onReady: () => _resolve(),
        onAdd: (path) => {
          return handlePromiseError(handler('add', path), this.logger);
        },
        onChange: (path) => {
          return handlePromiseError(handler('change', path), this.logger);
        },
        onUnlink: (path) => {
          return handlePromiseError(handler('delete', path), this.logger);
        },
        onError: (error) => {
          this.logger.error(`Library watcher for library ${library.id} encountered error: ${error}`);
        },
      },
    );

    // Wait for the watcher to initialize before returning
    await ready$;

    return true;
  }

  async unwatch(id: string) {
    if (this.watchers[id]) {
      await this.watchers[id]();
      delete this.watchers[id];
    }
  }

  @OnEvent({ name: 'app.shutdown' })
  async onShutdown() {
    await this.unwatchAll();
  }

  private async unwatchAll() {
    if (!this.lock) {
      return false;
    }

    for (const id in this.watchers) {
      await this.unwatch(id);
    }
  }

  async watchAll() {
    if (!this.lock) {
      return false;
    }

    const libraries = await this.libraryRepository.getAll(false);
    for (const library of libraries) {
      await this.watch(library.id);
    }
  }

  async getStatistics(id: string): Promise<LibraryStatsResponseDto> {
    const statistics = await this.libraryRepository.getStatistics(id);
    if (!statistics) {
      throw new BadRequestException(`Library ${id} not found`);
    }
    return statistics;
  }

  async get(id: string): Promise<LibraryResponseDto> {
    const library = await this.findOrFail(id);
    return mapLibrary(library);
  }

  async getAll(): Promise<LibraryResponseDto[]> {
    const libraries = await this.libraryRepository.getAll(false);
    return libraries.map((library) => mapLibrary(library));
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_CLEANUP, queue: QueueName.LIBRARY })
  async handleQueueCleanup(): Promise<JobStatus> {
    this.logger.debug('Cleaning up any pending library deletions');
    const pendingDeletion = await this.libraryRepository.getAllDeleted();
    await this.jobRepository.queueAll(
      pendingDeletion.map((libraryToDelete) => ({ name: JobName.LIBRARY_DELETE, data: { id: libraryToDelete.id } })),
    );
    return JobStatus.SUCCESS;
  }

  async create(dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const library = await this.libraryRepository.create({
      ownerId: dto.ownerId,
      name: dto.name ?? 'New External Library',
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? ['**/@eaDir/**', '**/._*'],
    });
    return mapLibrary(library);
  }

  private async syncFiles({ id, ownerId }: LibraryEntity, assetPaths: string[]) {
    await this.jobRepository.queueAll(
      assetPaths.map((assetPath) => ({
        name: JobName.LIBRARY_SYNC_FILE,
        data: {
          libraryId: id,
          assetPath,
          ownerId,
        },
      })),
    );
  }

  private async validateImportPath(importPath: string): Promise<ValidateLibraryImportPathResponseDto> {
    const validation = new ValidateLibraryImportPathResponseDto();
    validation.importPath = importPath;

    if (StorageCore.isImmichPath(importPath)) {
      validation.message = 'Cannot use media upload folder for external libraries';
      return validation;
    }

    if (!isAbsolute(importPath)) {
      validation.message = `Import path must be absolute, try ${path.resolve(importPath)}`;
      return validation;
    }

    try {
      const stat = await this.storageRepository.stat(importPath);
      if (!stat.isDirectory()) {
        validation.message = 'Not a directory';
        return validation;
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        validation.message = 'Path does not exist (ENOENT)';
        return validation;
      }
      validation.message = String(error);
      return validation;
    }

    const access = await this.storageRepository.checkFileExists(importPath, R_OK);

    if (!access) {
      validation.message = 'Lacking read permission for folder';
      return validation;
    }

    validation.isValid = true;
    return validation;
  }

  async validate(id: string, dto: ValidateLibraryDto): Promise<ValidateLibraryResponseDto> {
    const importPaths = await Promise.all(
      (dto.importPaths || []).map((importPath) => this.validateImportPath(importPath)),
    );
    return { importPaths };
  }

  async update(id: string, dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    await this.findOrFail(id);

    if (dto.importPaths) {
      const validation = await this.validate(id, { importPaths: dto.importPaths });
      if (validation.importPaths) {
        for (const path of validation.importPaths) {
          if (!path.isValid) {
            throw new BadRequestException(`Invalid import path: ${path.message}`);
          }
        }
      }
    }

    const library = await this.libraryRepository.update({ id, ...dto });
    return mapLibrary(library);
  }

  async delete(id: string) {
    await this.findOrFail(id);

    if (this.watchLibraries) {
      await this.unwatch(id);
    }

    await this.libraryRepository.softDelete(id);
    await this.jobRepository.queue({ name: JobName.LIBRARY_DELETE, data: { id } });
  }

  @OnJob({ name: JobName.LIBRARY_DELETE, queue: QueueName.LIBRARY })
  async handleDeleteLibrary(job: JobOf<JobName.LIBRARY_DELETE>): Promise<JobStatus> {
    const libraryId = job.id;

    const assetPagination = usePagination(JOBS_LIBRARY_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { libraryId, withDeleted: true }),
    );

    let assetsFound = false;

    this.logger.debug(`Will delete all assets in library ${libraryId}`);
    for await (const assets of assetPagination) {
      if (assets.length > 0) {
        assetsFound = true;
      }

      this.logger.debug(`Queueing deletion of ${assets.length} asset(s) in library ${libraryId}`);
      await this.jobRepository.queueAll(
        assets.map((asset) => ({
          name: JobName.ASSET_DELETION,
          data: {
            id: asset.id,
            deleteOnDisk: false,
          },
        })),
      );
    }

    if (!assetsFound) {
      this.logger.log(`Deleting library ${libraryId}`);
      await this.libraryRepository.delete(libraryId);
    }
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_SYNC_FILE, queue: QueueName.LIBRARY })
  async handleSyncFile(job: JobOf<JobName.LIBRARY_SYNC_FILE>): Promise<JobStatus> {
    // Only needs to handle new assets
    const assetPath = path.normalize(job.assetPath);

    // TODO: we can replace this get call with an exists call
    let asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, assetPath);
    if (asset) {
      return await this.handleSyncAssets({ ids: [asset.id] });
    }

    let stat;
    try {
      stat = await this.storageRepository.stat(assetPath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.error(`File not found: ${assetPath}`);
        return JobStatus.SKIPPED;
      }
      this.logger.error(`Error reading file: ${assetPath}. Error: ${error}`);
      return JobStatus.FAILED;
    }

    this.logger.log(`Importing new library asset: ${assetPath}`);

    const library = await this.libraryRepository.get(job.libraryId, true);
    if (!library || library.deletedAt) {
      this.logger.error('Cannot import asset into deleted library');
      return JobStatus.FAILED;
    }

    // TODO: device asset id is deprecated, remove it
    const deviceAssetId = `${basename(assetPath)}`.replaceAll(/\s+/g, '');

    const pathHash = this.cryptoRepository.hashSha1(`path:${assetPath}`);

    // TODO: doesn't xmp replace the file extension? Will need investigation
    let sidecarPath: string | null = null;
    if (await this.storageRepository.checkFileExists(`${assetPath}.xmp`, R_OK)) {
      sidecarPath = `${assetPath}.xmp`;
    }

    const assetType = mimeTypes.isVideo(assetPath) ? AssetType.VIDEO : AssetType.IMAGE;

    const mtime = stat.mtime;

    asset = await this.assetRepository.create({
      ownerId: job.ownerId,
      libraryId: job.libraryId,
      checksum: pathHash,
      originalPath: assetPath,
      deviceAssetId,
      deviceId: 'Library Import',
      fileCreatedAt: mtime,
      fileModifiedAt: mtime,
      localDateTime: mtime,
      type: assetType,
      originalFileName: parse(assetPath).base,

      sidecarPath,
      isExternal: true,
    });

    this.logger.debug(`Queueing metadata extraction for: ${asset.originalPath}`);

    await this.queuePostSyncJobs([asset.id]);

    return JobStatus.SUCCESS;
  }

  async queuePostSyncJobs(assetIds: string[]) {
    await this.jobRepository.queueAll(
      assetIds.map((assetId) => ({
        name: JobName.METADATA_EXTRACTION,
        data: { id: assetId, source: 'upload' },
      })),
    );
  }

  async queueScan(id: string) {
    await this.findOrFail(id);

    await this.jobRepository.queue({
      name: JobName.LIBRARY_QUEUE_SYNC_FILES,
      data: {
        id,
      },
    });
    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SYNC_ASSETS, data: { id } });
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_ALL, queue: QueueName.LIBRARY })
  async handleQueueSyncAll(): Promise<JobStatus> {
    this.logger.debug(`Refreshing all external libraries`);

    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_CLEANUP, data: {} });

    const libraries = await this.libraryRepository.getAll(true);
    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LIBRARY_QUEUE_SYNC_FILES,
        data: {
          id: library.id,
        },
      })),
    );
    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LIBRARY_QUEUE_SYNC_ASSETS,
        data: {
          id: library.id,
        },
      })),
    );
    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_SYNC_ASSETS, queue: QueueName.LIBRARY })
  async handleSyncAssets(job: JobOf<JobName.LIBRARY_SYNC_ASSETS>): Promise<JobStatus> {
    const assets = await this.assetRepository.getByIds(job.ids);

    const assetIdsToOffline: string[] = [];
    const assetIdsToUpdate: string[] = [];

    for (const asset of assets) {
      const action = await this.handleSyncAsset(asset);
      switch (action) {
        case AssetSyncResult.OFFLINE:
          assetIdsToOffline.push(asset.id);
          break;
        case AssetSyncResult.UPDATE:
          assetIdsToUpdate.push(asset.id);
          break;
      }
    }

    if (assetIdsToOffline.length) {
      await this.assetRepository.updateAll(assetIdsToOffline, { isOffline: true, deletedAt: new Date() });
    }

    if (assetIdsToUpdate.length) {
      //TODO: When we have asset status, we need to leave deletedAt as is when status is trashed
      await this.assetRepository.updateAll(assetIdsToUpdate, {
        isOffline: false,
        deletedAt: null,
      });

      await this.queuePostSyncJobs(assetIdsToUpdate);
    }

    return JobStatus.SUCCESS;
  }

  private async checkOfflineAsset(asset: AssetEntity) {
    if (!asset.libraryId) {
      return false;
    }

    const library = await this.libraryRepository.get(asset.libraryId);
    if (!library) {
      return false;
    }

    const isInImportPath = library.importPaths.find((path) => asset.originalPath.startsWith(path));
    if (!isInImportPath) {
      return false;
    }

    const isExcluded = library.exclusionPatterns.some((pattern) => picomatch.isMatch(asset.originalPath, pattern));
    if (isExcluded) {
      return false;
    }

    return true;
  }

  private async handleSyncAsset(asset: AssetEntity): Promise<AssetSyncResult> {
    if (!asset) {
      return AssetSyncResult.DO_NOTHING;
    }

    let stat;
    try {
      stat = await this.storageRepository.stat(asset.originalPath);
    } catch {
      if (asset.isOffline) {
        return AssetSyncResult.DO_NOTHING;
      }

      this.logger.debug(
        `Asset is no longer on disk or is inaccessible because of permissions, moving to trash: ${asset.originalPath}`,
      );
      return AssetSyncResult.OFFLINE;
    }

    const mtime = stat.mtime;
    const isAssetModified = mtime.toISOString() !== asset.fileModifiedAt.toISOString();
    let shouldAssetGoOnline = false;

    if (asset.isOffline && asset.status != AssetStatus.DELETED) {
      // Only perform the expensive check if the asset is offline
      shouldAssetGoOnline = await this.checkOfflineAsset(asset);
    }

    if (shouldAssetGoOnline || isAssetModified) {
      this.logger.debug(`Asset was offline or modified, updating asset record ${asset.originalPath}`);

      return AssetSyncResult.UPDATE;
    }

    return AssetSyncResult.DO_NOTHING;
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_FILES, queue: QueueName.LIBRARY })
  async handleQueueSyncFiles(job: JobOf<JobName.LIBRARY_QUEUE_SYNC_FILES>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      this.logger.debug(`Library ${job.id} not found, skipping refresh`);
      return JobStatus.SKIPPED;
    }

    this.logger.log(`Refreshing library ${library.id} for new assets`);

    const validImportPaths: string[] = [];

    for (const importPath of library.importPaths) {
      const validation = await this.validateImportPath(importPath);
      if (validation.isValid) {
        validImportPaths.push(path.normalize(importPath));
      } else {
        this.logger.warn(`Skipping invalid import path: ${importPath}. Reason: ${validation.message}`);
      }
    }

    if (validImportPaths.length === 0) {
      this.logger.warn(`No valid import paths found for library ${library.id}`);
    }

    const assetsOnDisk = this.storageRepository.walk({
      pathsToCrawl: validImportPaths,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
    });

    let count = 0;

    for await (const assetBatch of assetsOnDisk) {
      count += assetBatch.length;
      this.logger.debug(`Discovered ${count} asset(s) on disk for library ${library.id}...`);
      await this.syncFiles(library, assetBatch);
      this.logger.verbose(`Queued scan of ${assetBatch.length} crawled asset(s) in library ${library.id}...`);
    }

    if (count > 0) {
      this.logger.debug(`Finished queueing scan of ${count} assets on disk for library ${library.id}`);
    } else if (validImportPaths.length > 0) {
      this.logger.debug(`No non-excluded assets found in any import path for library ${library.id}`);
    }

    await this.libraryRepository.update({ id: job.id, refreshedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_ASSETS, queue: QueueName.LIBRARY })
  async handleQueueSyncAssets(job: JobOf<JobName.LIBRARY_QUEUE_SYNC_ASSETS>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      return JobStatus.SKIPPED;
    }

    this.logger.log(`Checking online assets in library ${library.id} against import path and exclusion patterns`);
    const offlineResult = await this.assetRepository.updateOffline(library.importPaths, library.exclusionPatterns);
    if (offlineResult.affected) {
      this.logger.debug(`Marked ${offlineResult.affected} assets as offline for library ${library.id}`);
    } else {
      this.logger.debug(`No assets marked as offline for library ${library.id}`);
    }

    this.logger.log(`Checking if assets in library ${library.id} are on disk`);

    const existingAssets = usePagination(JOBS_LIBRARY_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { libraryId: job.id, withDeleted: true }),
    );

    let assetCount = 0;
    for await (const assets of existingAssets) {
      assetCount += assets.length;

      this.logger.debug(`Checking ${assets.length} existing asset(s)...`);

      await this.jobRepository.queue({
        name: JobName.LIBRARY_SYNC_ASSETS,
        data: {
          ids: assets.map((asset) => asset.id),
        },
      });
    }

    if (assetCount) {
      this.logger.log(`Finished check of ${assetCount} online assets in library ${library.id}`);
    }

    return JobStatus.SUCCESS;
  }

  private async findOrFail(id: string) {
    const library = await this.libraryRepository.get(id);
    if (!library) {
      throw new BadRequestException('Library not found');
    }
    return library;
  }
}
