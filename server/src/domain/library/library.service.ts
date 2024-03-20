import { AssetEntity, AssetType, LibraryType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { R_OK } from 'node:constants';
import { EventEmitter } from 'node:events';
import { Stats } from 'node:fs';
import path, { basename, parse } from 'node:path';
import picomatch from 'picomatch';
import { AccessCore } from '../access';
import { mimeTypes } from '../domain.constant';
import { handlePromiseError, usePagination, validateCronExpression } from '../domain.util';
import {
  IBaseJob,
  IEntityJob,
  ILibraryFileJob,
  ILibraryOfflineJob,
  ILibraryRefreshJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobName,
} from '../job';
import {
  DatabaseLock,
  IAccessRepository,
  IAssetRepository,
  ICryptoRepository,
  IDatabaseRepository,
  IJobRepository,
  ILibraryRepository,
  IStorageRepository,
  ISystemConfigRepository,
  InternalEvent,
  InternalEventMap,
  JobStatus,
  StorageEventType,
  WithProperty,
} from '../repositories';
import { StorageCore } from '../storage';
import { SystemConfigCore } from '../system-config';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  ScanLibraryDto,
  SearchLibraryDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryImportPathResponseDto,
  ValidateLibraryResponseDto,
  mapLibrary,
} from './library.dto';

const LIBRARY_SCAN_BATCH_SIZE = 5000;

