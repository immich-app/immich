import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEditActionItem, AssetEditActionItemResponse } from 'src/dtos/editing.dto';
import { DB } from 'src/schema';

@Injectable()
export class AssetEditRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  replaceAll(assetId: string, edits: AssetEditActionItem[]): Promise<AssetEditActionItemResponse[]> {
    return this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('asset_edit').where('assetId', '=', assetId).execute();

      if (edits.length > 0) {
        return trx
          .insertInto('asset_edit')
          .values(edits.map((edit, i) => ({ assetId, sequence: i, ...edit })))
          .returning(['id', 'action', 'parameters'])
          .execute() as Promise<AssetEditActionItemResponse[]>;
      }

      return [];
    });
  }

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  getAll(assetId: string): Promise<AssetEditActionItemResponse[]> {
    return this.db
      .selectFrom('asset_edit')
      .select(['id', 'action', 'parameters'])
      .where('assetId', '=', assetId)
      .orderBy('sequence', 'asc')
      .execute() as Promise<AssetEditActionItemResponse[]>;
  }
}
