import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { R_OK } from 'node:constants';
import { Stats } from 'node:fs';
import path, { isAbsolute, parse } from 'node:path';
import picomatch from 'picomatch';
import { JOBS_LIBRARY_PAGINATION_SIZE } from 'src/constants.js';
import { StorageCore } from 'src/cores/storage.core.js';
import { OnEvent, OnJob } from 'src/decorators.js';
import { mapAsset } from 'src/dtos/asset-response.dto.js';
import type { AuthDto } from 'src/dtos/auth.dto.js';
import {
  CreateLibraryDto,
  LibraryFoldersDto,
  LibraryFoldersResponseDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  MoveAssetsToLibraryDto,
  UpdateLibraryDto,
  ValidateLibraryDto,
  ValidateLibraryImportPathResponseDto,
  ValidateLibraryResponseDto,
  mapLibrary,
} from 'src/dtos/library.dto.js';
import {
  AssetFileType,
  AssetStatus,
  AssetType,
  ChecksumAlgorithm,
  CronJob,
  DatabaseLock,
  ImmichWorker,
  JobName,
  JobStatus,
  Permission,
  QueueName,
} from 'src/enum.js';
import type { ArgOf } from 'src/repositories/event.repository.js';
import { AssetSyncResult } from 'src/repositories/library.repository.js';
import { AssetTable } from 'src/schema/tables/asset.table.js';
import { BaseService } from 'src/services/base.service.js';
import type { JobOf, StorageAsset } from 'src/types.js';
import { getAssetFile } from 'src/utils/asset.util.js';
import { getLivePhotoMotionFilename } from 'src/utils/file.js';
import { mimeTypes } from 'src/utils/mime-types.js';
import { batched, createLibraryMatcher, findOrFail, handlePromiseError } from 'src/utils/misc.js';

