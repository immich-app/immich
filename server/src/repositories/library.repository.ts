import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { LibraryStatsResponseDto } from 'src/dtos/library.dto';
import { LibraryEntity, LibraryType } from 'src/entities/library.entity';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { EntityNotFoundError, IsNull, Not } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository.js';

@Instrumentation()
@Injectable()
export class LibraryRepository implements ILibraryRepository {
  constructor(@InjectRepository(LibraryEntity) private repository: Repository<LibraryEntity>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string, withDeleted = false): Promise<LibraryEntity | null> {
    return this.repository.findOneOrFail({
      where: {
        id,
      },
      relations: { owner: true },
      withDeleted,
    });
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  existsByName(name: string, withDeleted = false): Promise<boolean> {
    return this.repository.exist({
      where: {
        name,
      },
      withDeleted,
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getCountForUser(ownerId: string): Promise<number> {
    return this.repository.countBy({ ownerId });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getDefaultUploadLibrary(ownerId: string): Promise<LibraryEntity | null> {
    return this.repository.findOne({
      where: {
        ownerId: ownerId,
        type: LibraryType.UPLOAD,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getUploadLibraryCount(ownerId: string): Promise<number> {
    return this.repository.count({
      where: {
        ownerId: ownerId,
        type: LibraryType.UPLOAD,
      },
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAllByUserId(ownerId: string, type?: LibraryType): Promise<LibraryEntity[]> {
    return this.repository.find({
      where: {
        ownerId,
        type,
      },
      relations: {
        owner: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  @GenerateSql({ params: [] })
  getAll(withDeleted = false, type?: LibraryType): Promise<LibraryEntity[]> {
    return this.repository.find({
      where: { type },
      relations: {
        owner: true,
      },
      order: {
        createdAt: 'ASC',
      },
      withDeleted,
    });
  }

  @GenerateSql()
  getAllDeleted(): Promise<LibraryEntity[]> {
    return this.repository.find({
      where: {
        deletedAt: Not(IsNull()),
      },
      relations: {
        owner: true,
      },
      order: {
        createdAt: 'ASC',
      },
      withDeleted: true,
    });
  }

  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity> {
    return this.repository.save(library);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }

  async update(library: Partial<LibraryEntity>): Promise<LibraryEntity> {
    return this.save(library);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getStatistics(id: string): Promise<LibraryStatsResponseDto> {
    const stats = await this.repository
      .createQueryBuilder('libraries')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'IMAGE' AND assets.isVisible)`, 'photos')
      .addSelect(`COUNT(assets.id) FILTER (WHERE assets.type = 'VIDEO' AND assets.isVisible)`, 'videos')
      .addSelect('COALESCE(SUM(exif.fileSizeInByte), 0)', 'usage')
      .leftJoin('libraries.assets', 'assets')
      .leftJoin('assets.exifInfo', 'exif')
      .groupBy('libraries.id')
      .where('libraries.id = :id', { id })
      .getRawOne();

    if (!stats) {
      throw new EntityNotFoundError(LibraryEntity, { where: { id } });
    }

    return {
      photos: Number(stats.photos),
      videos: Number(stats.videos),
      usage: Number(stats.usage),
      total: Number(stats.photos) + Number(stats.videos),
    };
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getOnlineAssetPaths(libraryId: string): Promise<string[]> {
    // Return all non-offline asset paths for a given library
    const rawResults = await this.repository
      .createQueryBuilder('library')
      .innerJoinAndSelect('library.assets', 'assets')
      .where('library.id = :id', { id: libraryId })
      .andWhere('assets.isOffline = false')
      .select('assets.originalPath')
      .getRawMany();

    const results: string[] = [];

    for (const rawPath of rawResults) {
      results.push(rawPath.assets_originalPath);
    }

    return results;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetIds(libraryId: string, withDeleted = false): Promise<string[]> {
    const builder = this.repository
      .createQueryBuilder('library')
      .innerJoinAndSelect('library.assets', 'assets')
      .where('library.id = :id', { id: libraryId })
      .select('assets.id');

    if (withDeleted) {
      builder.withDeleted();
    }

    // Return all asset paths for a given library
    const rawResults = await builder.getRawMany();

    const results: string[] = [];

    for (const rawPath of rawResults) {
      results.push(rawPath.assets_id);
    }

    return results;
  }

  private async save(library: Partial<LibraryEntity>) {
    const { id } = await this.repository.save(library);
    return this.repository.findOneByOrFail({ id });
  }
}
