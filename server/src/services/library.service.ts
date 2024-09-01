import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { R_OK } from 'node:constants';
import path, { basename, parse } from 'node:path';
import picomatch from 'picomatch';
import { StorageCore } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnEmit } from 'src/decorators';
import { AssetTrashReason } from 'src/dtos/asset.dto';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryImportPathResponseDto,
  ValidateLibraryResponseDto,
  mapLibrary,
} from 'src/dtos/library.dto';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetType } from 'src/enum';
import { IAssetRepository } from 'src/interfaces/asset.interface';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ArgOf } from 'src/interfaces/event.interface';
import {
  IEntityJob,
  IJobRepository,
  ILibraryFileJob,
  ILibraryOfflineJob,
  JOBS_LIBRARY_PAGINATION_SIZE,
  JobName,
  JobStatus,
} from 'src/interfaces/job.interface';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';
import { usePagination } from 'src/utils/pagination';
import { validateCronExpression } from 'src/validation';

@Injectable()
export class LibraryService {
  private configCore: SystemConfigCore;
  private watchLibraries = false;
  private watchLock = false;
  private watchers: Record<string, () => Promise<void>> = {};

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private repository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(LibraryService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  @OnEmit({ event: 'app.bootstrap' })
  async onBootstrap() {
    const config = await this.configCore.getConfig({ withCache: false });

    const { watch, scan } = config.library;

    // This ensures that library watching only occurs in one microservice
    // TODO: we could make the lock be per-library instead of global
    this.watchLock = await this.databaseRepository.tryLock(DatabaseLock.LibraryWatch);

    this.watchLibraries = this.watchLock && watch.enabled;

    this.jobRepository.addCronJob(
      'libraryScan',
      scan.cronExpression,
      () => handlePromiseError(this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL }), this.logger),
      scan.enabled,
    );

    if (this.watchLibraries) {
      await this.watchAll();
    }

