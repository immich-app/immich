import { AccessCore, AuthUserDto, IAccessRepository, IAssetRepository, IEntityJob, Permission } from '@app/domain';
import { AssetEntity, LibraryEntity, UserEntity } from '@app/infra/entities';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LibraryResponseDto, mapLibrary } from '@app/domain/library/response-dto/library-response.dto';
import { CreateLibraryDto } from './dto/create-library-dto';
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

  public async createLibrary(authUser: AuthUserDto, dto: CreateLibraryDto): Promise<LibraryEntity> {
    await this.access.requirePermission(authUser, Permission.LIBRARY_CREATE, authUser.id);
    return await this._libraryRepository.create({
      owner: { id: authUser.id } as UserEntity,
      name: dto.name,
      assets: [],
      type: dto.libraryType,
      isVisible: dto.isVisible ?? true,
    });
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

  async handleLibraryRefresh({ id }: IEntityJob) {
    // TODO
    return true;
  }

  async handleEmptyTrash({ id }: IEntityJob) {
    // TODO
    return true;
  }
}
