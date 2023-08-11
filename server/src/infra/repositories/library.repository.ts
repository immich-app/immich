import { ILibraryRepository, LibraryStatsResponseDto } from '@app/domain';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { LibraryEntity } from '../entities';

@Injectable()
export class LibraryRepository implements ILibraryRepository {
  constructor(@InjectRepository(LibraryEntity) private libraryRepository: Repository<LibraryEntity>) {}

  get(id: string): Promise<LibraryEntity | null> {
    return this.libraryRepository.findOne({
      where: { id },
      relations: {
        owner: true,
      },
    });
  }

  getCountForUser(ownerId: string): Promise<number> {
    return this.libraryRepository.countBy({
      ownerId: ownerId,
    });
  }

  getDefaultUploadLibrary(ownerId: string): Promise<LibraryEntity | null> {
    return this.libraryRepository.findOneOrFail({
      where: {
        ownerId: ownerId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  getById(libraryId: string): Promise<LibraryEntity> {
    return this.libraryRepository.findOneOrFail({
      where: {
        id: libraryId,
      },
    });
  }

  getAllByUserId(ownerId: string): Promise<LibraryEntity[]> {
    return this.libraryRepository.find({
      where: {
        ownerId,
        isVisible: true,
      },
      relations: {
        owner: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async setImportPaths(libraryId: string, importPaths: string[]): Promise<LibraryEntity> {
    await this.libraryRepository.update(libraryId, {
      importPaths: importPaths,
    });

    return this.libraryRepository.findOneOrFail({
      where: {
        id: libraryId,
      },
    });
  }

  async setExcludePatterns(libraryId: string, excludePatterns: string[]): Promise<LibraryEntity> {
    await this.libraryRepository.update(libraryId, {
      exclusionPatterns: excludePatterns,
    });

    return this.libraryRepository.findOneOrFail({
      where: {
        id: libraryId,
      },
    });
  }

  create(library: Omit<LibraryEntity, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<LibraryEntity> {
    return this.libraryRepository.save(library);
  }

  async delete(id: string): Promise<void> {
    await this.libraryRepository.delete({ id });
  }

  async update(library: Partial<LibraryEntity>): Promise<LibraryEntity> {
    return this.save(library);
  }

  async getStatistics(id: string): Promise<LibraryStatsResponseDto> {
    const stats = await this.libraryRepository
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

  async getAssetPaths(libraryId: string): Promise<string[]> {
    // Return all asset paths for a given library
    const rawResults = await this.libraryRepository
      .createQueryBuilder('library')
      .innerJoinAndSelect('library.assets', 'assets')
      .where('library.id = :id', { id: libraryId })
      .select('assets.originalPath')
      .getRawMany();

    const results: string[] = [];

    for (const rawPath of rawResults) {
      results.push(rawPath.assets_originalPath);
    }

    return results;
  }

  private async save(library: Partial<LibraryEntity>) {
    const { id } = await this.libraryRepository.save(library);
    return this.libraryRepository.findOneOrFail({
      where: { id },
    });
  }
}
