import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DummyValue, GenerateSql } from 'src/decorators';
import { LibraryStatsResponseDto } from 'src/dtos/library.dto';
import { LibraryEntity } from 'src/entities/library.entity';
import { ILibraryRepository } from 'src/interfaces/library.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { IsNull, Not } from 'typeorm';
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

  @GenerateSql({ params: [] })
  getAll(withDeleted = false): Promise<LibraryEntity[]> {
    return this.repository.find({
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
  async getStatistics(id: string): Promise<LibraryStatsResponseDto | undefined> {
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
      return;
    }

    return {
      photos: Number(stats.photos),
      videos: Number(stats.videos),
      usage: Number(stats.usage),
      total: Number(stats.photos) + Number(stats.videos),
    };
  }

  private async save(library: Partial<LibraryEntity>) {
    const { id } = await this.repository.save(library);
    return this.repository.findOneByOrFail({ id });
  }
}
