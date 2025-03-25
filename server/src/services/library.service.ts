import { BadRequestException, Injectable } from '@nestjs/common';
import { R_OK } from 'node:constants';
import { Stats } from 'node:fs';
import path, { basename, isAbsolute, parse } from 'node:path';
import picomatch from 'picomatch';
import { JOBS_ASSET_PAGINATION_SIZE, JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants';
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
import { SidecarAssetFileEntity } from 'src/entities/asset-files.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import {
  AssetFileType,
  AssetStatus,
  AssetType,
  CrawlType,
  DatabaseLock,
  ImmichWorker,
  JobName,
  JobStatus,
  QueueName,
} from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { AssetSyncResult } from 'src/repositories/library.repository';
import { BaseService } from 'src/services/base.service';
import { JobOf } from 'src/types';
import { mimeTypes } from 'src/utils/mime-types';
import { handlePromiseError } from 'src/utils/misc';

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
          handlePromiseError(this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL }), this.logger),
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
        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_FILES,
          data: { libraryId: library.id, paths: [path] },
        });
      } else {
        this.logger.verbose(`Ignoring file ${event} event for ${path} in library ${library.id}`);
      }
    };

    const deletionHandler = async (path: string) => {
      this.logger.debug(`File unlink event received for ${path} in library ${library.id}}`);
      await this.jobRepository.queue({
        name: JobName.LIBRARY_ASSET_REMOVAL,
        data: { libraryId: library.id, paths: [path] },
      });
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
    this.logger.log('Checking for any libraries pending deletion...');
    const pendingDeletions = await this.libraryRepository.getAllDeleted();
    if (pendingDeletions.length > 0) {
      const libraryString = pendingDeletions.length === 1 ? 'library' : 'libraries';
      this.logger.log(`Found ${pendingDeletions.length} ${libraryString} pending deletion, cleaning up...`);

      await this.jobRepository.queueAll(
        pendingDeletions.map((libraryToDelete) => ({ name: JobName.LIBRARY_DELETE, data: { id: libraryToDelete.id } })),
      );
    }

    return JobStatus.SUCCESS;
  }

  async create(dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const library = await this.libraryRepository.create({
      ownerId: dto.ownerId,
      name: dto.name ?? 'New External Library',
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? ['**/@eaDir/**', '**/._*', '**/#recycle/**', '**/#snapshot/**'],
    });

    return mapLibrary(library);
  }

  @OnJob({ name: JobName.LIBRARY_SYNC_FILES, queue: QueueName.LIBRARY })
  async handleSyncFiles(job: JobOf<JobName.LIBRARY_SYNC_FILES>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.libraryId);
    // We need to check if the library still exists as it could have been deleted after the scan was queued
    if (!library) {
      this.logger.debug(`Library ${job.libraryId} not found, skipping file import`);
      return JobStatus.FAILED;
    } else if (library.deletedAt) {
      this.logger.debug(`Library ${job.libraryId} is deleted, won't import assets into it`);
      return JobStatus.FAILED;
    }

    const assets = job.paths.map((assetPath) => this.processAsset(assetPath, library.ownerId, job.libraryId));

    const assetIds: string[] = [];

    for (let i = 0; i < assets.length; i += 5000) {
      // Chunk the imports to avoid the postgres limit of max parameters at once
      const chunk = assets.slice(i, i + 5000);
      await this.assetRepository.createAll(chunk).then((assets) => assetIds.push(...assets.map((asset) => asset.id)));
    }

    const progressMessage =
      job.progressCount && job.totalCount
        ? `(${job.progressCount} of ${job.totalCount})`
        : `(${job.progressCount} done so far)`;

    this.logger.log(`Imported ${assetIds.length} ${progressMessage} file(s) into library ${job.libraryId}`);

    await this.jobRepository.queueAll(assetIds.map((id) => ({ name: JobName.SIDECAR_ASSET_MAPPING, data: { id } })));

    return JobStatus.SUCCESS;
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

    const library = await this.libraryRepository.update(id, dto);
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

    await this.assetRepository.updateByLibraryId(libraryId, { deletedAt: new Date() });

    let assetsFound = false;
    let chunk: string[] = [];

    const queueChunk = async () => {
      if (chunk.length > 0) {
        assetsFound = true;
        this.logger.debug(`Queueing deletion of ${chunk.length} asset(s) in library ${libraryId}`);
        await this.jobRepository.queueAll(
          chunk.map((id) => ({ name: JobName.ASSET_DELETION, data: { id, deleteOnDisk: false } })),
        );
        chunk = [];
      }
    };

    this.logger.debug(`Will delete all assets in library ${libraryId}`);
    const assets = this.libraryRepository.streamAssetIds(libraryId);
    for await (const asset of assets) {
      chunk.push(asset.id);

      if (chunk.length >= JOBS_LIBRARY_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    if (!assetsFound) {
      this.logger.log(`Deleting library ${libraryId}`);
      await this.libraryRepository.delete(libraryId);
    }

    return JobStatus.SUCCESS;
  }

  private processAsset(filePath: string, ownerId: string, libraryId: string) {
    const assetPath = path.normalize(filePath);

    return {
      ownerId,
      libraryId,
      checksum: this.cryptoRepository.hashSha1(`path:${assetPath}`),
      originalPath: assetPath,

      fileCreatedAt: null,
      fileModifiedAt: null,
      localDateTime: null,
      // TODO: device asset id is deprecated, remove it
      deviceAssetId: `${basename(assetPath)}`.replaceAll(/\s+/g, ''),
      deviceId: 'Library Import',
      type: mimeTypes.isVideo(assetPath) ? AssetType.VIDEO : AssetType.IMAGE,
      originalFileName: parse(assetPath).base,
      isExternal: true,
      livePhotoVideoId: null,
    };
  }

  async queueScan(id: string) {
    await this.findOrFail(id);

    this.logger.log(`Starting to scan library ${id}`);

    await this.jobRepository.queue({
      name: JobName.LIBRARY_QUEUE_SYNC_FILES,
      data: {
        id,
      },
    });

    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SYNC_ASSETS, data: { id } });
  }

  async queueScanAll() {
    await this.jobRepository.queue({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, data: {} });
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SCAN_ALL, queue: QueueName.LIBRARY })
  async handleQueueScanAll(): Promise<JobStatus> {
    this.logger.log(`Initiating scan of all external libraries...`);

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
    const assets = await this.assetRepository.getByIds(job.assetIds);

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
        case AssetSyncResult.OFFLINE: {
          if (asset.status === AssetStatus.TRASHED) {
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
          const isInImportPath = job.importPaths.find((path) => asset.originalPath.startsWith(path));

          if (!isInImportPath) {
            this.logger.verbose(
              `Offline asset ${asset.originalPath} is still not in any import path, keeping offline in library ${job.libraryId}`,
            );
            break;
          }

          const isExcluded = job.exclusionPatterns.some((pattern) => picomatch.isMatch(asset.originalPath, pattern));

          if (!isExcluded) {
            this.logger.debug(`Offline asset ${asset.originalPath} is now online in library ${job.libraryId}`);
            if (asset.status === AssetStatus.TRASHED) {
              trashedAssetIdsToOnline.push(asset.id);
            } else {
              assetIdsToOnline.push(asset.id);
            }
            break;
          }

          this.logger.verbose(
            `Offline asset ${asset.originalPath} is in an import path but still covered by exclusion pattern, keeping offline in library ${job.libraryId}`,
          );

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
      promises.push(
        this.jobRepository.queueAll(
          assetIdsToUpdate.map((id) => ({ name: JobName.METADATA_EXTRACTION, data: { id } })),
        ),
      );
    }

    await Promise.all(promises);

    const remainingCount = assets.length - assetIdsToOffline.length - assetIdsToUpdate.length - assetIdsToOnline.length;

    let progress = '';
    if (job.progressCount && job.totalCount) {
      const cumulativePercentage = ((100 * job.progressCount) / job.totalCount).toFixed(1);
      progress = `(Total progress: ${job.progressCount} of ${job.totalCount}, ${cumulativePercentage} %) `;
    }

    this.logger.log(
      `Checked existing asset(s): ${assetIdsToOffline.length + trashedAssetIdsToOffline.length} offlined, ${assetIdsToOnline.length + trashedAssetIdsToOnline.length} onlined, ${assetIdsToUpdate.length} updated, ${remainingCount} unchanged of current batch of ${assets.length} ${progress}in library ${job.libraryId}.`,
    );

    return JobStatus.SUCCESS;
  }

  private checkExistingAsset(asset: AssetEntity, stat: Stats | null): AssetSyncResult {
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

    if (asset.isOffline && asset.status !== AssetStatus.DELETED) {
      // Only perform the expensive check if the asset is offline
      return AssetSyncResult.CHECK_OFFLINE;
    }

    if (
      !asset.fileCreatedAt ||
      !asset.localDateTime ||
      !asset.fileModifiedAt ||
      stat.mtime.valueOf() !== asset.fileModifiedAt.valueOf()
    ) {
      this.logger.verbose(`Asset ${asset.originalPath} needs metadata extraction in library ${asset.libraryId}`);

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

    this.logger.debug(`Validating import paths for library ${library.id}...`);

    const pathsToCrawl: string[] = [];

    for (const importPath of library.importPaths) {
      const validation = await this.validateImportPath(importPath);
      if (validation.isValid) {
        pathsToCrawl.push(path.normalize(importPath));
      } else {
        this.logger.warn(`Skipping invalid import path: ${importPath}. Reason: ${validation.message}`);
      }
    }

    if (pathsToCrawl.length === 0) {
      this.logger.warn(`No valid import paths found for library ${library.id}`);

      return JobStatus.SKIPPED;
    }

    this.logger.log(`Starting sidecar crawl of ${pathsToCrawl.length} import path(s) for library ${library.id}...`);

    await this.jobRepository.queue({
      name: JobName.SIDECAR_QUEUE_SYNC_FILES,
      data: { paths: pathsToCrawl, exclusionPatterns: library.exclusionPatterns },
    });

    this.logger.log(`Starting asset crawl of ${pathsToCrawl.length} import path(s) for library ${library.id}...`);

    const files = this.storageRepository.walk({
      pathsToCrawl,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
      crawlType: CrawlType.ASSETS,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
    });

    let assetImportCount = 0;
    let assetCount = 0;

    for await (const chunk of files) {
      assetCount += chunk.length;

      const paths = await this.assetRepository.filterNewExternalAssetPaths(library.id, chunk);

      if (paths.length > 0) {
        assetImportCount += paths.length;

        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_FILES,
          data: {
            libraryId: library.id,
            paths,
            progressCount: assetCount,
          },
        });
      }

      this.logger.log(
        `Crawled ${assetCount} file(s) so far: ${paths.length} of current batch of ${chunk.length} will be imported to library ${library.id}...`,
      );
    }

    this.logger.log(
      `Finished disk crawl, ${assetCount} file(s) found on disk and queued ${assetImportCount} file(s) for import into ${library.id}`,
    );

    await this.libraryRepository.update(job.id, { refreshedAt: new Date() });

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_ASSET_REMOVAL, queue: QueueName.LIBRARY })
  async handleAssetRemoval(job: JobOf<JobName.LIBRARY_ASSET_REMOVAL>): Promise<JobStatus> {
    // This is only for handling file unlink events via the file watcher
    this.logger.verbose(`Deleting asset(s) ${job.paths} from library ${job.libraryId}`);
    for (const assetPath of job.paths) {
      const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, assetPath);
      if (asset) {
        await this.assetRepository.remove(asset);
      }
    }

    return JobStatus.SUCCESS;
  }

  @OnJob({ name: JobName.LIBRARY_QUEUE_SYNC_ASSETS, queue: QueueName.LIBRARY })
  async handleQueueSyncAssets(job: JobOf<JobName.LIBRARY_QUEUE_SYNC_ASSETS>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      return JobStatus.SKIPPED;
    }

    const totalAssetCount = await this.assetRepository.getLibraryAssetCount(job.id);

    // FIXME: if >0 sidecars??
    if (!totalAssetCount) {
      this.logger.log(`Library ${library.id} is empty, no need to check assets`);
      return JobStatus.SUCCESS;
    }

    this.logger.log(
      `Checking ${totalAssetCount} sidecar(s) against import paths and exclusion patterns in library ${library.id}...`,
    );

    const deletedSidecars = await this.assetRepository.deleteExternalSidecars(
      library.id,
      library.importPaths,
      library.exclusionPatterns,
    );

    let sidecarChunk: string[] = [];
    const queueSidecarChunk = async () => {
      if (sidecarChunk.length > 0) {
        await this.jobRepository.queueAll(
          sidecarChunk.map((assetId) => ({
            name: JobName.SIDECAR_ASSET_MAPPING,
            data: { id: assetId },
          })),
        );
        sidecarChunk = [];
      }
    };

    let deletedSidecarCount = 0;

    for await (const sidecar of deletedSidecars) {
      if (sidecar.assetId) {
        sidecarChunk.push(sidecar.assetId);
        if (sidecarChunk.length >= JOBS_ASSET_PAGINATION_SIZE) {
          await queueSidecarChunk();
        }
      }
      deletedSidecarCount++;
    }

    await queueSidecarChunk();

    this.logger.log(
      `${deletedSidecarCount} sidecar(s) were removed due to import paths and/or exclusion pattern(s) in library ${library.id}`,
    );

    await this.jobRepository.queue({
      name: JobName.SIDECAR_QUEUE_SYNC_EXISTING,
    });

    this.logger.log(
      `Checking ${totalAssetCount} asset(s) against import paths and exclusion patterns in library ${library.id}...`,
    );

    const offlineAssetsResult = await this.assetRepository.detectOfflineExternalAssets(
      library.id,
      library.importPaths,
      library.exclusionPatterns,
    );

    const affectedAssetCount = Number(offlineAssetsResult.numUpdatedRows);

    this.logger.log(
      `${affectedAssetCount} asset(s) out of ${totalAssetCount} were offlined due to import paths and/or exclusion pattern(s) in library ${library.id}`,
    );

    if (affectedAssetCount === totalAssetCount) {
      return JobStatus.SUCCESS;
    }

    let chunk: string[] = [];
    let progressCount = 0;

    const queueChunk = async () => {
      if (chunk.length > 0) {
        progressCount += chunk.length;

        await this.jobRepository.queue({
          name: JobName.LIBRARY_SYNC_ASSETS,
          data: {
            libraryId: library.id,
            importPaths: library.importPaths,
            exclusionPatterns: library.exclusionPatterns,
            assetIds: chunk.map((id) => id),
            progressCount,
            totalCount: totalAssetCount,
          },
        });
        chunk = [];

        const completePercentage = ((100 * progressCount) / totalAssetCount).toFixed(1);

        this.logger.log(
          `Queued check of ${progressCount} of ${totalAssetCount} (${completePercentage} %) existing asset(s) so far in library ${library.id}`,
        );
      }
    };

    this.logger.log(`Scanning library ${library.id} for assets missing from disk...`);
    const existingAssets = this.libraryRepository.streamAssetIds(library.id);

    for await (const asset of existingAssets) {
      chunk.push(asset.id);
      if (chunk.length === JOBS_LIBRARY_PAGINATION_SIZE) {
        await queueChunk();
      }
    }

    await queueChunk();

    this.logger.log(`Finished queuing ${progressCount} asset check(s) for library ${library.id}`);

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
