import { BadRequestException, Injectable } from '@nestjs/common';
import { R_OK } from 'node:constants';
import path, { basename, parse } from 'node:path';
import picomatch from 'picomatch';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
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
import { AssetType } from 'src/enum';
import { DatabaseLock } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
import {
  IEntityJob,
  ILibraryAssetJob,
  ILibraryFileJob,
  JobName,
  JOBS_LIBRARY_PAGINATION_SIZE,
  JobStatus,
} from 'src/interfaces/job.interface';
import { BaseService } from 'src/services/base.service';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';
import { validateCronExpression } from 'src/validation';

@Injectable()
export class LibraryService extends BaseService {
  private watchLibraries = false;
  private watchLock = false;
  private watchers: Record<string, () => Promise<void>> = {};

  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap() {
    const config = await this.getConfig({ withCache: false });

    const { watch, scan } = config.library;

    // This ensures that library watching only occurs in one microservice
    // TODO: we could make the lock be per-library instead of global
    this.watchLock = await this.databaseRepository.tryLock(DatabaseLock.LibraryWatch);

    this.watchLibraries = this.watchLock && watch.enabled;

    this.jobRepository.addCronJob(
      'libraryScan',
      scan.cronExpression,
      () => handlePromiseError(this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SYNC_ALL }), this.logger),
      scan.enabled,
    );

    if (this.watchLibraries) {
      await this.watchAll();
    }
  }

  @OnEvent({ name: 'config.update', server: true })
  async onConfigUpdate({ newConfig: { library }, oldConfig }: ArgOf<'config.update'>) {
    if (!oldConfig || !this.watchLock) {
      return;
    }

    this.jobRepository.updateCronJob('libraryScan', library.scan.cronExpression, library.scan.enabled);

    if (library.watch.enabled !== this.watchLibraries) {
      // Watch configuration changed, update accordingly
      this.watchLibraries = library.watch.enabled;
      await (this.watchLibraries ? this.watchAll() : this.unwatchAll());
    }
  }

  @OnEvent({ name: 'config.validate' })
  onConfigValidate({ newConfig }: ArgOf<'config.validate'>) {
    const { scan } = newConfig.library;
    if (!validateCronExpression(scan.cronExpression)) {
      throw new Error(`Invalid cron expression ${scan.cronExpression}`);
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

    this.watchers[id] = this.storageRepository.watch(
      library.importPaths,
      {
        usePolling: false,
        ignoreInitial: true,
      },
      {
        onReady: () => _resolve(),
        onAdd: (path) => {
          const handler = async () => {
            this.logger.debug(`File add event received for ${path} in library ${library.id}}`);
            if (matcher(path)) {
              const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, path);
              if (asset) {
                await this.syncAssets(library, [asset.id]);
              }
              if (matcher(path)) {
                await this.syncFiles(library, [path]);
              }
            }
          };
          return handlePromiseError(handler(), this.logger);
        },
        onChange: (path) => {
          const handler = async () => {
            this.logger.debug(`Detected file change for ${path} in library ${library.id}`);
            const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, path);
            if (asset) {
              await this.syncAssets(library, [asset.id]);
            }
            if (matcher(path)) {
              // Note: if the changed file was not previously imported, it will be imported now.
              await this.syncFiles(library, [path]);
            }
          };
          return handlePromiseError(handler(), this.logger);
        },
        onUnlink: (path) => {
          const handler = async () => {
            this.logger.debug(`Detected deleted file at ${path} in library ${library.id}`);
            const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, path);
            if (asset) {
              await this.syncAssets(library, [asset.id]);
            }
          };
          return handlePromiseError(handler(), this.logger);
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
    if (!this.watchLock) {
      return false;
    }

    for (const id in this.watchers) {
      await this.unwatch(id);
    }
  }

  async watchAll() {
    if (!this.watchLock) {
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
          id,
          assetPath,
          ownerId,
        },
      })),
    );
  }

  private async syncAssets({ importPaths, exclusionPatterns }: LibraryEntity, assetIds: string[]) {
    await this.jobRepository.queueAll(
      assetIds.map((assetId) => ({
        name: JobName.LIBRARY_SYNC_ASSET,
        data: { id: assetId, importPaths, exclusionPatterns },
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
    const library = await this.libraryRepository.update({ id, ...dto });

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

  async handleDeleteLibrary(job: IEntityJob): Promise<JobStatus> {
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

  async handleSyncFile(job: ILibraryFileJob): Promise<JobStatus> {
    // Only needs to handle new assets
    const assetPath = path.normalize(job.assetPath);

    let asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.id, assetPath);
    if (asset) {
      return JobStatus.SKIPPED;
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

    const library = await this.libraryRepository.get(job.id, true);
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
      libraryId: job.id,
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

    await this.queuePostSyncJobs(asset);

    return JobStatus.SUCCESS;
  }

  async queuePostSyncJobs(asset: AssetEntity) {
    this.logger.debug(`Queueing metadata extraction for: ${asset.originalPath}`);

    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id, source: 'upload' } });
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

  async handleSyncAsset(job: ILibraryAssetJob): Promise<JobStatus> {
    const asset = await this.assetRepository.getById(job.id);
    if (!asset) {
      return JobStatus.SKIPPED;
    }

    const markOffline = async (explanation: string) => {
      if (!asset.isOffline) {
        this.logger.debug(`${explanation}, removing: ${asset.originalPath}`);
        await this.assetRepository.updateAll([asset.id], { isOffline: true, deletedAt: new Date() });
      }
    };

    const isInPath = job.importPaths.find((path) => asset.originalPath.startsWith(path));
    if (!isInPath) {
      await markOffline('Asset is no longer in an import path');
      return JobStatus.SUCCESS;
    }

    const isExcluded = job.exclusionPatterns.some((pattern) => picomatch.isMatch(asset.originalPath, pattern));
    if (isExcluded) {
      await markOffline('Asset is covered by an exclusion pattern');
      return JobStatus.SUCCESS;
    }

    let stat;
    try {
      stat = await this.storageRepository.stat(asset.originalPath);
    } catch {
      await markOffline('Asset is no longer on disk or is inaccessible because of permissions');
      return JobStatus.SUCCESS;
    }

    const mtime = stat.mtime;
    const isAssetModified = mtime.toISOString() !== asset.fileModifiedAt.toISOString();

    if (asset.isOffline || isAssetModified) {
      this.logger.debug(`Asset was offline or modified, updating asset record ${asset.originalPath}`);
      //TODO: When we have asset status, we need to leave deletedAt as is when status is trashed
      await this.assetRepository.updateAll([asset.id], {
        isOffline: false,
        deletedAt: null,
        fileCreatedAt: mtime,
        fileModifiedAt: mtime,
        originalFileName: parse(asset.originalPath).base,
      });
    }

    if (isAssetModified) {
      this.logger.debug(`Asset was modified, queuing metadata extraction for: ${asset.originalPath}`);
      await this.queuePostSyncJobs(asset);
    }
    return JobStatus.SUCCESS;
  }

  async handleQueueSyncFiles(job: IEntityJob): Promise<JobStatus> {
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

  async handleQueueSyncAssets(job: IEntityJob): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      return JobStatus.SKIPPED;
    }

    this.logger.log(`Scanning library ${library.id} for removed assets`);

    const onlineAssets = usePagination(JOBS_LIBRARY_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { libraryId: job.id, withDeleted: true }),
    );

    let assetCount = 0;
    for await (const assets of onlineAssets) {
      assetCount += assets.length;
      this.logger.debug(`Discovered ${assetCount} asset(s) in library ${library.id}...`);
      await this.jobRepository.queueAll(
        assets.map((asset) => ({
          name: JobName.LIBRARY_SYNC_ASSET,
          data: { id: asset.id, importPaths: library.importPaths, exclusionPatterns: library.exclusionPatterns },
        })),
      );
      this.logger.debug(`Queued check of ${assets.length} asset(s) in library ${library.id}...`);
    }

    if (assetCount) {
      this.logger.log(`Finished queueing check of ${assetCount} assets for library ${library.id}`);
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
