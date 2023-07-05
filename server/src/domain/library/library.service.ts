import { LibraryEntity, LibraryType, UserEntity } from '@app/infra/entities';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { AccessCore, IAccessRepository, Permission } from '../access';
import { AuthUserDto } from '../auth';
import { IJobRepository, ILibraryJob, JobName } from '../job';
import { LibraryCrawler } from './library-crawler';
import {
  CreateLibraryDto,
  GetLibrariesDto,
  LibraryResponseDto,
  mapLibrary,
  ScanLibraryDto,
  SetImportPathsDto,
} from './library.dto';
import { ILibraryRepository } from './library.repository';

@Injectable()
export class LibraryService {
  readonly logger = new Logger(LibraryService.name);
  private access: AccessCore;
  private readonly crawler: LibraryCrawler;

  constructor(
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
  ) {
    this.access = new AccessCore(accessRepository);
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
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);

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
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, libraryId);

    const libraryEntity = await this.libraryRepository.setImportPaths(libraryId, dto.importPaths);
    return mapLibrary(libraryEntity);
  }

  async scan(authUser: AuthUserDto, libraryId: string, dto: ScanLibraryDto) {
    // TODO:
    //await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, dto.libraryId);

    const library = await this.libraryRepository.getById(libraryId);

    if (library.type != LibraryType.IMPORT) {
      Logger.error('Only imported libraries can be refreshed');
      throw new InternalServerErrorException('Only imported libraries can be refreshed');
    }

    if (!library.importPaths) {
      // No paths to crawl
      return;
    }

    const crawledAssetPaths = await this.crawler.findAllMedia({
      pathsToCrawl: library.importPaths,
      excludePatterns: ['**/Original/**'],
    });
    for (const assetPath of crawledAssetPaths) {
      const libraryJobData: ILibraryJob = {
        assetPath: assetPath,
        ownerId: authUser.id,
        libraryId: libraryId,
      };

      await this.jobRepository.queue({ name: JobName.ADD_LIBRARY_FILE, data: libraryJobData });
    }
  }
}
