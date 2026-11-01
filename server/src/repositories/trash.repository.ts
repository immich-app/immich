import type { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators.js';
import { AssetStatus } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { isPrivateAsset } from 'src/utils/database.js';

export class TrashRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  getDeletedIds(): AsyncIterableIterator<{ id: string }> {
    return this.db.selectFrom('asset').select(['id']).where('status', '=', AssetStatus.Deleted).stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async restore(userId: string, includePrivate = false): Promise<number> {
    const { numUpdatedRows } = await this.db
      .updateTable('asset')
      .where('ownerId', '=', userId)
      .where('status', '=', AssetStatus.Trashed)
      .$if(!includePrivate, (qb) => qb.where((eb) => eb.not(isPrivateAsset(eb.ref('asset.id')))))
      .set({ status: AssetStatus.Active, deletedAt: null })
      .executeTakeFirst();

    return Number(numUpdatedRows);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async empty(userId: string, includePrivate = false): Promise<number> {
    const { numUpdatedRows } = await this.db
      .updateTable('asset')
      .where('ownerId', '=', userId)
      .where('status', '=', AssetStatus.Trashed)
      .$if(!includePrivate, (qb) => qb.where((eb) => eb.not(isPrivateAsset(eb.ref('asset.id')))))
      .set({ status: AssetStatus.Deleted })
      .executeTakeFirst();

    return Number(numUpdatedRows);
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async restoreAll(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const { numUpdatedRows } = await this.db
      .updateTable('asset')
      .where('status', '=', AssetStatus.Trashed)
      .where('id', 'in', ids)
      .set({ status: AssetStatus.Active, deletedAt: null })
      .executeTakeFirst();

    return Number(numUpdatedRows);
  }
}
