import { AssetType, LibraryEntity, LibraryType, UserEntity } from '@app/infra/entities';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import fs from 'fs';
import { glob } from 'glob';
import { basename, parse } from 'path';

import path from 'node:path';
import { AccessCore, IAccessRepository, Permission } from '../access';
import { IAssetRepository } from '../asset';
import { AuthUserDto } from '../auth';
import { ICryptoRepository } from '../crypto';
import { mimeTypes } from '../domain.constant';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { IUserRepository } from '../user';
import {
  CrawlOptionsDto,
  CreateLibraryDto,
  GetLibrariesDto,
  LibraryResponseDto,
  LibraryStatsResponseDto,
  mapLibrary,
  ScanLibraryDto as RefreshLibraryDto,
  UpdateLibraryDto,
} from './library.dto';
import { ILibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  readonly logger = new Logger(LibraryService.name);
  private access: AccessCore;

  constructor(
    @Inject(IAccessRepository) private accessRepository: IAccessRepository,
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
  ) {
    this.access = new AccessCore(accessRepository);
  }

  async getCount(authUser: AuthUserDto): Promise<number> {
    return this.libraryRepository.getCountForUser(authUser.id);
  }

  async get(authUser: AuthUserDto, libraryId: string): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);

    const library = await this.libraryRepository.get(libraryId);
    if (!library) {
      throw new NotFoundException('Library Not Found');
    }

    return mapLibrary(library);
  }

  async getStatistics(authUser: AuthUserDto, libraryId: string): Promise<LibraryStatsResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);
    return await this.libraryRepository.getStatistics(libraryId);
  }

  async create(authUser: AuthUserDto, dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const libraryEntity = await this.libraryRepository.create({
      owner: { id: authUser.id } as UserEntity,
      name: dto.name,
      assets: [],
      type: dto.type,
      importPaths: dto.importPaths ?? [],
      exclusionPatterns: dto.exclusionPatterns ?? [],
      isVisible: dto.isVisible ?? true,
    });

    return mapLibrary(libraryEntity);
  }

  async update(authUser: AuthUserDto, dto: UpdateLibraryDto): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, dto.id);

    const updatedLibrary = await this.libraryRepository.update(dto);

    return mapLibrary(updatedLibrary);
  }

  async delete(authUser: AuthUserDto, id: string): Promise<void> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_DELETE, id);

    const exists = await this.libraryRepository.getById(id);
    if (!exists) {
      throw new BadRequestException('Library not found');
    }

    await this.libraryRepository.delete(id);
  }

  async getAll(authUser: AuthUserDto, dto: GetLibrariesDto): Promise<LibraryResponseDto[]> {
    this.access.requireUploadAccess(authUser);

    if (dto.assetId) {
      // TODO
      throw new BadRequestException('Not implemented yet');
    }
    const libraries = await this.libraryRepository.getAllByUserId(authUser.id);
    return libraries.map((library) => mapLibrary(library));
  }

  async getLibraryById(authUser: AuthUserDto, libraryId: string): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);

    const libraryEntity = await this.libraryRepository.getById(libraryId);
    return mapLibrary(libraryEntity);
  }

  async handleRefreshAsset(job: ILibraryJob) {
    this.logger.verbose(`Refreshing library asset: ${job.assetPath}`);

    const user = await this.userRepository.get(job.ownerId);

    if (!user?.externalPath) {
      throw new BadRequestException("User has no external path set, can't import asset");
    }

    if (!job.assetPath.match(new RegExp(`^${user.externalPath}`))) {
      throw new BadRequestException("Asset must be within the user's external path");
    }

    const existingAssetEntity = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, job.assetPath);

    let stats: fs.Stats;
    try {
      stats = await fs.promises.stat(job.assetPath);
    } catch (error) {
      // Can't access file, probably offline
      if (existingAssetEntity) {
        // Mark asset as offline
        this.logger.debug(`Marking asset as offline: ${job.assetPath}`);

        await this.assetRepository.save({ id: existingAssetEntity.id, isOffline: true });
        return true;
      } else {
        // File can't be accessed and does not already exist in db
        throw new BadRequestException(error, "Can't access file");
      }
    }

    let doImport = false;

    if (job.analyze) {
      throw new BadRequestException('Asset re-reads are not implemented yet');

      // Analyze was requested, re-read from disk
      // doImport = true;
    }

    if (!existingAssetEntity) {
      // This asset is new to us, read it from disk
      this.logger.debug(`Importing new asset: ${job.assetPath}`);
      doImport = true;
    } else if (stats.mtime.toISOString !== existingAssetEntity.fileModifiedAt.toISOString) {
      // File modification time has changed since last time we checked, re-read from disk
      this.logger.debug(
        `File modification time has changed, re-importing asset: ${job.assetPath}. Old mtime: ${existingAssetEntity.fileModifiedAt}. New mtime: ${stats.mtime}`,
      );

      doImport = true;
    } else if (stats && !job.analyze && !existingAssetEntity.isOffline) {
      // Asset exists on disk and in db and mtime has not changed. Also, we are not forcing refresn. Therefore, do nothing
      this.logger.debug(`Asset already exists in database and on disk, will not import: ${job.assetPath}`);
      return true;
    }

    if (existingAssetEntity?.isOffline) {
      // File was previously offline but is now online
      this.logger.debug(`Marking previously-offline asset as online: ${job.assetPath}`);
      await this.assetRepository.save({ id: existingAssetEntity.id, isOffline: false });
    }

    if (!doImport) {
      // If we don't import, exit early
      return true;
    }

    const checksum = await this.cryptoRepository.hashFile(job.assetPath);
    const deviceAssetId = `${basename(job.assetPath)}-${stats.size}`.replace(/\s+/g, '');

    let assetType: AssetType;

    if (mimeTypes.isImage(job.assetPath)) {
      assetType = AssetType.IMAGE;
    } else if (mimeTypes.isVideo(job.assetPath)) {
      assetType = AssetType.VIDEO;
    } else if (!mimeTypes.isAsset(job.assetPath)) {
      throw new BadRequestException(`Unsupported file type ${job.assetPath}`);
    } else {
      throw new BadRequestException(`Unknown error when checking file type of ${job.assetPath}`);
    }

    // TODO: doesn't xmp replace the file extension? Will need investigation
    let sidecarPath: string | null = null;
    try {
      await fs.promises.access(`${job.assetPath}.xmp`, fs.constants.R_OK);
      sidecarPath = `${job.assetPath}.xmp`;
    } catch (error) {}

    // TODO: In wait of refactoring the domain asset service, this function is just manually written like this
    const addedAsset = await this.assetRepository.create({
      owner: { id: job.ownerId } as UserEntity,

      library: { id: job.libraryId } as LibraryEntity,

      checksum: checksum,
      originalPath: job.assetPath,

      deviceAssetId: deviceAssetId,
      deviceId: 'Library Import',

      fileCreatedAt: stats.ctime,
      fileModifiedAt: stats.mtime,

      type: assetType,
      isFavorite: false,
      isArchived: false,
      duration: null,
      isVisible: true,
      livePhotoVideo: null,
      resizePath: null,
      webpPath: null,
      thumbhash: null,
      encodedVideoPath: null,
      tags: [],
      sharedLinks: [],
      originalFileName: parse(job.assetPath).name,
      faces: [],
      sidecarPath: sidecarPath,
      isReadOnly: true,
      isOffline: false,
    });

    this.logger.debug(`Queuing metadata extraction for: ${job.assetPath}`);

    await this.jobRepository.queue({
      name: JobName.METADATA_EXTRACTION,
      data: { id: addedAsset.id, source: 'upload' },
    });

    if (addedAsset.type === AssetType.VIDEO) {
      await this.jobRepository.queue({ name: JobName.VIDEO_CONVERSION, data: { id: addedAsset.id } });
    }

    return true;
  }

  async handleOfflineAsset(job: ILibraryJob) {
    const existingAssetEntity = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, job.assetPath);

    if (!existingAssetEntity) {
      throw new BadRequestException(`Asset does not exist in database: ${job.assetPath}`);
    }

    if (job.emptyTrash && existingAssetEntity) {
      this.logger.verbose(`Removing offline asset: ${job.assetPath}`);

      const asset = await this.assetRepository.getByLibraryIdAndOriginalPath(job.libraryId, job.assetPath);
      if (!asset) {
        throw new BadRequestException(`Asset does not exist in database: ${job.assetPath}`);
      }

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

      // TODO: currently we can't delete live photos from libraries

      await this.assetRepository.remove(existingAssetEntity);
    } else if (existingAssetEntity) {
      this.logger.verbose(`Marking asset as offline: ${job.assetPath}`);
      await this.assetRepository.save({ id: existingAssetEntity.id, isOffline: true });
    }

    return true;
  }

  async refresh(authUser: AuthUserDto, libraryId: string, dto: RefreshLibraryDto) {
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, libraryId);

    const library = await this.libraryRepository.getById(libraryId);

    this.logger.verbose(`Refreshing library: ${libraryId}`);

    if (library.type != LibraryType.EXTERNAL) {
      Logger.error('Only imported libraries can be refreshed');
      throw new InternalServerErrorException('Only imported libraries can be refreshed');
    }

    const crawledAssetPaths = (
      await this.crawl({
        pathsToCrawl: library.importPaths,
        exclusionPatterns: library.exclusionPatterns,
      })
    ).map(path.normalize);

    this.logger.debug(`Found ${crawledAssetPaths.length} assets when crawling import paths ${library.importPaths}`);

    const assetsInLibrary = await this.assetRepository.getByLibraryId([libraryId]);

    const offlineAssets = assetsInLibrary
      .map((asset) => asset.originalPath)
      .map(path.normalize)
      .filter((assetPath) => !crawledAssetPaths.includes(assetPath));

    this.logger.debug(`Found ${offlineAssets.length} offline assets in library ${libraryId}`);

    for (const offlineAssetPath of offlineAssets) {
      const libraryJobData: ILibraryJob = {
        assetPath: offlineAssetPath,
        ownerId: authUser.id,
        libraryId: libraryId,
        analyze: false,
        emptyTrash: dto.emptyTrash ?? false,
      };

      await this.jobRepository.queue({ name: JobName.OFFLINE_LIBRARY_FILE, data: libraryJobData });
    }

    if (!dto.emptyTrash && crawledAssetPaths.length > 0) {
      let filteredPaths: string[] = [];
      if (dto.analyze) {
        filteredPaths = crawledAssetPaths;
      } else {
        const existingPaths = await this.libraryRepository.getAssetPaths(libraryId);
        this.logger.debug(`Found ${existingPaths.length} existing asset(s) in library ${libraryId}`);

        filteredPaths = crawledAssetPaths.filter((assetPath) => !existingPaths.includes(assetPath));
        this.logger.debug(`After db comparison, ${filteredPaths.length} asset(s) remain to be imported`);
      }

      for (const assetPath of filteredPaths) {
        const libraryJobData: ILibraryJob = {
          assetPath: path.normalize(assetPath),
          ownerId: authUser.id,
          libraryId: libraryId,
          analyze: dto.analyze ?? false,
          emptyTrash: dto.emptyTrash ?? false,
        };

        await this.jobRepository.queue({ name: JobName.REFRESH_LIBRARY_FILE, data: libraryJobData });
      }
    }
  }

  public async crawl(crawlOptions: CrawlOptionsDto): Promise<string[]> {
    const pathsToCrawl = crawlOptions.pathsToCrawl;

    let paths: string;
    if (!pathsToCrawl) {
      // No paths to crawl, return empty list
      return [];
    } else if (pathsToCrawl.length === 1) {
      paths = pathsToCrawl[0];
    } else {
      paths = '{' + pathsToCrawl.join(',') + '}';
    }

    paths = paths + '/**/*{' + mimeTypes.getSupportedFileExtensions().join(',') + '}';

    return await glob(paths, { nocase: true, nodir: true, ignore: crawlOptions.exclusionPatterns });
  }
}
