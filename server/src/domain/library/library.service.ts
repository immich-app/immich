import { AssetType, LibraryType } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { R_OK } from 'node:constants';
import { EventEmitter } from 'node:events';
import { Stats } from 'node:fs';
import path, { basename, parse } from 'node:path';
import picomatch from 'picomatch';
import { AccessCore, Permission } from '../access';
import { AuthDto } from '../auth';
import { mimeTypes } from '../domain.constant';
import { usePagination, validateCronExpression } from '../domain.util';
import { IBaseJob, IEntityJob, ILibraryFileJob, ILibraryRefreshJob, JOBS_ASSET_PAGINATION_SIZE, JobName } from '../job';

import {
  IAccessRepository,
  IAssetRepository,
  ICryptoRepository,
  IJobRepository,
  ILibraryRepository,
  IStorageRepository,
  ISystemConfigRepository,
  IUserRepository,
  WithProperty,
} from '../repositories';
import { SystemConfigCore } from '../system-config';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  ScanLibraryDto,
  UpdateLibraryDto,
  mapLibrary,
} from './library.dto';

@Injectable()
export class LibraryService extends EventEmitter {
  readonly logger = new ImmichLogger(LibraryService.name);
  private access: AccessCore;
  private configCore: SystemConfigCore;

  private watchLibraries = false;

