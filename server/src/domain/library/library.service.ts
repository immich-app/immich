import { AssetEntity, AssetType, LibraryType, UserEntity } from '@app/infra/entities';
import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { R_OK } from 'node:constants';
import { basename, parse } from 'path';
import { AccessCore, IAccessRepository, Permission } from '../access';
import { IAssetRepository, WithProperty } from '../asset';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { mimeTypes } from '../domain.constant';
import { usePagination } from '../domain.util';
import {
  IBaseJob,
  IEntityJob,
  IJobRepository,
  ILibraryFileJob,
  ILibraryRefreshJob,
  JOBS_ASSET_PAGINATION_SIZE,
  JobName,
} from '../job';
import { IStorageRepository } from '../storage';
import { IUserRepository } from '../user';
import {
  CreateLibraryDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  ScanLibraryDto,
  UpdateLibraryDto,
  mapLibrary,
} from './library.dto';
import { ILibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  readonly logger = new Logger(LibraryService.name);
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ILibraryRepository) private repository: ILibraryRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
  ) {
    this.access = new AccessCore(accessRepository);
  }

  async getStatistics(authUser: AuthUserDto, id: string): Promise<LibraryStatsResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, id);
    return this.repository.getStatistics(id);
  }

  async getCount(authUser: AuthUserDto): Promise<number> {
    return this.repository.getCountForUser(authUser.id);
  }

  async getAllForUser(authUser: AuthUserDto): Promise<LibraryResponseDto[]> {
    const libraries = await this.repository.getAllByUserId(authUser.id);
    return libraries.map((library) => mapLibrary(library));
  }

  async get(authUser: AuthUserDto, id: string): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, id);
    const library = await this.findOrFail(id);
    return mapLibrary(library);
  }

  async handleQueueCleanup(): Promise<boolean> {
    this.logger.debug('Cleaning up any pending library deletions');
    const pendingDeletion = await this.repository.getAllDeleted();
    for (const libraryToDelete of pendingDeletion) {
      await this.jobRepository.queue({ name: JobName.LIBRARY_DELETE, data: { id: libraryToDelete.id } });
    }
    return true;
  }

  async create(authUser: AuthUserDto, dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    switch (dto.type) {
      case LibraryType.EXTERNAL:
        if (!dto.name) {
          dto.name = 'New External Library';
        }
        break;
      case LibraryType.UPLOAD:
        if (!dto.name) {
          dto.name = 'New Upload Library';
        }
        if (dto.importPaths && dto.importPaths.length > 0) {
          throw new BadRequestException('Upload libraries cannot have import paths');
        }
        if (dto.exclusionPatterns && dto.exclusionPatterns.length > 0) {
          throw new BadRequestException('Upload libraries cannot have exclusion patterns');
        }
        break;
    }

    const library = await this.repository.create({
      ownerId: authUser.id,
      name: dto.name,
      type: dto.type,
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? [],
      isVisible: dto.isVisible ?? true,
    });

    return mapLibrary(library);
  }

  async update(authUser: AuthUserDto, id: string, dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, id);
    const library = await this.repository.update({ id, ...dto });
    return mapLibrary(library);
  }

  async delete(authUser: AuthUserDto, id: string) {
    await this.access.requirePermission(authUser, Permission.LIBRARY_DELETE, id);

    const library = await this.findOrFail(id);
    const uploadCount = await this.repository.getUploadLibraryCount(authUser.id);
    if (library.type === LibraryType.UPLOAD && uploadCount <= 1) {
      throw new BadRequestException('Cannot delete the last upload library');
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
    for (const assetId of assetIds) {
      await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: assetId, fromExternal: true } });
    }

    if (assetIds.length === 0) {
      this.logger.log(`Deleting library ${job.id}`);
      await this.repository.delete(job.id);
    }
    return true;
  }

  async handleAssetRefresh(job: ILibraryFileJob) {
    const { id, ownerId, assetPath, force } = job;
    const user = await this.userRepository.get(ownerId);
    if (!this.hasAccess(user, assetPath)) {
      return false;
    }

    const library = await this.repository.get(id, true);
    if (library?.deletedAt) {
      this.logger.error(`${assetPath} - skipped (deleted library)`);
      return false;
    }

    let asset = await this.assetRepository.getByLibraryIdAndOriginalPath(id, assetPath);
    const stats = await this.storageRepository.stat(assetPath).catch(() => null);
    if (!stats) {
      if (asset) {
        this.logger.debug(`${assetPath} - updating (offline)`);
        await this.assetRepository.save({ id: asset.id, isOffline: true });
        return true;
      }

      this.logger.debug(`${assetPath} - skipping (not found)`);
      return false;
    }

    let assetType: AssetType;

    if (mimeTypes.isImage(assetPath)) {
      assetType = AssetType.IMAGE;
    } else if (mimeTypes.isVideo(assetPath)) {
      assetType = AssetType.VIDEO;
    } else {
      this.logger.warn(`${assetPath} - skipped (unsupported file type)`);
      return false;
    }

    // TODO: doesn't xmp replace the file extension? Will need investigation
    let sidecarPath: string | null = null;
    if (await this.storageRepository.checkFileExists(`${assetPath}.xmp`, R_OK)) {
      sidecarPath = `${assetPath}.xmp`;
    }

    const isNew = !asset;
    if (!asset) {
      this.logger.debug(`${assetPath} - importing (new)`);
      asset = await this.assetRepository.create({
        ownerId: ownerId,
        libraryId: id,
        checksum: this.cryptoRepository.hashSha1(`path:${assetPath}`),
        originalPath: assetPath,
        deviceAssetId: `${basename(assetPath)}`.replace(/\s+/g, ''),
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
    }

    const isUpdated = asset && stats.mtime.toISOString() !== asset.fileModifiedAt.toISOString();
    if (isUpdated) {
      this.logger.debug(`${assetPath} - updating (changed)`);
      await this.assetRepository.updateAll([asset.id], {
        fileCreatedAt: stats.mtime,
        fileModifiedAt: stats.mtime,
      });
    }

    const isBackOnline = asset.isOffline;
    if (isBackOnline) {
      this.logger.debug(`${assetPath} - updating (online)`);
      await this.assetRepository.save({ id: asset.id, isOffline: false });
    }

    if (force || isNew || isUpdated) {
      await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id } });
      await this.jobRepository.queue({ name: JobName.GENERATE_JPEG_THUMBNAIL, data: { id: asset.id } });
    }

    return true;
  }

  async queueScan(authUser: AuthUserDto, id: string, dto: ScanLibraryDto) {
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, id);

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

  async queueRemoveOffline(authUser: AuthUserDto, id: string) {
    this.logger.verbose(`Removing offline files from library: ${id}`);
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, id);

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
    for (const library of libraries) {
      await this.jobRepository.queue({
        name: JobName.LIBRARY_SCAN,
        data: {
          id: library.id,
          refreshModifiedFiles: !job.force,
          refreshAllFiles: job.force ?? false,
        },
      });
    }
    return true;
  }

  async handleOfflineRemoval(job: IEntityJob): Promise<boolean> {
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) =>
      this.assetRepository.getWith(pagination, WithProperty.IS_OFFLINE, job.id),
    );

    const assetIds: string[] = [];
    for await (const assets of assetPagination) {
      this.logger.debug(`Removing ${assets.length} offline assets`);
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.ASSET_DELETION, data: { id: asset.id, fromExternal: true } });
      }
    }

    return true;
  }

  async handleQueueAssetRefresh(job: ILibraryRefreshJob): Promise<boolean> {
    const start = DateTime.now();

    const library = await this.repository.get(job.id);
    if (!library || !library.owner || library.type !== LibraryType.EXTERNAL) {
      return false;
    }

    const { id, name, owner, importPaths, exclusionPatterns } = library;

    this.logger.log(`Starting library scan: ${name}`);

    if (!owner.externalPath) {
      this.logger.warn('User has no external path set, cannot refresh library');
      return false;
    }

    // scan files
    const allFiles = new Set<string>();
    const newFiles = new Set<string>();
    const files = await this.storageRepository.crawl({
      pathsToCrawl: importPaths,
      exclusionPatterns: exclusionPatterns,
    });
    for (const file of files) {
      if (!file.match(new RegExp(`^${owner.externalPath}`))) {
        continue;
      }

      allFiles.add(file);
      newFiles.add(file);
    }

    // compare with library assets
    const onlineAssets = new Map<string, AssetEntity>();
    const offlineAssets = new Map<string, AssetEntity>();
    const assets = await this.assetRepository.getByLibraryId([job.id]);
    for (const asset of assets) {
      if (allFiles.has(asset.originalPath)) {
        onlineAssets.set(asset.id, asset);
        newFiles.delete(asset.originalPath);
      } else {
        offlineAssets.set(asset.id, asset);
      }
    }

    // mark assets as offline
    if (offlineAssets.size > 0) {
      for (const id of offlineAssets.keys()) {
        await this.assetRepository.save({ id, isOffline: true });
      }
    }

    //  queue assets for potential refresh
    const targetFiles = job.refreshAllFiles || job.refreshModifiedFiles ? allFiles : newFiles;
    for (const assetPath of targetFiles) {
      await this.jobRepository.queue({
        name: JobName.LIBRARY_SCAN_ASSET,
        data: {
          id,
          assetPath,
          ownerId: owner.id,
          force: job.refreshAllFiles ?? false,
        },
      });
    }

    await this.repository.update({ id: job.id, refreshedAt: new Date() });

    this.logger.log(`Finished library scan: ${name}`);
    this.logger.debug({
      id,
      name,
      importPaths,
      total: allFiles.size,
      new: newFiles.size,
      online: onlineAssets.size,
      offline: offlineAssets.size,
      elapsedTime: DateTime.now().diff(start).toHuman(),
    });

    return true;
  }

  private async findOrFail(id: string) {
    const library = await this.repository.get(id);
    if (!library) {
      throw new BadRequestException('Library not found');
    }
    return library;
  }

  private async deleteAssets(assetIds: string[]) {
    // TODO: this should be refactored to a centralized asset deletion service
    for (const assetId of assetIds) {
      const asset = await this.assetRepository.getById(assetId);
      if (!asset) {
        this.logger.warn(`Asset not found: ${assetId}`);
        continue;
      }

      this.logger.debug(`Removing asset from library: ${asset.originalPath}`);

      if (asset.faces) {
        await Promise.all(
          asset.faces.map(({ assetId, personId }) =>
            this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_FACE, data: { assetId, personId } }),
          ),
        );
      }

      await this.assetRepository.remove(asset);
      await this.jobRepository.queue({ name: JobName.SEARCH_REMOVE_ASSET, data: { ids: [asset.id] } });

      await this.jobRepository.queue({
        name: JobName.DELETE_FILES,
        data: { files: [asset.webpPath, asset.resizePath, asset.encodedVideoPath, asset.sidecarPath] },
      });

      // TODO refactor this to use cascades
      if (asset.livePhotoVideoId && !assetIds.includes(asset.livePhotoVideoId)) {
        assetIds.push(asset.livePhotoVideoId);
      }
    }
  }

  private hasAccess(user: UserEntity | null, file: string): boolean {
    if (!user) {
      return false;
    }

    if (!user.externalPath) {
      this.logger.warn('User has no external path set, skipping');
      return false;
    }

    const matches = file.match(new RegExp(`^${user.externalPath}`));
    if (!matches) {
      this.logger.error("Asset must be within the user's external path");
    }

    return !!matches;
  }
}