type AssetMoveFile = { source: string; target: string; temporary: string; checksum?: Buffer };
type AssetMovePlan = { assetId: string; files: AssetMoveFile[]; sidecarPath?: string };

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

    const matcher = picomatch(`**/*{${mimeTypes.getSupportedFileExtensions().join(',')}}`, {
      nocase: true,
      ignore: library.exclusionPatterns,
    });

    let _resolve: () => void;
    const ready$ = new Promise<void>((resolve) => (_resolve = resolve));

    const handler = async (event: string, path: string) => {
      if (matcher(path)) {
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
    await this.eventRepository.emit('LibraryUpdate');
    return mapLibrary(library);
  }

  async getFolders(id: string, dto: LibraryFoldersDto): Promise<LibraryFoldersResponseDto> {
    const library = await this.findOrFail(id);

    if (!dto.path) {
      return {
        path: null,
        parentPath: null,
        folders: library.importPaths.map((importPath) => ({ name: importPath, path: importPath })),
      };
    }

    const folder = this.resolveMoveFolder(library, dto.path);
    const isImportPath = library.importPaths.some((importPath) => path.resolve(importPath) === folder);

    let dirents;
    try {
      dirents = await this.storageRepository.readdirWithTypes(folder);
    } catch (error: any) {
      throw new BadRequestException(`Unable to read folder ${folder} (${error?.code ?? error})`);
    }

    const isExcluded = picomatch(library.exclusionPatterns, { nocase: true });
    const folders = dirents
      .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('.'))
      .map((dirent) => ({ name: dirent.name, path: path.join(folder, dirent.name) }))
      .filter((entry) => !isExcluded(path.join(entry.path, 'file')))
      .toSorted((a, b) => a.name.localeCompare(b.name));

    return {
      path: folder,
      parentPath: isImportPath ? null : path.dirname(folder),
      folders,
    };
  }

  async moveAssets(auth: AuthDto, id: string, dto: MoveAssetsToLibraryDto): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.AssetUpdate, ids: dto.assetIds });

    const library = await this.findOrFail(id);
    const folder = this.resolveMoveFolder(library, dto.folder);

    const assets = await this.assetRepository.getByIds(dto.assetIds);
    if (assets.length !== new Set(dto.assetIds).size) {
      throw new BadRequestException('Some assets were not found');
    }

    for (const asset of assets) {
      const reason = this.getMoveAssetError(library, asset);
      if (reason) {
        throw new BadRequestException(`Asset ${asset.id} cannot be moved: ${reason}`);
      }
    }

    await this.jobRepository.queueAll(
      assets.map((asset) => ({
        name: JobName.LibraryMoveAsset,
        data: { id: asset.id, libraryId: library.id, folder },
      })),
    );
  }

  @OnJob({ name: JobName.LibraryMoveAsset, queue: QueueName.Library })
  async handleMoveAsset({ id, libraryId, folder }: JobOf<JobName.LibraryMoveAsset>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(libraryId);
    if (!library) {
      this.logger.warn(`Unable to move asset ${id}: library ${libraryId} not found`);
      return JobStatus.Failed;
    }

    return this.databaseRepository.withLock(DatabaseLock.StorageTemplateMigration, async () => {
      try {
        const targetFolder = this.resolveMoveFolder(library, folder);
        const plan = await this.planAssetMove(library, id, targetFolder);
        await this.executeAssetMove(library.id, plan);
        this.logger.log(`Moved asset ${id} into library ${library.id} at ${plan[0].files[0].target}`);
        await this.notifyAssetMoved(id, library.ownerId);
        return JobStatus.Success;
      } catch (error: any) {
        this.logger.error(`Unable to move asset ${id} into library ${library.id}: ${error?.message ?? error}`);
        return JobStatus.Failed;
      }
    });
  }

  private async notifyAssetMoved(assetId: string, userId: string) {
    try {
      const [asset] = await this.assetRepository.getByIdsWithAllRelationsButStacks([assetId], userId);
      if (asset) {
        this.websocketRepository.clientSend(
          'on_asset_update',
          userId,
          mapAsset(asset, { auth: { user: { id: userId } } as AuthDto }),
        );
      }
    } catch (error: any) {
      this.logger.warn(`Unable to notify clients about moved asset ${assetId}: ${error?.message ?? error}`);
    }
  }

  private resolveMoveFolder(library: { importPaths: string[]; exclusionPatterns: string[] }, folder: string) {
    if (!isAbsolute(folder)) {
      throw new BadRequestException('Destination folder must be an absolute path');
    }

    const resolved = path.resolve(folder);
    const isInsideImportPath = library.importPaths
      .map((importPath) => path.resolve(importPath))
      .some((importPath) => resolved === importPath || resolved.startsWith(importPath + path.sep));

    if (!isInsideImportPath) {
      throw new BadRequestException('Destination folder is not inside any import path of this library');
    }

    if (StorageCore.isImmichPath(resolved)) {
      throw new BadRequestException('Destination folder cannot be inside the Immich media folder');
    }

    const isExcluded = picomatch(library.exclusionPatterns, { nocase: true });
    if (isExcluded(path.join(resolved, 'file'))) {
      throw new BadRequestException('Destination folder matches an exclusion pattern of this library');
    }

    return resolved;
  }

  private getMoveAssetError(
    library: { ownerId: string },
    asset: { ownerId: string; isExternal: boolean; libraryId?: string | null; deletedAt?: Date | null },
  ) {
    if (asset.ownerId !== library.ownerId) {
      return 'asset owner is not the library owner';
    }
    if (asset.isExternal || asset.libraryId) {
      return 'asset already belongs to an external library';
    }
    if (asset.deletedAt) {
      return 'asset is in the trash';
    }
  }

  private async planAssetMove(library: { id: string; ownerId: string }, id: string, folder: string) {
    const asset = await this.assetJobRepository.getForStorageTemplateJob(id);
    if (!asset) {
      throw new Error('asset not found, trashed or without metadata');
    }

    const reason = this.getMoveAssetError(library, asset);
    if (reason) {
      throw new Error(reason);
    }

    const assets: Array<{ asset: StorageAsset; filename: string }> = [
      { asset, filename: path.basename(asset.originalFileName || asset.originalPath) },
    ];

    if (asset.livePhotoVideoId) {
      const motion = await this.assetJobRepository.getForStorageTemplateJob(asset.livePhotoVideoId, {
        includeHidden: true,
      });
      if (!motion) {
        throw new Error(`live photo video ${asset.livePhotoVideoId} not found`);
      }
      if (!motion.isExternal && !StorageCore.isAndroidMotionPath(motion.originalPath)) {
        assets.push({ asset: motion, filename: getLivePhotoMotionFilename(assets[0].filename, motion.originalPath) });
      }
    }

    const reserved = new Set<string>();
    const plan: AssetMovePlan[] = [];

    for (const { asset, filename } of assets) {
      const duplicate = await this.assetRepository.getByChecksum({
        ownerId: asset.ownerId,
        libraryId: library.id,
        checksum: asset.checksum,
      });
      if (duplicate) {
        throw new Error(`the library already contains this file as asset ${duplicate.id}`);
      }

      const target = await this.getAvailablePath(folder, filename, reserved);
      const files: AssetMoveFile[] = [
        { source: asset.originalPath, target, temporary: this.getTemporaryPath(target), checksum: asset.checksum },
      ];

      const sidecarPath = getAssetFile(asset.files, AssetFileType.Sidecar, { isEdited: false })?.path;
      if (sidecarPath) {
        const sidecarTarget = `${target}.xmp`;
        files.push({ source: sidecarPath, target: sidecarTarget, temporary: this.getTemporaryPath(sidecarTarget) });
      }

      plan.push({ assetId: asset.id, files, sidecarPath: sidecarPath ? `${target}.xmp` : undefined });
    }

    return plan;
  }

  private async executeAssetMove(libraryId: string, plan: AssetMovePlan[]) {
    const files = plan.flatMap((item) => item.files);
    this.storageRepository.mkdirSync(path.dirname(files[0].target));

    try {
      for (const file of files) {
        await this.copyAndVerify(file);
      }
    } catch (error) {
      await this.removeFiles(files.map((file) => file.temporary));
      throw error;
    }

    const renamed: AssetMoveFile[] = [];
    try {
      await this.assetRepository.moveToLibrary(
        libraryId,
        plan.map(({ assetId, files, sidecarPath }) => ({ assetId, originalPath: files[0].target, sidecarPath })),
        async () => {
          for (const file of files) {
            if (await this.storageRepository.checkFileExists(file.target)) {
              throw new Error(`destination already exists: ${file.target}`);
            }
            await this.storageRepository.rename(file.temporary, file.target);
            renamed.push(file);
          }
        },
      );
    } catch (error) {
      for (const file of renamed) {
        try {
          await this.storageRepository.rename(file.target, file.temporary);
        } catch (restoreError: any) {
          this.logger.error(`Unable to roll back ${file.target}, remove it manually: ${restoreError?.message}`);
        }
      }
      await this.removeFiles(files.map((file) => file.temporary));
      throw error;
    }

    await this.removeFiles(files.map((file) => file.source));
  }

  private async copyAndVerify(file: AssetMoveFile) {
    await this.storageRepository.copyFile(file.source, file.temporary);

    const expected = file.checksum ?? (await this.cryptoRepository.hashFile(file.source));
    const actual = await this.cryptoRepository.hashFile(file.temporary);
    if (!actual.equals(expected)) {
      throw new Error(`checksum mismatch after copying ${file.source}`);
    }

    const { atime, mtime } = await this.storageRepository.stat(file.source);
    await this.storageRepository.utimes(file.temporary, atime, mtime);
  }

  private async removeFiles(paths: string[]) {
    for (const filepath of paths) {
      try {
        await this.storageRepository.unlink(filepath);
      } catch (error: any) {
        this.logger.warn(`Unable to remove ${filepath}: ${error?.message ?? error}`);
      }
    }
  }

  private getTemporaryPath(target: string) {
    return path.join(path.dirname(target), `.${path.basename(target)}.immich-move`);
  }

  private async getAvailablePath(folder: string, filename: string, reserved: Set<string>) {
    const { name, ext } = path.parse(filename);
    for (let index = 0; index < 10_000; index++) {
      const candidate = path.join(folder, index === 0 ? filename : `${name}+${index}${ext}`);
      const isTaken =
        reserved.has(candidate) ||
        (await this.storageRepository.checkFileExists(candidate)) ||
        (await this.storageRepository.checkFileExists(`${candidate}.xmp`));
      if (!isTaken) {
        reserved.add(candidate);
        return candidate;
      }
    }
    throw new Error(`no available file name for ${filename} in ${folder}`);
  }

  async delete(id: string) {
    await this.findOrFail(id);

    if (this.watchLibraries) {
      await this.unwatch(id);
    }

    await this.libraryRepository.softDelete(id);
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

    await this.jobRepository.queue({ name: JobName.LibrarySyncAssetsQueueAll, data: { id } });
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
    await this.jobRepository.queueAll(
      libraries.map((library) => ({
        name: JobName.LibrarySyncAssetsQueueAll,
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
    const isInLibrary = createLibraryMatcher(job);

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
          if (!isInLibrary(asset.originalPath)) {
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

      return JobStatus.Skipped;
    }

    const pathsOnDisk = this.storageRepository.walk({
      pathsToCrawl: validImportPaths,
      includeHidden: false,
      exclusionPatterns: library.exclusionPatterns,
      take: JOBS_LIBRARY_PAGINATION_SIZE,
    });

    let importCount = 0;
    let crawlCount = 0;

    this.logger.log(`Starting disk crawl of ${validImportPaths.length} import path(s) for library ${library.id}...`);

    for await (const pathBatch of pathsOnDisk) {
      crawlCount += pathBatch.length;
      const paths = await this.assetRepository.filterNewExternalAssetPaths(library.id, pathBatch);

      if (paths.length > 0) {
        importCount += paths.length;

        await this.jobRepository.queue({
          name: JobName.LibrarySyncFiles,
          data: {
            libraryId: library.id,
            paths,
            progressCounter: crawlCount,
          },
        });
      }

      this.logger.log(
        `Crawled ${crawlCount} file(s) so far: ${paths.length} of current batch of ${pathBatch.length} will be imported to library ${library.id}...`,
      );
    }

    this.logger.log(
      `Finished disk crawl, ${crawlCount} file(s) found on disk and queued ${importCount} file(s) for import into ${library.id}`,
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

  @OnJob({ name: JobName.LibrarySyncAssetsQueueAll, queue: QueueName.Library })
  async handleQueueSyncAssets(job: JobOf<JobName.LibrarySyncAssetsQueueAll>): Promise<JobStatus> {
    const library = await this.libraryRepository.get(job.id);
    if (!library) {
      return JobStatus.Skipped;
    }

    const assetCount = await this.assetRepository.getLibraryAssetCount(job.id);
    if (!assetCount) {
      this.logger.log(`Library ${library.id} is empty, no need to check assets`);
      return JobStatus.Success;
    }

    this.logger.log(
      `Checking ${assetCount} asset(s) against import paths and exclusion patterns in library ${library.id}...`,
    );

    const affectedAssetCount = await this.assetRepository.detectOfflineExternalAssets(
      library.id,
      createLibraryMatcher(library),
    );

    this.logger.log(
      `${affectedAssetCount} asset(s) out of ${assetCount} were offlined due to import paths and/or exclusion pattern(s) in library ${library.id}`,
    );

    if (affectedAssetCount === assetCount) {
      return JobStatus.Success;
    }

    this.logger.log(`Scanning library ${library.id} for assets missing from disk...`);

    let count = 0;
    const existingAssets = this.libraryRepository.streamAssetIds(library.id);
    for await (const assets of batched(existingAssets, JOBS_LIBRARY_PAGINATION_SIZE)) {
      count += assets.length;

      await this.jobRepository.queue({
        name: JobName.LibrarySyncAssets,
        data: {
          libraryId: library.id,
          importPaths: library.importPaths,
          exclusionPatterns: library.exclusionPatterns,
          assetIds: assets.map(({ id }) => id),
          progressCounter: count,
          totalAssets: assetCount,
        },
      });

      const completePercentage = ((100 * count) / assetCount).toFixed(1);

      this.logger.log(
        `Queued check of ${count} of ${assetCount} (${completePercentage} %) existing asset(s) so far in library ${library.id}`,
      );
    }

    this.logger.log(`Finished queuing ${count} asset check(s) for library ${library.id}`);

    return JobStatus.Success;
  }

  private findOrFail(id: string) {
    return findOrFail(() => this.libraryRepository.get(id), 'Library');
  }
}
