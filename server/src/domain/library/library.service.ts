import { LibraryType, UserEntity } from '@app/infra/entities';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import path from 'node:path';
import { AccessCore, IAccessRepository } from '../access';
import { IAssetRepository } from '../asset';
import { AuthUserDto } from '../auth';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { LibraryCrawler } from './library-crawler';
import {
  CreateLibraryDto,
  GetLibrariesDto,
  LibraryResponseDto,
  mapLibrary,
  ScanLibraryDto as RefreshLibraryDto,
  SetImportPathsDto,
} from './library.dto';
import { ILibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  readonly logger = new Logger(LibraryService.name);
  private readonly crawler: LibraryCrawler;

  constructor(
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.crawler = new LibraryCrawler();
  }

  async getCount(authUser: AuthUserDto): Promise<number> {
    return this.libraryRepository.getCountForUser(authUser.id);
  }

  async get(authUser: AuthUserDto, libraryId: string): Promise<LibraryResponseDto> {
    // TODO authorization
    //await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);

    const library = await this.libraryRepository.get(libraryId);
    if (!library) {
      throw new NotFoundException('Library Not Found');
    }

    return mapLibrary(library);
  }

  async create(authUser: AuthUserDto, dto: CreateLibraryDto): Promise<LibraryResponseDto> {
    const libraryEntity = await this.libraryRepository.create({
      owner: { id: authUser.id } as UserEntity,
      name: dto.name,
      assets: [],
      type: dto.libraryType,
      importPaths: [],
      isVisible: dto.isVisible ?? true,
    });
    return mapLibrary(libraryEntity);
  }

  async getAll(authUser: AuthUserDto, dto: GetLibrariesDto): Promise<LibraryResponseDto[]> {
    if (dto.assetId) {
      // TODO
      throw new BadRequestException('Not implemented yet');
    }
    const libraries = await this.libraryRepository.getAllByUserId(authUser.id);
    return libraries.map((library) => mapLibrary(library));
  }

  async getLibraryById(authUser: AuthUserDto, libraryId: string): Promise<LibraryResponseDto> {
    // TODO
    //await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);

    const libraryEntity = await this.libraryRepository.getById(libraryId);
    return mapLibrary(libraryEntity);
  }

  async getImportPaths(authUser: AuthUserDto, libraryId: string): Promise<string[]> {
    // TODO:
    //await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, libraryId);

    const libraryEntity = await this.libraryRepository.getById(libraryId);
    return libraryEntity.importPaths;
  }

  async setImportPaths(authUser: AuthUserDto, libraryId: string, dto: SetImportPathsDto): Promise<LibraryResponseDto> {
    // TODO:
    //await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, libraryId);

    const libraryEntity = await this.getLibraryById(authUser, libraryId);
    if (libraryEntity.type != LibraryType.IMPORT) {
      throw new BadRequestException('Can only set import paths on an Import type library');
    }
    const updatedEntity = await this.libraryRepository.setImportPaths(libraryId, dto.importPaths);
    return mapLibrary(updatedEntity);
  }

  async refresh(authUser: AuthUserDto, libraryId: string, dto: RefreshLibraryDto) {
    // TODO:
    //await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, dto.libraryId);

    const library = await this.libraryRepository.getById(libraryId);

    if (library.type != LibraryType.IMPORT) {
      Logger.error('Only imported libraries can be refreshed');
      throw new InternalServerErrorException('Only imported libraries can be refreshed');
    }

    const crawledAssetPaths = (
      await this.crawler.findAllMedia({
        pathsToCrawl: library.importPaths,
        excludePatterns: ['**/Original/**'], //TODO: this exclusion pattern is just for testing
      })
    ).map(path.normalize);

    for (const assetPath of crawledAssetPaths) {
      const libraryJobData: ILibraryJob = {
        assetPath: path.normalize(assetPath),
        ownerId: authUser.id,
        libraryId: libraryId,
        forceRefresh: dto.forceRefresh ?? false,
        emptyTrash: dto.emptyTrash ?? false,
      };

      await this.jobRepository.queue({ name: JobName.REFRESH_LIBRARY_FILE, data: libraryJobData });
    }
    const assetsInLibrary = await this.assetRepository.getByLibraryId([libraryId]);

    const offlineAssets = assetsInLibrary
      .map((asset) => asset.originalPath)
      .map(path.normalize)
      .filter((assetPath) => !crawledAssetPaths.includes(assetPath));

    for (const offlineAssetPath of offlineAssets) {
      const libraryJobData: ILibraryJob = {
        assetPath: offlineAssetPath,
        ownerId: authUser.id,
        libraryId: libraryId,
        forceRefresh: false,
        emptyTrash: dto.emptyTrash ?? false,
      };

      await this.jobRepository.queue({ name: JobName.OFFLINE_LIBRARY_FILE, data: libraryJobData });
    }
  }
}
