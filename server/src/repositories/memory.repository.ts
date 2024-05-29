import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Chunked, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { MemoryEntity } from 'src/entities/memory.entity';
import { IMemoryRepository } from 'src/interfaces/memory.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { DataSource, In, Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class MemoryRepository implements IMemoryRepository {
  constructor(
    @InjectRepository(MemoryEntity) private repository: Repository<MemoryEntity>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  search(ownerId: string): Promise<MemoryEntity[]> {
    return this.repository.find({
      where: {
        ownerId,
      },
      order: {
        memoryAt: 'DESC',
      },
    });
  }

  get(id: string): Promise<MemoryEntity | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: {
        assets: true,
      },
    });
  }

  create(memory: Partial<MemoryEntity>): Promise<MemoryEntity> {
    return this.save(memory);
  }

  update(memory: Partial<MemoryEntity>): Promise<MemoryEntity> {
    return this.save(memory);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedSet({ paramIndex: 1 })
  async getAssetIds(id: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.dataSource
      .createQueryBuilder()
      .select('memories_assets.assetsId', 'assetId')
      .from('memories_assets_assets', 'memories_assets')
      .where('"memories_assets"."memoriesId" = :memoryId', { memoryId: id })
      .andWhere('memories_assets.assetsId IN (:...assetIds)', { assetIds })
      .getRawMany();

    return new Set(results.map((row) => row['assetId']));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async addAssetIds(id: string, assetIds: string[]): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('memories_assets_assets', ['memoriesId', 'assetsId'])
      .values(assetIds.map((assetId) => ({ memoriesId: id, assetsId: assetId })))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @Chunked({ paramIndex: 1 })
  async removeAssetIds(id: string, assetIds: string[]): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .delete()
      .from('memories_assets_assets')
      .where({
        memoriesId: id,
        assetsId: In(assetIds),
      })
      .execute();
  }

  private async save(memory: Partial<MemoryEntity>): Promise<MemoryEntity> {
    const { id } = await this.repository.save(memory);
    return this.repository.findOneOrFail({
      where: { id },
      relations: {
        assets: true,
      },
    });
  }
}
