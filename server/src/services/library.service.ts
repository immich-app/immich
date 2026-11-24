import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { R_OK } from 'node:constants';
import { Stats } from 'node:fs';
import path, { isAbsolute, parse } from 'node:path';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants.js';
import { StorageCore } from 'src/cores/storage.core.js';
import { OnEvent, OnJob } from 'src/decorators.js';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryImportPathResponseDto,
  ValidateLibraryResponseDto,
  mapLibrary,
} from 'src/dtos/library.dto.js';
import {
  AssetStatus,
  AssetType,
  ChecksumAlgorithm,
  CronJob,
  DatabaseLock,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
} from 'src/enum.js';
import type { LibraryScanAsset } from 'src/repositories/asset.repository.js';
import type { ArgOf } from 'src/repositories/event.repository.js';
import { AssetSyncResult } from 'src/repositories/library.repository.js';
import { Resource } from 'src/resource-paths.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { BaseService } from 'src/services/base.service.js';
import type { JobOf } from 'src/types.js';
import { mimeTypes } from 'src/utils/mime-types.js';
import { batched, findOrFail, handlePromiseError } from 'src/utils/misc.js';
import { OrderedCursor, OrderedFiles, compareUtf8 } from 'src/utils/ordered.js';

type LibraryDiff =
  | { paths: string[]; progress: number }
  | { assetIds: string[]; progress: number }
  | { offlineIds: string[]; progress: number };

@Injectable()
export class LibraryService extends BaseService {
  private watchLibraries = false;
  private lock = false;
  private watchers: Record<string, () => Promise<void>> = {};

  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({
    newConfig: {
      library: { watch, scan },
    },
  }: ArgOf<'ConfigInit'>) {
    // This ensures that library watching only occurs in one microservice
    this.lock = await this.databaseRepository.tryLock(DatabaseLock.Library);

    this.watchLibraries = this.lock && watch.enabled;

    if (this.lock) {
      this.cronRepository.create({
        name: CronJob.LibraryScan,
        expression: scan.cronExpression,
        onTick: () => handlePromiseError(this.jobRepository.queue({ name: JobName.LibraryScanQueueAll }), this.logger),
        start: scan.enabled,
      });
    }

    if (this.watchLibraries) {
      await this.watchAll();
    }
  }