    this.configCore.config$.subscribe(({ library }) => {
      this.jobRepository.updateCronJob('libraryScan', library.scan.cronExpression, library.scan.enabled);

      if (library.watch.enabled !== this.watchLibraries) {
        // Watch configuration changed, update accordingly
        this.watchLibraries = library.watch.enabled;
        handlePromiseError(this.watchLibraries ? this.watchAll() : this.unwatchAll(), this.logger);
      }
    });
  }

  @OnEmit({ event: 'config.validate' })
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
              await this.scanAssets(library.id, [path], library.ownerId);
            }
          };
          return handlePromiseError(handler(), this.logger);
        },
        onChange: (path) => {
          const handler = async () => {
            this.logger.debug(`Detected file change for ${path} in library ${library.id}`);
            if (matcher(path)) {
              // Note: if the changed file was not previously imported, it will be imported now.
              await this.scanAssets(library.id, [path], library.ownerId);
            }
          };
          return handlePromiseError(handler(), this.logger);
        },
        onUnlink: (path) => {
          const handler = async () => {
            this.logger.debug(`Detected deleted file at ${path} in library ${library.id}`);
            const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, path);
            if (asset && matcher(path)) {
              await this.scanAssets(library.id, [path], library.ownerId);
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

  @OnEmit({ event: 'app.shutdown' })
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

    const libraries = await this.repository.getAll(false);
    for (const library of libraries) {
      await this.watch(library.id);
    }
  }

  async getStatistics(id: string): Promise<LibraryStatsResponseDto> {
    const statistics = await this.repository.getStatistics(id);
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
    const libraries = await this.repository.getAll(false);
    return libraries.map((library) => mapLibrary(library));
  }

  async handleQueueCleanup(): Promise<JobStatus> {
    this.logger.debug('Cleaning up any pending library deletions');
    const pendingDeletion = await this.repository.getAllDeleted();
    await this.jobRepository.queueAll(
      pendingDeletion.map((libraryToDelete) => ({ name: JobName.LIBRARY_DELETE, data: { id: libraryToDelete.id } })),
    );
    return JobStatus.SUCCESS;
  }

  async create(dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const library = await this.repository.create({
      ownerId: dto.ownerId,
      name: dto.name ?? 'New External Library',
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? ['**/@eaDir/**', '**/._*'],
    });
    return mapLibrary(library);
  }

  private async scanAssets(libraryId: string, assetPaths: string[], ownerId: string) {
    await this.jobRepository.queueAll(
      assetPaths.map((assetPath) => ({
        name: JobName.LIBRARY_REFRESH_ASSET,
        data: {
          id: libraryId,
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
    const library = await this.repository.update({ id, ...dto });

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

    await this.repository.softDelete(id);
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
      assetsFound = true;
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
      await this.repository.delete(libraryId);
    }
    return JobStatus.SUCCESS;
  }

  private async getMtime(path: string): Promise<Date> {
    try {
      const stat = await this.storageRepository.stat(path);
      return stat.mtime;
    } catch (error: Error | any) {
      throw new BadRequestException(`Cannot access file ${path}`, { cause: error });
    }
  }

  private async refreshExistingAsset(asset: AssetEntity) {
    if (asset.trashReason == AssetTrashReason.DELETED) {
      this.logger.debug(`Asset is previously trashed by user, won't refresh: ${asset.originalPath}`);
      return JobStatus.SKIPPED;
    } else if (asset.trashReason == AssetTrashReason.OFFLINE) {
      this.logger.debug(`Asset is previously trashed as offline, restoring from trash: ${asset.originalPath}`);
      await this.assetRepository.restoreAll([asset.id]);
      return JobStatus.SUCCESS;
    }

    const mtime = await this.getMtime(asset.originalPath);
    if (mtime.toISOString() === asset.fileModifiedAt.toISOString()) {
      this.logger.debug(`Asset already exists in database and on disk, will not import: ${asset.originalPath}`);
      return JobStatus.SKIPPED;
    }
    this.logger.debug(
      `File modification time has changed, re-importing asset: ${asset.originalPath}. Old mtime: ${asset.fileModifiedAt}. New mtime: ${mtime}`,
    );

    await this.assetRepository.updateAll([asset.id], {
      fileCreatedAt: mtime,
      fileModifiedAt: mtime,
      originalFileName: parse(asset.originalPath).base,
      deletedAt: null,
      trashReason: null,
    });
  }

  async handleAssetRefresh(job: ILibraryFileJob): Promise<JobStatus> {
    const assetPath = path.normalize(job.assetPath);

    let asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.id, assetPath);

    if (asset) {
      const status = await this.refreshExistingAsset(asset);

      if (status) {
        return status;
      }
    } else {
      // This asset is new to us, read it from disk
      this.logger.log(`Importing new library asset: ${assetPath}`);

      const library = await this.repository.get(job.id, true);
      if (library?.deletedAt) {
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

      let assetType: AssetType;

      if (mimeTypes.isImage(assetPath)) {
        assetType = AssetType.IMAGE;
      } else if (mimeTypes.isVideo(assetPath)) {
        assetType = AssetType.VIDEO;
      } else {
        throw new BadRequestException(`Unsupported file type ${assetPath}`);
      }

      const mtime = await this.getMtime(assetPath);

      // TODO: In wait of refactoring the domain asset service, this function is just manually written like this
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
    }

    this.logger.debug(`Queueing metadata extraction for: ${assetPath}`);

    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id, source: 'upload' } });

    if (asset.type === AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: asset.id } });
    }

    return JobStatus.SUCCESS;
  }

  async queueScan(id: string) {
    await this.findOrFail(id);

    await this.jobRepository.queue({
      name: JobName.LIBRARY_QUEUE_SCAN,
      data: {
        id,
      },
    });
    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_OFFLINE_CHECK, data: { id } });
  }

  async queueOfflineCheck(id: string) {
    this.logger.verbose(`Queueing offline file removal from library ${id}`);
    await this.jobRepository.queue({ name: JobName.LIBRARY_OFFLINE_CHECK, data: { id } });
  }

  async handleQueueAllScan(): Promise<JobStatus> {
    this.logger.debug(`Refreshing all external libraries`);

    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_CLEANUP, data: {} });

    const libraries = await this.repository.getAll(true);
    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LIBRARY_QUEUE_SCAN,
        data: {
          id: library.id,
        },
      })),
    );
    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LIBRARY_QUEUE_OFFLINE_CHECK,
        data: {
          id: library.id,
        },
      })),
    );
    return JobStatus.SUCCESS;
  }

  async handleAssetOfflineCheck(job: ILibraryOfflineJob): Promise<JobStatus> {
    const asset = await this.assetRepository.getById(job.id);

    if (!asset || asset.trashReason) {
      // Skip if asset is missing or already trashed
      // We don't want to trash an asset that has already been trashed because it can otherwise re-appear on the timeline if an asset is re-imported
      return JobStatus.SKIPPED;
    }

    const markOffline = async (explanation: string) => {
      this.logger.debug(`${explanation}, removing: ${asset.originalPath}`);

      await this.assetRepository.updateAll([asset.id], { trashReason: AssetTrashReason.OFFLINE });
      await this.assetRepository.softDeleteAll([asset.id]);
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

    const fileExists = await this.storageRepository.checkFileExists(asset.originalPath, R_OK);
    if (!fileExists) {
      await markOffline('Asset is no longer on disk');
      return JobStatus.SUCCESS;
    }

    this.logger.verbose(
      `Asset is found on disk, not covered by an exclusion pattern, and is in an import path, doing nothing: ${asset.originalPath}`,
    );

    return JobStatus.SUCCESS;
  }

  async handleQueueAssetRefresh(job: IEntityJob): Promise<JobStatus> {
    const library = await this.repository.get(job.id);
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

    if (validImportPaths) {
      const assetsOnDisk = this.storageRepository.walk({
        pathsToCrawl: validImportPaths,
        includeHidden: false,
        exclusionPatterns: library.exclusionPatterns,
        take: JOBS_LIBRARY_PAGINATION_SIZE,
      });

      let crawledAssets = 0;

      for await (const assetBatch of assetsOnDisk) {
        crawledAssets += assetBatch.length;
        this.logger.debug(`Discovered ${crawledAssets} asset(s) on disk for library ${library.id}...`);
        await this.scanAssets(job.id, assetBatch, library.ownerId);
        this.logger.verbose(`Queued scan of ${assetBatch.length} crawled asset(s) in library ${library.id}...`);
      }

      if (crawledAssets) {
        this.logger.debug(`Finished queueing scan of ${crawledAssets} assets on disk for library ${library.id}`);
      } else {
        this.logger.debug(`No non-excluded assets found in any import path for library ${library.id}`);
      }
    } else {
      this.logger.warn(`No valid import paths found for library ${library.id}`);
    }

    await this.repository.update({ id: job.id, refreshedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  async handleQueueAssetOfflineCheck(job: IEntityJob): Promise<JobStatus> {
    const library = await this.repository.get(job.id);
    if (!library) {
      return JobStatus.SKIPPED;
    }

    this.logger.log(`Scanning library ${library.id} for removed assets`);

    const onlineAssets = usePagination(JOBS_LIBRARY_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getAll(pagination, { libraryId: job.id }),
    );

    let assetCount = 0;
    for await (const assets of onlineAssets) {
      assetCount += assets.length;
      this.logger.debug(`Discovered ${assetCount} asset(s) in library ${library.id}...`);
      await this.jobRepository.queueAll(
        assets.map((asset) => ({
          name: JobName.LIBRARY_OFFLINE_CHECK,
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
    const library = await this.repository.get(id);
    if (!library) {
      throw new BadRequestException('Library not found');
    }
    return library;
  }
}
