import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { EditActionItem } from 'src/dtos/editing.dto';
import { DB } from 'src/schema';

@Injectable()
export class AssetEditRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  async storeEdits(assetId: string, edits: EditActionItem[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('asset_edit').where('assetId', '=', assetId).execute();

      if (edits.length > 0) {
        await trx
          .insertInto('asset_edit')
          .values(edits.map((edit) => ({ assetId, ...edit })))
          .execute();
      }
    });
  }

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  async getEditsForAsset(assetId: string): Promise<EditActionItem[]> {
    return this.db
      .selectFrom('asset_edit')
      .select(['action', 'parameters'])
      .where('assetId', '=', assetId)
      .execute() as Promise<EditActionItem[]>;
  }

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  async deleteEditsForAsset(assetId: string): Promise<void> {
    await this.db.deleteFrom('asset_edit').where('assetId', '=', assetId).execute();
  }
}