  @OnEvent({ name: 'ConfigUpdate', server: true })
  async onConfigUpdate({ newConfig: { library } }: ArgOf<'ConfigUpdate'>) {
    if (!this.lock) {
      return;
    }

    this.cronRepository.update({
      name: CronJob.LibraryScan,
      expression: library.scan.cronExpression,
      start: library.scan.enabled,
    });

    if (library.watch.enabled === this.watchLibraries) {
      return;
    }

    // Watch configuration changed, update accordingly
    this.watchLibraries = library.watch.enabled;
    await (this.watchLibraries ? this.watchAll() : this.unwatchAll());
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

    const matcher = this.storageRepository.createMatcher({
      pathsToCrawl: library.importPaths,
      exclusionPatterns: library.exclusionPatterns,
      includeHidden: false,
      extensions: mimeTypes.getSupportedFileExtensions(),
    });

    let _resolve: () => void;
    const ready$ = new Promise<void>((resolve) => (_resolve = resolve));

    const handler = async (event: string, path: string) => {
      if (matcher.includes(path)) {
        this.logger.debug(`File ${event} event received for ${path} in library ${library.id}`);
        await this.jobRepository.queue({
          name: JobName.LibrarySyncFiles,
          data: { libraryId: library.id, paths: [path] },
        });
      } else {
        this.logger.verbose(`Ignoring file ${event} event for ${path} in library ${library.id}`);
      }
    };

    const deletionHandler = async (path: string) => {
      this.logger.debug(`File unlink event received for ${path} in library ${library.id}`);
      await this.jobRepository.queue({
        name: JobName.LibraryRemoveAsset,
        data: { libraryId: library.id, paths: [path] },
      });
    };

    this.watchers[id] = this.storageRepository.watch(
      library.importPaths,
      {
        usePolling: false,
        ignoreInitial: true,
        ignored: library.exclusionPatterns,
        awaitWriteFinish: {
          stabilityThreshold: 5000,
          pollInterval: 1000,
        },
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
          return handlePromiseError(deletionHandler(path), this.logger);
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
    if (!Object.hasOwn(this.watchers, id)) {
      return;
    }

    await this.watchers[id]();
    delete this.watchers[id];
  }

  @OnEvent({ name: 'AppShutdown' })
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
      await this.watch(library.id).catch((error: Error) =>
        this.logger.error(`Unable to watch library ${library.id}: ${error}`, error?.stack),
      );
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

  @OnJob({ name: JobName.LibraryDeleteCheck, queue: QueueName.Library })
  async handleQueueCleanup(): Promise<JobStatus> {
    this.logger.log('Checking for any libraries pending deletion...');
    const pendingDeletions = await this.libraryRepository.getAllDeleted();
    if (pendingDeletions.length > 0) {
      const libraryString = pendingDeletions.length === 1 ? 'library' : 'libraries';
      this.logger.log(`Found ${pendingDeletions.length} ${libraryString} pending deletion, cleaning up...`);

      await this.jobRepository.queueAll(
        pendingDeletions.map((libraryToDelete) => ({ name: JobName.LibraryDelete, data: { id: libraryToDelete.id } })),
      );
    }

    return JobStatus.Success;
  }

  async create(dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const library = await this.libraryRepository.create({
      ownerId: dto.ownerId,
      name: dto.name ?? 'New External Library',
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? [
        '**/@eaDir/**',
        '**/._*',
        '**/#recycle/**',
        '**/#snapshot/**',
        '**/.stversions/**',
        '**/.stfolder/**',
      ],
    });

    this.resourceRepository.send({ userIds: await this.userRepository.getAdminIds(), changed: [Resource.libraries()] });
    await this.eventRepository.emit('LibraryCreate');
    return mapLibrary(library);
  }

  @OnJob({ name: JobName.LibrarySyncFiles, queue: QueueName.Library })
  async handleSyncFiles(job: JobOf<JobName.LibrarySyncFiles>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.libraryId);
    // We need to check if the library still exists as it could have been deleted after the scan was queued
    if (!library) {
      this.logger.debug(`Library ${job.libraryId} not found, skipping file import`);
      return JobStatus.Failed;
    }
    if (library.deletedAt) {
      this.logger.debug(`Library ${job.libraryId} is deleted, won't import assets into it`);
      return JobStatus.Failed;
    }

    const assetImports: Insertable<AssetTable>[] = [];
    await Promise.all(
      job.paths.map(async (path) => {
        try {
          const asset = await this.processEntity(path, library.ownerId, job.libraryId);
          assetImports.push(asset);
        } catch (error) {
          this.logger.error(`Error processing ${path} for library ${job.libraryId}: ${error}`);
        }
      }),
    );

    const assetIds = await this.assetRepository.createAll(assetImports);

    const progressMessage =
      job.progressCounter && job.totalAssets
        ? `(${job.progressCounter} of ${job.totalAssets})`
        : `(${job.progressCounter} done so far)`;

    this.logger.log(`Imported ${assetIds.length} ${progressMessage} file(s) into library ${job.libraryId}`);

    await Promise.all(
      assetIds.map((assetId) =>
        this.eventRepository.emit('AssetCreate', { asset: { id: assetId, ownerId: library.ownerId } }),
      ),
    );

    await this.queuePostSyncJobs(assetIds);

    return JobStatus.Success;
  }

  private async validateImportPath(importPath: string): Promise<ValidateLibraryImportPathResponseDto> {
    const validation = new ValidateLibraryImportPathResponseDto();
    validation.importPath = importPath;
    validation.isValid = false;

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

    const isAccess = await this.storageRepository.checkFileExists(importPath, R_OK);

    if (!isAccess) {
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

    const library = await this.libraryRepository.update(id, dto);
    this.resourceRepository.send({
      userIds: await this.userRepository.getAdminIds(),
      changed: [Resource.library({ id })],
    });
    await this.eventRepository.emit('LibraryUpdate');
    return mapLibrary(library);
  }

  async delete(id: string) {
    await this.findOrFail(id);

    if (this.watchLibraries) {
      await this.unwatch(id);
    }

    await this.libraryRepository.softDelete(id);
    this.resourceRepository.send({
      userIds: await this.userRepository.getAdminIds(),
      deleted: [Resource.library({ id })],
    });
    await this.jobRepository.queue({ name: JobName.LibraryDelete, data: { id } });

    await this.eventRepository.emit('LibraryDelete');
  }

  @OnJob({ name: JobName.LibraryDelete, queue: QueueName.Library })
  async handleDeleteLibrary(job: JobOf<JobName.LibraryDelete>): Promise<JobStatus> {
    const libraryId = job.id;

    await this.assetRepository.updateByLibraryId(libraryId, { deletedAt: new Date() });

    this.logger.debug(`Will delete all assets in library ${libraryId}`);
    let hasAssets = false;
    for await (const assets of batched(
      this.libraryRepository.streamAssetIds(libraryId),
      JOBS_LIBRARY_PAGINATION_SIZE,
    )) {
      this.logger.debug(`Queueing deletion of ${assets.length} asset(s) in library ${libraryId}`);
      await this.jobRepository.queueAll(
        assets.map((asset) => ({ name: JobName.AssetDelete, data: { id: asset.id, deleteOnDisk: false } })),
      );
      hasAssets = true;
    }

    if (!hasAssets) {
      this.logger.log(`Deleting library ${libraryId}`);
      await this.libraryRepository.delete(libraryId);
    }

    return JobStatus.Success;
  }

  private async processEntity(filePath: string, ownerId: string, libraryId: string) {
    const assetPath = path.normalize(filePath);
    const stat = await this.storageRepository.stat(assetPath);

    return {
      ownerId,
      libraryId,
      checksum: this.cryptoRepository.hashSha1(`path:${assetPath}`),
      checksumAlgorithm: ChecksumAlgorithm.sha1Path,
      originalPath: assetPath,

      fileCreatedAt: stat.mtime,
      fileModifiedAt: stat.mtime,
      localDateTime: stat.mtime,
      type: mimeTypes.isVideo(assetPath) ? AssetType.Video : AssetType.Image,
      originalFileName: parse(assetPath).base,
      isExternal: true,
      livePhotoVideoId: null,
    };
  }

  async queuePostSyncJobs(assetIds: string[]) {
    this.logger.debug(`Queuing sidecar discovery for ${assetIds.length} asset(s)`);

    // We queue a sidecar discovery which, in turn, queues metadata extraction
    await this.jobRepository.queueAll(
      assetIds.map((assetId) => ({
        name: JobName.SidecarCheck,
        data: { id: assetId, source: 'upload' },
      })),
    );
  }

  async queueScan(id: string) {
    await this.findOrFail(id);

    this.logger.log(`Starting to scan library ${id}`);

    await this.jobRepository.queue({
      name: JobName.LibrarySyncFilesQueueAll,
      data: {
        id,
      },
    });
  }

  @OnJob({ name: JobName.LibraryScanQueueAll, queue: QueueName.Library })
  async handleQueueScanAll(): Promise<JobStatus> {
    this.logger.log(`Initiating scan of all external libraries...`);

    await this.jobRepository.queue({ name: JobName.LibraryDeleteCheck, data: {} });

    const libraries = await this.libraryRepository.getAll(true);

    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LibrarySyncFilesQueueAll,
        data: {
          id: library.id,
        },
      })),
    );

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.LibrarySyncAssets, queue: QueueName.Library })
  async handleSyncAssets(job: JobOf<JobName.LibrarySyncAssets>): Promise<JobStatus> {
    const assets = await this.assetJobRepository.getForSyncAssets(job.assetIds);
    const isInLibrary = this.storageRepository
      .createMatcher({ pathsToCrawl: job.importPaths, exclusionPatterns: job.exclusionPatterns, includeHidden: false })
      .includesAll(assets.map(({ originalPath }) => originalPath));

    const assetIdsToOffline: string[] = [];
    const trashedAssetIdsToOffline: string[] = [];
    const assetIdsToOnline: string[] = [];
    const trashedAssetIdsToOnline: string[] = [];
    const assetIdsToUpdate: string[] = [];

    this.logger.debug(`Checking batch of ${assets.length} existing asset(s) in library ${job.libraryId}`);

    const stats = await Promise.all(
      assets.map((asset) => this.storageRepository.stat(asset.originalPath).catch(() => null)),
    );

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const stat = stats[i];
      const action = this.checkExistingAsset(asset, stat);
      switch (action) {
        case AssetSyncResult.DO_NOTHING: {
          break;
        }
        case AssetSyncResult.OFFLINE: {
          if (asset.status === AssetStatus.Trashed) {
            trashedAssetIdsToOffline.push(asset.id);
          } else {
            assetIdsToOffline.push(asset.id);
          }
          break;
        }
        case AssetSyncResult.UPDATE: {
          assetIdsToUpdate.push(asset.id);
          break;
        }
        case AssetSyncResult.CHECK_OFFLINE: {
          if (!isInLibrary[i]) {
            this.logger.verbose(
              `Offline asset ${asset.originalPath} is still not in any import path or covered by an exclusion pattern, keeping offline in library ${job.libraryId}`,
            );
            break;
          }

          this.logger.debug(`Offline asset ${asset.originalPath} is now online in library ${job.libraryId}`);
          if (asset.status === AssetStatus.Trashed) {
            trashedAssetIdsToOnline.push(asset.id);
          } else {
            assetIdsToOnline.push(asset.id);
          }
          break;
        }
      }
    }

    const promises = [];
    if (assetIdsToOffline.length > 0) {
      promises.push(this.assetRepository.updateAll(assetIdsToOffline, { isOffline: true, deletedAt: new Date() }));
    }

    if (trashedAssetIdsToOffline.length > 0) {
      promises.push(this.assetRepository.updateAll(trashedAssetIdsToOffline, { isOffline: true }));
    }

    if (assetIdsToOnline.length > 0) {
      promises.push(this.assetRepository.updateAll(assetIdsToOnline, { isOffline: false, deletedAt: null }));
    }

    if (trashedAssetIdsToOnline.length > 0) {
      promises.push(this.assetRepository.updateAll(trashedAssetIdsToOnline, { isOffline: false }));
    }

    if (assetIdsToUpdate.length > 0) {
      promises.push(this.queuePostSyncJobs(assetIdsToUpdate));
    }

    await Promise.all(promises);

    const remainingCount = assets.length - assetIdsToOffline.length - assetIdsToUpdate.length - assetIdsToOnline.length;
    const cumulativePercentage = ((100 * job.progressCounter) / job.totalAssets).toFixed(1);
    this.logger.log(
      `Checked existing asset(s): ${assetIdsToOffline.length + trashedAssetIdsToOffline.length} offlined, ${assetIdsToOnline.length + trashedAssetIdsToOnline.length} onlined, ${assetIdsToUpdate.length} updated, ${remainingCount} unchanged of current batch of ${assets.length} (Total progress: ${job.progressCounter} of ${job.totalAssets}, ${cumulativePercentage} %) in library ${job.libraryId}.`,
    );

    return JobStatus.Success;
  }

  private checkExistingAsset(
    asset: {
      isOffline: boolean;
      libraryId: string | null;
      originalPath: string;
      status: AssetStatus;
      fileModifiedAt: Date;
    },
    stat: Stats | null,
  ): AssetSyncResult {
    if (!stat) {
      // File not found on disk or permission error
      if (asset.isOffline) {
        this.logger.verbose(
          `Asset ${asset.originalPath} is still not accessible, keeping offline in library ${asset.libraryId}`,
        );
        return AssetSyncResult.DO_NOTHING;
      }

      this.logger.debug(
        `Asset ${asset.originalPath} is no longer on disk or is inaccessible because of permissions, marking offline in library ${asset.libraryId}`,
      );
      return AssetSyncResult.OFFLINE;
    }

    if (asset.isOffline && asset.status !== AssetStatus.Deleted) {
      // Only perform the expensive check if the asset is offline
      return AssetSyncResult.CHECK_OFFLINE;
    }

    if (stat.mtime.valueOf() !== asset.fileModifiedAt.valueOf()) {
      this.logger.verbose(`Asset ${asset.originalPath} needs metadata extraction in library ${asset.libraryId}`);

      return AssetSyncResult.UPDATE;
    }

    return AssetSyncResult.DO_NOTHING;
  }

  @OnJob({ name: JobName.LibrarySyncFilesQueueAll, queue: QueueName.Library })
  async handleQueueSyncFiles(job: JobOf<JobName.LibrarySyncFilesQueueAll>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      this.logger.debug(`Library ${job.id} not found, skipping refresh`);
      return JobStatus.Skipped;
    }

    this.logger.debug(`Validating import paths for library ${library.id}...`);

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

    const totalAssets = await this.assetRepository.getLibraryAssetCount(library.id);
    const files = this.storageRepository.walkOrdered({
      pathsToCrawl: validImportPaths,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
    });
    const matcher = this.storageRepository.createMatcher({
      pathsToCrawl: library.importPaths,
      exclusionPatterns: library.exclusionPatterns,
      includeHidden: false,
    });
    const isInLibrary = (originalPath: string) => matcher.includes(originalPath);

    this.logger.log(`Starting disk crawl of ${validImportPaths.length} import path(s) for library ${library.id}...`);

    const { importCount, checkCount, offlineCount } = await this.assetRepository.scanLibraryAssets(
      library.id,
      async ({ assets, setOffline }) => {
        const counts = { importCount: 0, checkCount: 0, offlineCount: 0 };
        for await (const diff of this.diffLibrary(files, assets, isInLibrary)) {
          if ('offlineIds' in diff) {
            counts.offlineCount += await setOffline(diff.offlineIds);
            continue;
          }

          if ('paths' in diff) {
            counts.importCount += diff.paths.length;
            await this.jobRepository.queue({
              name: JobName.LibrarySyncFiles,
              data: { libraryId: library.id, paths: diff.paths, progressCounter: diff.progress },
            });
            this.logger.log(
              `Crawled ${diff.progress} file(s) so far, queued ${counts.importCount} for import into ${library.id}`,
            );
            continue;
          }

          counts.checkCount += diff.assetIds.length;
          await this.jobRepository.queue({
            name: JobName.LibrarySyncAssets,
            data: {
              libraryId: library.id,
              importPaths: library.importPaths,
              exclusionPatterns: library.exclusionPatterns,
              assetIds: diff.assetIds,
              progressCounter: diff.progress,
              totalAssets,
            },
          });
          this.logger.log(
            `Compared ${diff.progress} of ${totalAssets} existing asset(s) so far, queued ${counts.checkCount} for a check in library ${library.id}`,
          );
        }
        return counts;
      },
    );

    this.logger.log(
      `Finished disk crawl of library ${library.id}: queued ${importCount} file(s) for import and ${checkCount} existing asset(s) for a check, offlined ${offlineCount} asset(s) outside the import paths or covered by an exclusion pattern`,
    );

    await this.libraryRepository.update(job.id, { refreshedAt: new Date() });

    return JobStatus.Success;
  }

  private async *diffLibrary(
    files: AsyncIterable<OrderedFiles>,
    assets: AsyncIterable<LibraryScanAsset[]>,
    isInLibrary: (originalPath: string) => boolean,
  ): AsyncGenerator<LibraryDiff> {
    const disk = new OrderedCursor(files, ({ paths }) => paths, 'File walk');
    const database = new OrderedCursor(
      assets,
      (rows) => rows.map(({ originalPath }) => originalPath),
      'Library asset stream',
    );

    try {
      await Promise.all([disk.fill(), database.fill()]);
      yield* this.diffCursors(disk, database, isInLibrary);
    } finally {
      await Promise.all([disk.close(), database.close()]);
    }
  }

  private async *diffCursors(
    disk: OrderedCursor<OrderedFiles>,
    database: OrderedCursor<LibraryScanAsset[]>,
    isInLibrary: (originalPath: string) => boolean,
  ): AsyncGenerator<LibraryDiff> {
    let paths: string[] = [];
    let assetIds: string[] = [];
    let offlineIds: string[] = [];

    while (disk.key !== undefined || database.key !== undefined) {
      const order = disk.key === undefined ? 1 : database.key === undefined ? -1 : compareUtf8(disk.key, database.key);

      if (order < 0) {
        paths.push(disk.key!);
      } else {
        const asset = database.batch![database.index];
        const modifiedOnDisk = order === 0 ? disk.batch!.modified[disk.index] : undefined;
        if (modifiedOnDisk === undefined && this.isOutsideLibrary(asset, isInLibrary)) {
          offlineIds.push(asset.id);
        } else if (this.isCheckNeeded(asset, modifiedOnDisk, isInLibrary)) {
          assetIds.push(asset.id);
        }

        if (!database.advance()) {
          await database.fill();
        }
      }

      if (order <= 0 && !disk.advance()) {
        await disk.fill();
      }

      if (paths.length === JOBS_LIBRARY_PAGINATION_SIZE) {
        yield { paths, progress: disk.count };
        paths = [];
      }

      if (offlineIds.length === JOBS_LIBRARY_PAGINATION_SIZE) {
        yield { offlineIds, progress: database.count };
        offlineIds = [];
      }

      if (assetIds.length < JOBS_LIBRARY_PAGINATION_SIZE) {
        continue;
      }

      yield { assetIds, progress: database.count };
      assetIds = [];
    }

    if (paths.length > 0) {
      yield { paths, progress: disk.count };
    }

    if (assetIds.length > 0) {
      yield { assetIds, progress: database.count };
    }

    if (offlineIds.length > 0) {
      yield { offlineIds, progress: database.count };
    }
  }

  private isOutsideLibrary(asset: LibraryScanAsset, isInLibrary: (originalPath: string) => boolean) {
    return !asset.isOffline && asset.isExternal && !isInLibrary(asset.originalPath);
  }

  private isCheckNeeded(
    asset: LibraryScanAsset,
    modifiedOnDisk: number | undefined,
    isInLibrary: (originalPath: string) => boolean,
  ) {
    if (modifiedOnDisk === undefined) {
      return !asset.isOffline || asset.status === AssetStatus.Deleted || isInLibrary(asset.originalPath);
    }

    return asset.isOffline || asset.fileModifiedAt.valueOf() !== modifiedOnDisk;
  }

  @OnJob({ name: JobName.LibraryRemoveAsset, queue: QueueName.Library })
  async handleAssetRemoval(job: JobOf<JobName.LibraryRemoveAsset>): Promise<JobStatus> {
    // This is only for handling file unlink events via the file watcher
    this.logger.verbose(`Deleting asset(s) ${job.paths} from library ${job.libraryId}`);
    for (const assetPath of job.paths) {
      const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, assetPath);
      if (asset) {
        await this.assetRepository.remove(asset);
      }
    }

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.LibrarySyncAssetsQueueAll, queue: QueueName.Library })
  handleQueueSyncAssets(): Promise<JobStatus> {
    return Promise.resolve(JobStatus.Skipped);
  }

  private findOrFail(id: string) {
    return findOrFail(() => this.libraryRepository.get(id), 'Library');
  }
}
