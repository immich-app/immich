import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Memories } from 'src/db';
import { Chunked, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { MemoryEntity } from 'src/entities/memory.entity';
import { IMemoryRepository } from 'src/interfaces/memory.interface';

@Injectable()
export class MemoryRepository implements IMemoryRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  search(ownerId: string): Promise<MemoryEntity[]> {
    return this.db
      .selectFrom('memories')
      .selectAll()
      .where('ownerId', '=', ownerId)
      .orderBy('memoryAt', 'desc')
      .execute() as Promise<MemoryEntity[]>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string): Promise<MemoryEntity | null> {
    return this.getByIdBuilder(id).executeTakeFirst() as unknown as Promise<MemoryEntity | null>;
  }

  async create(memory: Insertable<Memories>, assetIds: Set<string>): Promise<MemoryEntity> {
    const id = await this.db.transaction().execute(async (tx) => {
      const { id } = await tx.insertInto('memories').values(memory).returning('id').executeTakeFirstOrThrow();

      if (assetIds.size > 0) {
        const values = [...assetIds].map((assetId) => ({ memoriesId: id, assetsId: assetId }));
        await tx.insertInto('memories_assets_assets').values(values).execute();
      }

      return id;
    });

    return this.getByIdBuilder(id).executeTakeFirstOrThrow() as unknown as Promise<MemoryEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID, { ownerId: DummyValue.UUID, isSaved: true }] })
  async update(id: string, memory: Updateable<Memories>): Promise<MemoryEntity> {
    await this.db.updateTable('memories').set(memory).where('id', '=', id).execute();
    return this.getByIdBuilder(id).executeTakeFirstOrThrow() as unknown as Promise<MemoryEntity>;
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.db.deleteFrom('memories').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedSet({ paramIndex: 1 })
  async getAssetIds(id: string, assetIds: string[]): Promise<Set<string>> {
    if (assetIds.length === 0) {
      return new Set();
    }

    const results = await this.db
      .selectFrom('memories_assets_assets')
      .select(['assetsId'])
      .where('memoriesId', '=', id)
      .where('assetsId', 'in', assetIds)
      .execute();

    return new Set(results.map(({ assetsId }) => assetsId));
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async addAssetIds(id: string, assetIds: string[]): Promise<void> {
    await this.db
      .insertInto('memories_assets_assets')
      .values(assetIds.map((assetId) => ({ memoriesId: id, assetsId: assetId })))
      .execute();
  }

  @Chunked({ paramIndex: 1 })
  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removeAssetIds(id: string, assetIds: string[]): Promise<void> {
    await this.db
      .deleteFrom('memories_assets_assets')
      .where('memoriesId', '=', id)
      .where('assetsId', 'in', assetIds)
      .execute();
  }

  private getByIdBuilder(id: string) {
    return this.db
      .selectFrom('memories')
      .selectAll('memories')
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('assets')
            .selectAll('assets')
            .innerJoin('memories_assets_assets', 'assets.id', 'memories_assets_assets.assetsId')
            .whereRef('memories_assets_assets.memoriesId', '=', 'memories.id')
            .where('assets.deletedAt', 'is', null),
        ).as('assets'),
      )
      .where('id', '=', id)
      .where('deletedAt', 'is', null);
  }
}