@Injectable()
export class LibraryService extends EventEmitter {
  readonly logger = new ImmichLogger(LibraryService.name);
  private access: AccessCore;
  private configCore: SystemConfigCore;
  private watchLibraries = false;
  private watchLock = false;
  private watchers: Record<string, () => Promise<void>> = {};

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private repository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
  ) {
    super();
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(configRepository);
  }

  async init() {
    const config = await this.configCore.getConfig();

    const { watch, scan } = config.library;

    // This ensures that library watching only occurs in one microservice
    // TODO: we could make the lock be per-library instead of global
    this.watchLock = await this.databaseRepository.tryLock(DatabaseLock.LibraryWatch);

    this.watchLibraries = this.watchLock && watch.enabled;

    this.jobRepository.addCronJob(
      'libraryScan',
      scan.cronExpression,
      () =>
        handlePromiseError(
          this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, data: { force: false } }),
          this.logger,
        ),
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

  @OnEvent(InternalEvent.VALIDATE_CONFIG)
  validateConfig({ newConfig }: InternalEventMap[InternalEvent.VALIDATE_CONFIG]) {
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

    if (library.type !== LibraryType.EXTERNAL) {
      throw new BadRequestException('Can only watch external libraries');
    } else if (library.importPaths.length === 0) {
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
              await this.scanAssets(library.id, [path], library.ownerId, false);
            }
            this.emit(StorageEventType.ADD, path);
          };
          return handlePromiseError(handler(), this.logger);
        },
        onChange: (path) => {
          const handler = async () => {
            this.logger.debug(`Detected file change for ${path} in library ${library.id}`);
            if (matcher(path)) {
              // Note: if the changed file was not previously imported, it will be imported now.
              await this.scanAssets(library.id, [path], library.ownerId, false);
            }
            this.emit(StorageEventType.CHANGE, path);
          };
          return handlePromiseError(handler(), this.logger);
        },
        onUnlink: (path) => {
          const handler = async () => {
            this.logger.debug(`Detected deleted file at ${path} in library ${library.id}`);
            const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, path);
            if (asset && matcher(path)) {
              await this.assetRepository.update({ id: asset.id, isOffline: true });
            }
            this.emit(StorageEventType.UNLINK, path);
          };
          return handlePromiseError(handler(), this.logger);
        },
        onError: (error) => {
          this.logger.error(`Library watcher for library ${library.id} encountered error: ${error}`);
          this.emit(StorageEventType.ERROR, error);
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

  async teardown() {
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

    const libraries = await this.repository.getAll(false, LibraryType.EXTERNAL);

    for (const library of libraries) {
      await this.watch(library.id);
    }
  }

  async getStatistics(id: string): Promise<LibraryStatsResponseDto> {
    await this.findOrFail(id);
    return this.repository.getStatistics(id);
  }

  async get(id: string): Promise<LibraryResponseDto> {
    const library = await this.findOrFail(id);
    return mapLibrary(library);
  }

  async getAll(dto: SearchLibraryDto): Promise<LibraryResponseDto[]> {
    const libraries = await this.repository.getAll(false, dto.type);
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
    switch (dto.type) {
      case LibraryType.EXTERNAL: {
        if (!dto.name) {
          dto.name = 'New External Library';
        }
        break;
      }
      case LibraryType.UPLOAD: {
        if (!dto.name) {
          dto.name = 'New Upload Library';
        }
        if (dto.importPaths && dto.importPaths.length > 0) {
          throw new BadRequestException('Upload libraries cannot have import paths');
        }
        if (dto.exclusionPatterns && dto.exclusionPatterns.length > 0) {
          throw new BadRequestException('Upload libraries cannot have exclusion patterns');
        }
        if (dto.isWatched) {
          throw new BadRequestException('Upload libraries cannot be watched');
        }
        break;
      }
    }

    const library = await this.repository.create({
      ownerId: dto.ownerId,
      name: dto.name,
      type: dto.type,
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? [],
      isVisible: dto.isVisible ?? true,
    });

    this.logger.log(`Creating ${dto.type} library for ${dto.ownerId}}`);

    if (dto.type === LibraryType.EXTERNAL) {
      await this.watch(library.id);
    }

    return mapLibrary(library);
  }

  private async scanAssets(libraryId: string, assetPaths: string[], ownerId: string, force = false) {
    this.logger.verbose(`Queuing refresh of ${assetPaths.length} asset(s)`);

    await this.jobRepository.queueAll(
      assetPaths.map((assetPath) => ({
        name: JobName.LIBRARY_SCAN_ASSET,
        data: {
          id: libraryId,
          assetPath: assetPath,
          ownerId,
          force,
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

    if (dto.importPaths || dto.exclusionPatterns) {
      // Re-watch library to use new paths and/or exclusion patterns
      await this.watch(id);
    }

    return mapLibrary(library);
  }

  async delete(id: string) {
    const library = await this.findOrFail(id);
    const uploadCount = await this.repository.getUploadLibraryCount(library.ownerId);
    if (library.type === LibraryType.UPLOAD && uploadCount <= 1) {
      throw new BadRequestException('Cannot delete the last upload library');
    }

    if (this.watchLibraries) {
      await this.unwatch(id);
    }

    await this.repository.softDelete(id);
    await this.jobRepository.queue({ name: JobName.LIBRARY_DELETE, data: { id } });
  }

  async handleDeleteLibrary(job: IEntityJob): Promise<JobStatus> {
    const library = await this.repository.get(job.id, true);
    if (!library) {
      return JobStatus.FAILED;
    }

    // TODO use pagination
    const assetIds = await this.repository.getAssetIds(job.id, true);
    this.logger.debug(`Will delete ${assetIds.length} asset(s) in library ${job.id}`);
    await this.jobRepository.queueAll(
      assetIds.map((assetId) => ({ name: JobName.ASSET_DELETION, data: { id: assetId, fromExternal: true } })),
    );

    if (assetIds.length === 0) {
      this.logger.log(`Deleting library ${job.id}`);
      await this.repository.delete(job.id);
    }
    return JobStatus.SUCCESS;
  }

  async handleAssetRefresh(job: ILibraryFileJob): Promise<JobStatus> {
    const assetPath = path.normalize(job.assetPath);

    const existingAssetEntity = await this.assetRepository.getByLibraryIdAndOriginalPath(job.id, assetPath);

    let stats: Stats;
    try {
      stats = await this.storageRepository.stat(assetPath);
    } catch (error: Error | any) {
      // Can't access file, probably offline
      if (existingAssetEntity) {
        // Mark asset as offline
        this.logger.debug(`Marking asset as offline: ${assetPath}`);

        await this.assetRepository.update({ id: existingAssetEntity.id, isOffline: true });
        return JobStatus.SUCCESS;
      } else {
        // File can't be accessed and does not already exist in db
        throw new BadRequestException('Cannot access file', { cause: error });
      }
    }

    let doImport = false;
    let doRefresh = false;

    if (job.force) {
      doRefresh = true;
    }

    if (!existingAssetEntity) {
      // This asset is new to us, read it from disk
      this.logger.debug(`Importing new asset: ${assetPath}`);
      doImport = true;
    } else if (stats.mtime.toISOString() !== existingAssetEntity.fileModifiedAt.toISOString()) {
      // File modification time has changed since last time we checked, re-read from disk
      this.logger.debug(
        `File modification time has changed, re-importing asset: ${assetPath}. Old mtime: ${existingAssetEntity.fileModifiedAt}. New mtime: ${stats.mtime}`,
      );
      doRefresh = true;
    } else if (!job.force && stats && !existingAssetEntity.isOffline) {
      // Asset exists on disk and in db and mtime has not changed. Also, we are not forcing refresn. Therefore, do nothing
      this.logger.debug(`Asset already exists in database and on disk, will not import: ${assetPath}`);
    }

    if (stats && existingAssetEntity?.isOffline) {
      // File was previously offline but is now online
      this.logger.debug(`Marking previously-offline asset as online: ${assetPath}`);
      await this.assetRepository.update({ id: existingAssetEntity.id, isOffline: false });
      doRefresh = true;
    }

    if (!doImport && !doRefresh) {
      // If we don't import, exit here
      return JobStatus.SKIPPED;
    }

    let assetType: AssetType;

    if (mimeTypes.isImage(assetPath)) {
      assetType = AssetType.IMAGE;
    } else if (mimeTypes.isVideo(assetPath)) {
      assetType = AssetType.VIDEO;
    } else {
      throw new BadRequestException(`Unsupported file type ${assetPath}`);
    }

    // TODO: doesn't xmp replace the file extension? Will need investigation
    let sidecarPath: string | null = null;
    if (await this.storageRepository.checkFileExists(`${assetPath}.xmp`, R_OK)) {
      sidecarPath = `${assetPath}.xmp`;
    }

    // TODO: device asset id is deprecated, remove it
    const deviceAssetId = `${basename(assetPath)}`.replaceAll(/\s+/g, '');

    let assetId;
    if (doImport) {
      const library = await this.repository.get(job.id, true);
      if (library?.deletedAt) {
        this.logger.error('Cannot import asset into deleted library');
        return JobStatus.FAILED;
      }

      const pathHash = this.cryptoRepository.hashSha1(`path:${assetPath}`);

      // TODO: In wait of refactoring the domain asset service, this function is just manually written like this
      const addedAsset = await this.assetRepository.create({
        ownerId: job.ownerId,
        libraryId: job.id,
        checksum: pathHash,
        originalPath: assetPath,
        deviceAssetId: deviceAssetId,
        deviceId: 'Library Import',
        fileCreatedAt: stats.mtime,
        fileModifiedAt: stats.mtime,
        localDateTime: stats.mtime,
        type: assetType,
        originalFileName: parse(assetPath).base,
        sidecarPath,
        isReadOnly: true,
        isExternal: true,
      });
      assetId = addedAsset.id;
    } else if (doRefresh && existingAssetEntity) {
      assetId = existingAssetEntity.id;
      await this.assetRepository.updateAll([existingAssetEntity.id], {
        fileCreatedAt: stats.mtime,
        fileModifiedAt: stats.mtime,
      });
    } else {
      // Not importing and not refreshing, do nothing
      return JobStatus.SKIPPED;
    }

    this.logger.debug(`Queuing metadata extraction for: ${assetPath}`);

    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: assetId, source: 'upload' } });

    if (assetType === AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: assetId } });
    }

    return JobStatus.SUCCESS;
  }

  async queueScan(id: string, dto: ScanLibraryDto) {
    const library = await this.findOrFail(id);
    if (library.type !== LibraryType.EXTERNAL) {
      throw new BadRequestException('Can only scan external libraries');
    }

    await this.jobRepository.queue({
      name: JobName.LIBRARY_SCAN,
      data: {
        id,
        refreshModifiedFiles: dto.refreshModifiedFiles ?? false,
        refreshAllFiles: dto.refreshAllFiles ?? false,
      },
    });
  }

  async queueRemoveOffline(id: string) {
    this.logger.verbose(`Removing offline files from library: ${id}`);
    await this.jobRepository.queue({ name: JobName.LIBRARY_REMOVE_OFFLINE, data: { id } });
  }

  async handleQueueAllScan(job: IBaseJob): Promise<JobStatus> {
    this.logger.debug(`Refreshing all external libraries: force=${job.force}`);

    // Queue cleanup
    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_CLEANUP, data: {} });

    // Queue all library refresh
    const libraries = await this.repository.getAll(true, LibraryType.EXTERNAL);
    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LIBRARY_SCAN,
        data: {
          id: library.id,
          refreshModifiedFiles: !job.force,
          refreshAllFiles: job.force ?? false,
        },
      })),
    );
    return JobStatus.SUCCESS;
  }

  // Check if an asset is has no file or is outside of import paths, marking it as offline
  async handleOfflineCheck(job: ILibraryOfflineJob): Promise<JobStatus> {
    const asset = await this.assetRepository.getById(job.id);

    if (!asset || asset.isOffline) {
      // We only care about online assets, we exit here if offline
      return JobStatus.SKIPPED;
    }

    const exists = await this.storageRepository.checkFileExists(asset.originalPath, R_OK);

    let existsInImportPath = false;

    for (const importPath of job.importPaths) {
      if (asset.originalPath.startsWith(importPath)) {
        existsInImportPath = true;
        break;
      }
    }

    if (exists && existsInImportPath) {
      this.logger.verbose(`Asset is still online: ${asset.originalPath}`);
    } else {
      this.logger.debug(`Marking asset as offline: ${asset.originalPath}`);
      await this.assetRepository.update({ id: asset.id, isOffline: true });
    }

    return JobStatus.SUCCESS;
  }

  async handleOfflineRemoval(job: IEntityJob): Promise<JobStatus> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getWith(pagination, WithProperty.IS_OFFLINE, job.id),
    );

    for await (const assets of assetPagination) {
      this.logger.debug(`Removing ${assets.length} offline assets`);
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.ASSET_DELETION, data: { id: asset.id, fromExternal: true } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async handleQueueAssetRefresh(job: ILibraryRefreshJob): Promise<JobStatus> {
    const library = await this.repository.get(job.id);
    if (!library || library.type !== LibraryType.EXTERNAL) {
      this.logger.warn('Can only scan external libraries');
      return JobStatus.FAILED;
    }

    this.logger.log(`Refreshing library: ${job.id}`);

    const pathValidation = await Promise.all(
      library.importPaths.map(async (importPath) => await this.validateImportPath(importPath)),
    );

    const validImportPaths = pathValidation
      .map((validation) => {
        if (!validation.isValid) {
          this.logger.error(`Skipping invalid import path: ${validation.importPath}. Reason: ${validation.message}`);
        }
        return validation;
      })
      .filter((validation) => validation.isValid)
      .map((validation) => validation.importPath);

    const crawledAssets = this.storageRepository.walk({
      pathsToCrawl: validImportPaths,
      exclusionPatterns: library.exclusionPatterns,
    });

    const existingAssets = usePagination(LIBRARY_SCAN_BATCH_SIZE, (pagination) =>
      this.assetRepository.getWith(pagination, WithProperty.IS_ONLINE, job.id),
    );

    let crawlDone = false;
    let existingAssetsDone = false;
    let crawlCounter = 0;
    let existingAssetCounter = 0;

    const checkNextAssetPageForOffline = async () => {
      const existingAssetPage = await existingAssets.next();
      existingAssetsDone = existingAssetPage.done ?? true;

      if (existingAssetPage.value) {
        existingAssetCounter += existingAssetPage.value.length;
        this.logger.log(
          `Queuing online check of ${existingAssetPage.value.length} asset(s) in library ${library.id}...`,
        );
        await this.jobRepository.queueAll(
          existingAssetPage.value.map((asset: AssetEntity) => ({
            name: JobName.LIBRARY_CHECK_OFFLINE,
            data: { id: asset.id, importPaths: validImportPaths },
          })),
        );
      }
    };

    let crawledAssetPaths: string[] = [];

    while (!crawlDone) {
      const crawlResult = await crawledAssets.next();

      crawlDone = crawlResult.done ?? true;

      if (!crawlDone) {
        crawledAssetPaths.push(crawlResult.value);
        crawlCounter++;
      }

      if (crawledAssetPaths.length % LIBRARY_SCAN_BATCH_SIZE === 0 || crawlDone) {
        this.logger.log(`Queueing scan of ${crawledAssetPaths.length} asset path(s) in library ${library.id}...`);
        // We have reached the batch size or the end of the generator, scan the assets
        await this.scanAssets(job.id, crawledAssetPaths, library.ownerId, job.refreshAllFiles ?? false);
        crawledAssetPaths = [];

        if (!existingAssetsDone) {
          // Interweave the queuing of offline checks with the asset scanning (if any)
          await checkNextAssetPageForOffline();
        }
      }
    }

    // If there are any remaining assets to check for offline status, do so
    while (!existingAssetsDone) {
      await checkNextAssetPageForOffline();
    }

    this.logger.log(
      `Finished queuing scan of ${crawlCounter} crawled and ${existingAssetCounter} existing asset(s) in library ${library.id}`,
    );

    await this.repository.update({ id: job.id, refreshedAt: new Date() });

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