  private watchers: Record<string, () => Promise<void>> = {};

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ISystemConfigRepository) configRepository: ISystemConfigRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private repository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    super();
    this.access = AccessCore.create(accessRepository);
    this.configCore = SystemConfigCore.create(configRepository);
    this.configCore.addValidator((config) => {
      const { scan } = config.library;
      if (!validateCronExpression(scan.cronExpression)) {
        throw new Error(`Invalid cron expression ${scan.cronExpression}`);
      }
    });
  }

  async init() {
    const config = await this.configCore.getConfig();
    const { watch, scan } = config.library;
    this.watchLibraries = watch.enabled;
    this.jobRepository.addCronJob(
      'libraryScan',
      scan.cronExpression,
      () => this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, data: { force: false } }),
      scan.enabled,
    );

    if (this.watchLibraries) {
      await this.watchAll();
    }

    this.configCore.config$.subscribe(async ({ library }) => {
      this.jobRepository.updateCronJob('libraryScan', library.scan.cronExpression, library.scan.enabled);

      if (library.watch.enabled !== this.watchLibraries) {
        this.watchLibraries = library.watch.enabled;
        await (this.watchLibraries ? this.watchAll() : this.unwatchAll());
      }
    });
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

    const config = await this.configCore.getConfig();
    const { usePolling, interval } = config.library.watch;

    this.logger.debug(`Settings for watcher: usePolling: ${usePolling}, interval: ${interval}`);

    const watcher = this.storageRepository.watch(library.importPaths, {
      usePolling,
      interval,
      binaryInterval: interval,
      ignoreInitial: true,
    });

    this.watchers[id] = async () => {
      await watcher.close();
    };

    watcher.on('add', async (path) => {
      this.logger.debug(`File add event received for ${path} in library ${library.id}}`);
      if (matcher(path)) {
        await this.scanAssets(library.id, [path], library.ownerId, false);
      }
      this.emit('add', path);
    });

    watcher.on('change', async (path) => {
      this.logger.debug(`Detected file change for ${path} in library ${library.id}`);

      if (matcher(path)) {
        // Note: if the changed file was not previously imported, it will be imported now.
        await this.scanAssets(library.id, [path], library.ownerId, false);
      }
      this.emit('change', path);
    });

    watcher.on('unlink', async (path) => {
      this.logger.debug(`Detected deleted file at ${path} in library ${library.id}`);
      const existingAssetEntity = await this.assetRepository.getByLibraryIdAndOriginalPath(library.id, path);

      if (existingAssetEntity && matcher(path)) {
        await this.assetRepository.save({ id: existingAssetEntity.id, isOffline: true });
      }

      this.emit('unlink', path);
    });

    watcher.on('error', async (error) => {
      // TODO: should we log, or throw an exception?
      this.logger.error(`Library watcher for library ${library.id} encountered error: ${error}`);
    });

    // Wait for the watcher to initialize before returning
    await new Promise<void>((resolve) => {
      watcher.on('ready', async () => {
        resolve();
      });
    });

    return true;
  }

  async unwatch(id: string) {
    if (this.watchers.hasOwnProperty(id)) {
      await this.watchers[id]();
      delete this.watchers[id];
    }
  }

  async unwatchAll() {
    for (const id in this.watchers) {
      await this.unwatch(id);
    }
  }

  async watchAll() {
    const libraries = await this.repository.getAll(false, LibraryType.EXTERNAL);

    for (const library of libraries) {
      await this.watch(library.id);
    }
  }

  async getStatistics(auth: AuthDto, id: string): Promise<LibraryStatsResponseDto> {
    await this.access.requirePermission(auth, Permission.LIBRARY_READ, id);
    return this.repository.getStatistics(id);
  }

  async getCount(auth: AuthDto): Promise<number> {
    return this.repository.getCountForUser(auth.user.id);
  }

  async getAllForUser(auth: AuthDto): Promise<LibraryResponseDto[]> {
    const libraries = await this.repository.getAllByUserId(auth.user.id);
    return libraries.map((library) => mapLibrary(library));
  }

  async get(auth: AuthDto, id: string): Promise<LibraryResponseDto> {
    await this.access.requirePermission(auth, Permission.LIBRARY_READ, id);
    const library = await this.findOrFail(id);
    return mapLibrary(library);
  }

  async handleQueueCleanup(): Promise<boolean> {
    this.logger.debug('Cleaning up any pending library deletions');
    const pendingDeletion = await this.repository.getAllDeleted();
    await this.jobRepository.queueAll(
      pendingDeletion.map((libraryToDelete) => ({ name: JobName.LIBRARY_DELETE, data: { id: libraryToDelete.id } })),
    );
    return true;
  }

  async create(auth: AuthDto, dto: CreateLibraryDto): Promise<LibraryResponseDto> {
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
      ownerId: auth.user.id,
      name: dto.name,
      type: dto.type,
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? [],
      isVisible: dto.isVisible ?? true,
    });

    this.logger.log(`Creating ${dto.type} library for user ${auth.user.name}`);

    if (dto.type === LibraryType.EXTERNAL && this.watchLibraries) {
      await this.watch(library.id);
    }

    return mapLibrary(library);
  }

  private async scanAssets(libraryId: string, assetPaths: string[], ownerId: string, force = false) {
    await this.jobRepository.queueAll(
      assetPaths.map((assetPath) => ({
        name: JobName.LIBRARY_SCAN_ASSET,
        data: {
          id: libraryId,
          assetPath: path.normalize(assetPath),
          ownerId,
          force,
        },
      })),
    );
  }

  async update(auth: AuthDto, id: string, dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    await this.access.requirePermission(auth, Permission.LIBRARY_UPDATE, id);
    const library = await this.repository.update({ id, ...dto });

    if (dto.importPaths || dto.exclusionPatterns) {
      // Re-watch library to use new paths and/or exclusion patterns
      await this.watch(id);
    }

    return mapLibrary(library);
  }

  async delete(auth: AuthDto, id: string) {
    await this.access.requirePermission(auth, Permission.LIBRARY_DELETE, id);

    const library = await this.findOrFail(id);
    const uploadCount = await this.repository.getUploadLibraryCount(auth.user.id);
    if (library.type === LibraryType.UPLOAD && uploadCount <= 1) {
      throw new BadRequestException('Cannot delete the last upload library');
    }

    if (this.watchLibraries) {
      await this.unwatch(id);
    }

    await this.repository.softDelete(id);
    await this.jobRepository.queue({ name: JobName.LIBRARY_DELETE, data: { id } });
  }

  async handleDeleteLibrary(job: IEntityJob): Promise<boolean> {
    const library = await this.repository.get(job.id, true);
    if (!library) {
      return false;
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
    return true;
  }

  async handleAssetRefresh(job: ILibraryFileJob) {
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

        await this.assetRepository.save({ id: existingAssetEntity.id, isOffline: true });
        return true;
      } else {
        // File can't be accessed and does not already exist in db
        throw new BadRequestException("Can't access file", { cause: error });
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
      await this.assetRepository.save({ id: existingAssetEntity.id, isOffline: false });
      doRefresh = true;
    }

    if (!doImport && !doRefresh) {
      // If we don't import, exit here
      return true;
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

    const deviceAssetId = `${basename(assetPath)}`.replaceAll(/\s+/g, '');

    let assetId;
    if (doImport) {
      const library = await this.repository.get(job.id, true);
      if (library?.deletedAt) {
        this.logger.error('Cannot import asset into deleted library');
        return false;
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
        originalFileName: parse(assetPath).name,
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
      return true;
    }

    this.logger.debug(`Queuing metadata extraction for: ${assetPath}`);

    await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: assetId, source: 'upload' } });

    if (assetType === AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: assetId } });
    }

    return true;
  }

  async queueScan(auth: AuthDto, id: string, dto: ScanLibraryDto) {
    await this.access.requirePermission(auth, Permission.LIBRARY_UPDATE, id);

    const library = await this.repository.get(id);
    if (!library || library.type !== LibraryType.EXTERNAL) {
      throw new BadRequestException('Can only refresh external libraries');
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

  async queueRemoveOffline(auth: AuthDto, id: string) {
    this.logger.verbose(`Removing offline files from library: ${id}`);
    await this.access.requirePermission(auth, Permission.LIBRARY_UPDATE, id);

    await this.jobRepository.queue({
      name: JobName.LIBRARY_REMOVE_OFFLINE,
      data: {
        id,
      },
    });
  }

  async handleQueueAllScan(job: IBaseJob): Promise<boolean> {
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
    return true;
  }

  async handleOfflineRemoval(job: IEntityJob): Promise<boolean> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getWith(pagination, WithProperty.IS_OFFLINE, job.id),
    );

    for await (const assets of assetPagination) {
      this.logger.debug(`Removing ${assets.length} offline assets`);
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.ASSET_DELETION, data: { id: asset.id, fromExternal: true } })),
      );
    }

    return true;
  }

  async handleQueueAssetRefresh(job: ILibraryRefreshJob): Promise<boolean> {
    const library = await this.repository.get(job.id);
    if (!library || library.type !== LibraryType.EXTERNAL) {
      this.logger.warn('Can only refresh external libraries');
      return false;
    }

    const user = await this.userRepository.get(library.ownerId, {});
    if (!user?.externalPath) {
      this.logger.warn('User has no external path set, cannot refresh library');
      return false;
    }

    this.logger.verbose(`Refreshing library: ${job.id}`);
    const rawPaths = await this.storageRepository.crawl({
      pathsToCrawl: library.importPaths,
      exclusionPatterns: library.exclusionPatterns,
    });

    const crawledAssetPaths = rawPaths
      .map((filePath) => path.normalize(filePath))
      .filter((assetPath) =>
        // Filter out paths that are not within the user's external path
        assetPath.match(new RegExp(`^${user.externalPath}`)),
      ) as string[];

    this.logger.debug(`Found ${crawledAssetPaths.length} asset(s) when crawling import paths ${library.importPaths}`);
    const assetsInLibrary = await this.assetRepository.getByLibraryId([job.id]);
    const onlineFiles = new Set(crawledAssetPaths);
    const offlineAssetIds = assetsInLibrary
      .filter((asset) => !onlineFiles.has(asset.originalPath))
      .filter((asset) => !asset.isOffline)
      .map((asset) => asset.id);
    this.logger.debug(`Marking ${offlineAssetIds.length} assets as offline`);

    await this.assetRepository.updateAll(offlineAssetIds, { isOffline: true });

    if (crawledAssetPaths.length > 0) {
      let filteredPaths: string[] = [];
      if (job.refreshAllFiles || job.refreshModifiedFiles) {
        filteredPaths = crawledAssetPaths;
      } else {
        const onlinePathsInLibrary = new Set(
          assetsInLibrary.filter((asset) => !asset.isOffline).map((asset) => asset.originalPath),
        );
        filteredPaths = crawledAssetPaths.filter((assetPath) => !onlinePathsInLibrary.has(assetPath));

        this.logger.debug(`Will import ${filteredPaths.length} new asset(s)`);
      }

      await this.scanAssets(job.id, filteredPaths, library.ownerId, job.refreshAllFiles ?? false);
    }

    await this.repository.update({ id: job.id, refreshedAt: new Date() });

    return true;
  }

  private async findOrFail(id: string) {
    const library = await this.repository.get(id);
    if (!library) {
      throw new BadRequestException('Library not found');
    }
    return library;
  }
}
