import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { DB } from 'src/schema';

@Injectable()
export class AssetEditRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  async replaceAll(assetId: string, edits: AssetEditActionItem[]): Promise<AssetEditActionItem[]> {
    return await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('asset_edit').where('assetId', '=', assetId).execute();

      if (edits.length > 0) {
        return trx
          .insertInto('asset_edit')
          .values(edits.map((edit) => ({ assetId, ...edit })))
          .returning(['action', 'parameters'])
          .execute() as Promise<AssetEditActionItem[]>;
      }

      return [];
    });
  }

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  async getAll(assetId: string): Promise<AssetEditActionItem[]> {
    return this.db
      .selectFrom('asset_edit')
      .select(['action', 'parameters'])
      .where('assetId', '=', assetId)
      .execute() as Promise<AssetEditActionItem[]>;
  }
}
