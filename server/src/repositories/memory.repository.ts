import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, Updateable } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { DB, Memories } from 'src/db';
import { Chunked, ChunkedSet, DummyValue, GenerateSql } from 'src/decorators';
import { MemorySearchDto } from 'src/dtos/memory.dto';
import { IBulkAsset } from 'src/types';

@Injectable()
export class MemoryRepository implements IBulkAsset {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  cleanup() {
    return this.db
      .deleteFrom('memories')
      .where('createdAt', '<', DateTime.now().minus({ days: 30 }).toJSDate())
      .where('isSaved', '=', false)
      .execute();
  }

  @GenerateSql(
    { params: [DummyValue.UUID, {}] },
    { name: 'date filter', params: [DummyValue.UUID, { for: DummyValue.DATE }] },
  )
  search(ownerId: string, dto: MemorySearchDto) {
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
            .orderBy('assets.fileCreatedAt', 'asc')
            .where('assets.deletedAt', 'is', null),
        ).as('assets'),
      )
      .$if(dto.isSaved !== undefined, (qb) => qb.where('isSaved', '=', dto.isSaved!))
      .$if(dto.type !== undefined, (qb) => qb.where('type', '=', dto.type!))
      .$if(dto.for !== undefined, (qb) =>
        qb
          .where((where) => where.or([where('showAt', 'is', null), where('showAt', '<=', dto.for!)]))
          .where((where) => where.or([where('hideAt', 'is', null), where('hideAt', '>=', dto.for!)])),
      )
      .where('deletedAt', dto.isTrashed ? 'is not' : 'is', null)
      .where('ownerId', '=', ownerId)
      .orderBy('memoryAt', 'desc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.getByIdBuilder(id).executeTakeFirst();
  }

  async create(memory: Insertable<Memories>, assetIds: Set<string>) {
    const id = await this.db.transaction().execute(async (tx) => {
      const { id } = await tx.insertInto('memories').values(memory).returning('id').executeTakeFirstOrThrow();

      if (assetIds.size > 0) {
        const values = [...assetIds].map((assetId) => ({ memoriesId: id, assetsId: assetId }));
        await tx.insertInto('memories_assets_assets').values(values).execute();
      }

      return id;
    });

    return this.getByIdBuilder(id).executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID, { ownerId: DummyValue.UUID, isSaved: true }] })
  async update(id: string, memory: Updateable<Memories>) {
    await this.db.updateTable('memories').set(memory).where('id', '=', id).execute();
    return this.getByIdBuilder(id).executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string) {
    await this.db.deleteFrom('memories').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  @ChunkedSet({ paramIndex: 1 })
  async getAssetIds(id: string, assetIds: string[]) {
    if (assetIds.length === 0) {
      return new Set<string>();
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
  async addAssetIds(id: string, assetIds: string[]) {
    if (assetIds.length === 0) {
      return;
    }

    await this.db
      .insertInto('memories_assets_assets')
      .values(assetIds.map((assetId) => ({ memoriesId: id, assetsId: assetId })))
      .execute();
  }

  @Chunked({ paramIndex: 1 })
  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removeAssetIds(id: string, assetIds: string[]) {
    if (assetIds.length === 0) {
      return;
    }

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
            .orderBy('assets.fileCreatedAt', 'asc')
            .where('assets.deletedAt', 'is', null),
        ).as('assets'),
      )
      .where('id', '=', id)
      .where('deletedAt', 'is', null);
  }
}
