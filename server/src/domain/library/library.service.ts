import { AccessCore, AuthUserDto, IAccessRepository, Permission } from '@app/domain';
import { LibraryEntity, LibraryType, UserEntity } from '@app/infra/entities';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { LibraryCrawler } from '@app/domain/library/library-crawler';
import { LibraryResponseDto, mapLibrary } from '@app/domain/library/response-dto/library-response.dto';
import { CreateLibraryDto } from '../../immich/api-v1/library/dto/create-library-dto';
import { ILibraryRepository } from '../../immich/api-v1/library/library-repository';
import { LibraryRefreshDto } from './dto/library-refresh-dto';
import { LibrarySearchDto } from './dto/library-search-dto';

@Injectable()
export class LibraryService {
  readonly logger = new Logger(LibraryService.name);
  private access: AccessCore;
  private readonly crawler: LibraryCrawler;

  constructor(
    @Inject(ILibraryRepository) private libraryRepository: ILibraryRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
  ) {
    this.access = new AccessCore(accessRepository);
    this.crawler = new LibraryCrawler();
  }

  public async createLibrary(authUser: AuthUserDto, dto: CreateLibraryDto): Promise<LibraryEntity> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_CREATE, authUser.id);
    return await this.libraryRepository.create({
      owner: { id: authUser.id } as UserEntity,
      name: dto.name,
      assets: [],
      type: dto.libraryType,
      isVisible: dto.isVisible ?? true,
    });
  }

  public async getAllLibraries(authUser: AuthUserDto, dto: LibrarySearchDto): Promise<LibraryResponseDto[]> {
    const userId = dto.userId || authUser.id;
    const libraries = await this.libraryRepository.getAllByUserId(userId, dto);
    return libraries.map((library) => mapLibrary(library));
  }

  public async getLibraryById(authUser: AuthUserDto, libraryId: string): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, libraryId);

    return await this.libraryRepository.getById(libraryId);
  }

  public async refreshLibrary(authUser: AuthUserDto, dto: LibraryRefreshDto) {
    await this.access.requirePermission(authUser, Permission.LIBRARY_UPDATE, dto.libraryId);

    const libraryEntity = await this.libraryRepository.getById(dto.libraryId);

    if (libraryEntity.type != LibraryType.IMPORT) {
      Logger.error('Only imported libraries can be refreshed');
      throw new InternalServerErrorException('Only imported libraries can be refreshed');
    }

    if (!libraryEntity.importPaths) {
      // No paths to crawl
      return;
    }

    const crawledAssets = this.crawler.findAllMedia({ pathsToCrawl: libraryEntity.importPaths });

    // Upload all crawled assets
  }
}
