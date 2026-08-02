import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEditActionItem, AssetEditActionItemResponseDto } from 'src/dtos/editing.dto';
import { DB } from 'src/schema';

@Injectable()
export class AssetEditRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  replaceAll(assetId: string, edits: AssetEditActionItem[]): Promise<AssetEditActionItemResponseDto[]> {
    return this.db.transaction().execute(async (trx) => {
      // Serialize edit-list mutations with derivative publication. The media
      // repository takes this same row lock while checking the revision and
      // swapping asset_file rows, closing the check-to-commit race.
      await trx.selectFrom('asset').select('id').where('id', '=', assetId).forUpdate().executeTakeFirstOrThrow();
      await trx.deleteFrom('asset_edit').where('assetId', '=', assetId).execute();

      if (edits.length > 0) {
        const inserted = await trx
          .insertInto('asset_edit')
          .values(edits.map((edit, i) => ({ assetId, sequence: i, ...edit })))
          .returning(['id', 'action', 'parameters', 'sequence'])
          .execute();
        return inserted
          .toSorted((left, right) => left.sequence - right.sequence)
          .map(({ id, action, parameters }) => ({ id, action, parameters }));
      }

      return [];
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getAll(assetId: string): Promise<AssetEditActionItemResponseDto[]> {
    return this.db
      .selectFrom('asset_edit')
      .select(['id', 'action', 'parameters'])
      .where('assetId', '=', assetId)
      .orderBy('sequence', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getWithSyncInfo(assetId: string) {
    return this.db
      .selectFrom('asset_edit')
      .select(columns.syncAssetEdit)
      .where('assetId', '=', assetId)
      .orderBy('sequence', 'asc')
      .execute();
  }
}
