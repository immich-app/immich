import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetStatus } from 'src/enum';

export class TrashRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  getDeletedIds(): AsyncIterableIterator<{ id: string }> {
    return this.db.selectFrom('assets').select(['id']).where('status', '=', AssetStatus.DELETED).stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async restore(userId: string): Promise<number> {
    const { numUpdatedRows } = await this.db
      .updateTable('assets')
      .where('ownerId', '=', userId)
      .where('status', '=', AssetStatus.TRASHED)
      .set({ status: AssetStatus.ACTIVE, deletedAt: null })
      .executeTakeFirst();

    return Number(numUpdatedRows);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async empty(userId: string): Promise<number> {
    const { numUpdatedRows } = await this.db
      .updateTable('assets')
      .where('ownerId', '=', userId)
      .where('status', '=', AssetStatus.TRASHED)
      .set({ status: AssetStatus.DELETED })
      .executeTakeFirst();

    return Number(numUpdatedRows);
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async restoreAll(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const { numUpdatedRows } = await this.db
      .updateTable('assets')
      .where('status', '=', AssetStatus.TRASHED)
      .where('id', 'in', ids)
      .set({ status: AssetStatus.ACTIVE, deletedAt: null })
      .executeTakeFirst();

    return Number(numUpdatedRows);
  }
}
