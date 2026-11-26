import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { R_OK } from 'node:constants';
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
  LibraryChange,
  QueueName,
} from 'src/enum.js';
import type { LibraryScanAsset } from 'src/repositories/asset.repository.js';
import type { ArgOf } from 'src/repositories/event.repository.js';
import type { WalkedFiles } from 'src/repositories/storage.repository.js';
import { Resource } from 'src/resource-paths.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { BaseService } from 'src/services/base.service.js';
import type { JobOf } from 'src/types.js';
import { mimeTypes } from 'src/utils/mime-types.js';
import { batched, findOrFail, handlePromiseError } from 'src/utils/misc.js';
import { compareUtf8, requireAscending } from 'src/utils/ordered.js';

const NO_FILES: WalkedFiles = { files: [], modified: [] };

const changeOnDisk = (asset: LibraryScanAsset, modified: number): LibraryChange | undefined => {
  if (asset.isOffline) {
    return asset.status === AssetStatus.Deleted ? undefined : LibraryChange.Online;
  }

  return asset.fileModifiedAt.valueOf() === modified ? undefined : LibraryChange.Refresh;
};

const changeWhenMissing = (asset: LibraryScanAsset): LibraryChange | undefined =>
  asset.isOffline ? undefined : LibraryChange.Offline;

export async function* diffLibrary(
  walk: AsyncIterable<WalkedFiles>,
  scan: AsyncIterable<LibraryScanAsset[]>,
): AsyncGenerator<[LibraryChange, string[]]> {
  const disk = walk[Symbol.asyncIterator]();
  const database = scan[Symbol.asyncIterator]();
  let lastFile: string | undefined;
  let lastAsset: string | undefined;
  const nextFiles = async (): Promise<WalkedFiles> => {
    const { value = NO_FILES } = await disk.next();
    lastFile = requireAscending(value.files, lastFile, 'File walk');
    return value;
  };
  const nextAssets = async (): Promise<LibraryScanAsset[]> => {
    const { value = [] } = await database.next();
    lastAsset = requireAscending(
      value.map(({ originalPath }: LibraryScanAsset) => originalPath),
      lastAsset,
      'Library asset stream',
    );
    return value;
  };

  const pending: Record<LibraryChange, string[]> = {
    [LibraryChange.Import]: [],
    [LibraryChange.Offline]: [],
    [LibraryChange.Online]: [],
    [LibraryChange.Refresh]: [],
  };

  try {
    let [{ files, modified }, assets] = await Promise.all([nextFiles(), nextAssets()]);
    let fileIndex = 0;
    let assetIndex = 0;
    while (fileIndex < files.length || assetIndex < assets.length) {
      const asset = assets[assetIndex];
      const order =
        assetIndex === assets.length
          ? -1
          : fileIndex === files.length
            ? 1
            : compareUtf8(files[fileIndex], asset.originalPath);

      const change =
        order < 0
          ? LibraryChange.Import
          : order === 0
            ? changeOnDisk(asset, modified[fileIndex])
            : changeWhenMissing(asset);
      if (change) {
        const items = pending[change];
        items.push(order < 0 ? files[fileIndex] : asset.id);
        if (items.length === JOBS_LIBRARY_PAGINATION_SIZE) {
          pending[change] = [];
          yield [change, items];
        }
      }

      if (order >= 0 && ++assetIndex === assets.length) {
        assets = await nextAssets();
        assetIndex = 0;
      }

      if (order > 0 || ++fileIndex < files.length) {
        continue;
      }

      ({ files, modified } = await nextFiles());
      fileIndex = 0;
    }

    for (const change of Object.values(LibraryChange)) {
      if (pending[change].length > 0) {
        yield [change, pending[change]];
      }
    }
  } finally {
    await Promise.all([disk.return?.(), database.return?.()]);
  }
}

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

    this.logger.log(`Imported ${assetIds.length} file(s) into library ${job.libraryId}`);

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

    const startedAt = new Date();
    const files = this.storageRepository.walkOrdered({
      pathsToCrawl: validImportPaths,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
    });
    const assets = this.assetRepository.streamLibraryScan(library.id);

    this.logger.log(`Starting scan of ${validImportPaths.length} import path(s) for library ${library.id}`);

    const counts: Record<LibraryChange, number> = {
      [LibraryChange.Import]: 0,
      [LibraryChange.Offline]: 0,
      [LibraryChange.Online]: 0,
      [LibraryChange.Refresh]: 0,
    };

    for await (const [change, items] of diffLibrary(files, assets)) {
      counts[change] += items.length;
      switch (change) {
        case LibraryChange.Import: {
          await this.jobRepository.queue({
            name: JobName.LibrarySyncFiles,
            data: { libraryId: library.id, paths: items },
          });
          break;
        }
        case LibraryChange.Offline: {
          await this.assetRepository.setOffline(items, startedAt);
          break;
        }
        case LibraryChange.Online: {
          await this.assetRepository.setOnline(items);
          break;
        }
        case LibraryChange.Refresh: {
          await this.queuePostSyncJobs(items);
          break;
        }
      }
    }

    this.logger.log(
      `Finished scan of library ${library.id}: queued ${counts[LibraryChange.Import]} file(s) for import, offlined ${counts[LibraryChange.Offline]}, onlined ${counts[LibraryChange.Online]} and refreshed ${counts[LibraryChange.Refresh]} asset(s)`,
    );

    await this.libraryRepository.update(job.id, { refreshedAt: new Date() });

    return JobStatus.Success;
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

  private findOrFail(id: string) {
    return findOrFail(() => this.libraryRepository.get(id), 'Library');
  }
}
