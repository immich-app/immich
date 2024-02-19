import { ILibraryRepository, LibraryStatsResponseDto } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not } from 'typeorm';
import { Repository } from 'typeorm/repository/Repository.js';
import { LibraryEntity, LibraryType } from '../entities';
import { DummyValue, GenerateSql } from '../infra.util';
import { Span } from 'nestjs-otel';

@Injectable()
export class LibraryRepository implements ILibraryRepository {
  constructor(@InjectRepository(LibraryEntity) private repository: Repository<LibraryEntity>) {}

  @Span()
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

  @Span()
  @GenerateSql({ params: [DummyValue.STRING] })
  existsByName(name: string, withDeleted = false): Promise<boolean> {
    return this.repository.exist({
      where: {
        name,
      },
      withDeleted,
    });
  }

  @Span()
  @GenerateSql({ params: [DummyValue.UUID] })
  getCountForUser(ownerId: string): Promise<number> {
    return this.repository.countBy({ ownerId });
  }

  @Span()
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

  @Span()
  @GenerateSql({ params: [DummyValue.UUID] })
  getUploadLibraryCount(ownerId: string): Promise<number> {
    return this.repository.count({
      where: {
        ownerId: ownerId,
        type: LibraryType.UPLOAD,
      },
    });
  }

  @Span()
  @GenerateSql({ params: [DummyValue.UUID] })
  getAllByUserId(ownerId: string, type?: LibraryType): Promise<LibraryEntity[]> {
    return this.repository.find({
      where: {
        ownerId,
        isVisible: true,
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

  @Span()
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

  @Span()
  @GenerateSql()
  getAllDeleted(): Promise<LibraryEntity[]> {
    return this.repository.find({
      where: {
        isVisible: true,
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

  @Span()
  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity> {
    return this.repository.save(library);
  }

  @Span()
  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  @Span()
  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }

  @Span()
  async update(library: Partial<LibraryEntity>): Promise<LibraryEntity> {
    return this.save(library);
  }

  @Span()
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

    return {
      photos: Number(stats.photos),
      videos: Number(stats.videos),
      usage: Number(stats.usage),
      total: Number(stats.photos) + Number(stats.videos),
    };
  }

  @Span()
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

  @Span()
  @GenerateSql({ params: [DummyValue.UUID] })
  async getAssetIds(libraryId: string, withDeleted = false): Promise<string[]> {
    let query = this.repository
      .createQueryBuilder('library')
      .innerJoinAndSelect('library.assets', 'assets')
      .where('library.id = :id', { id: libraryId })
      .select('assets.id');

    if (withDeleted) {
      query = query.withDeleted();
    }

    // Return all asset paths for a given library
    const rawResults = await query.getRawMany();

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
