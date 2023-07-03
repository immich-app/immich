import { AccessCore, AuthUserDto, IAccessRepository, IAssetRepository, Permission } from '@app/domain';
import { AssetEntity, LibraryEntity } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LibraryResponseDto, mapLibrary } from '@app/domain/library/response-dto/library-response.dto';
import { LibrarySearchDto } from './dto/library-search-dto';
import { ILibraryRepository } from './library-repository';

@Injectable()
export class LibraryService {
  readonly logger = new Logger(LibraryService.name);
  private access: AccessCore;

  constructor(
    @Inject(ILibraryRepository) private _libraryRepository: ILibraryRepository,
    @InjectRepository(AssetEntity) private libraryRepository: Repository<LibraryEntity>,
    @Inject(IAssetRepository) assetRepository: IAssetRepository,
    @Inject(IAccessRepository) accessRepository: IAccessRepository,
  ) {
    this.access = new AccessCore(accessRepository);
  }

  public async crawl(authUser: AuthUserDto, libraryId: string): Promise<void> {
    return;
  }

  public async getAllLibraries(authUser: AuthUserDto, dto: LibrarySearchDto): Promise<LibraryResponseDto[]> {
    const userId = dto.userId || authUser.id;
    await this.access.requirePermission(authUser, Permission.LIBRARY_READ, userId);
    const libraries = await this._libraryRepository.getAllByUserId(userId, dto);
    return libraries.map((library) => mapLibrary(library));
  }

  public async getLibraryById(authUser: AuthUserDto, libraryId: string): Promise<LibraryResponseDto> {
    await this.access.requirePermission(authUser, Permission.ASSET_READ, libraryId);

    return await this._libraryRepository.getById(libraryId);
  }
}
