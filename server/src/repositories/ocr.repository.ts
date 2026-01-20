import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetOcrResponseDto } from 'src/dtos/ocr.dto';
import { DB } from 'src/schema';
import { AssetOcrTable } from 'src/schema/tables/asset-ocr.table';

@Injectable()
export class OcrRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('asset_ocr').selectAll('asset_ocr').where('asset_ocr.id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByAssetId(id: string, options?: { isVisible?: boolean }) {
    const isVisible = options === undefined ? true : options.isVisible;

    return this.db
      .selectFrom('asset_ocr')
      .selectAll('asset_ocr')
      .where('asset_ocr.assetId', '=', id)
      .$if(isVisible !== undefined, (qb) => qb.where('asset_ocr.isVisible', '=', isVisible!))
      .execute();
  }

  deleteAll() {
    return this.db.transaction().execute(async (trx: Kysely<DB>) => {
      await sql`truncate ${sql.table('asset_ocr')}`.execute(trx);
      await sql`truncate ${sql.table('ocr_search')}`.execute(trx);
    });
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      [
        {
          assetId: DummyValue.UUID,
          x1: DummyValue.NUMBER,
          y1: DummyValue.NUMBER,
          x2: DummyValue.NUMBER,
          y2: DummyValue.NUMBER,
          x3: DummyValue.NUMBER,
          y3: DummyValue.NUMBER,
          x4: DummyValue.NUMBER,
          y4: DummyValue.NUMBER,
          text: DummyValue.STRING,
          boxScore: DummyValue.NUMBER,
          textScore: DummyValue.NUMBER,
        },
      ],
      DummyValue.STRING,
    ],
  })
  upsert(assetId: string, ocrDataList: Insertable<AssetOcrTable>[], searchText: string) {
    let query = this.db.with('deleted_ocr', (db) => db.deleteFrom('asset_ocr').where('assetId', '=', assetId));
    if (ocrDataList.length > 0) {
      (query as any) = query
        .with('inserted_ocr', (db) => db.insertInto('asset_ocr').values(ocrDataList))
        .with('inserted_search', (db) =>
          db
            .insertInto('ocr_search')
            .values({ assetId, text: searchText })
            .onConflict((oc) => oc.column('assetId').doUpdateSet((eb) => ({ text: eb.ref('excluded.text') }))),
        );
    } else {
      (query as any) = query.with('deleted_search', (db) => db.deleteFrom('ocr_search').where('assetId', '=', assetId));
    }

    return query.selectNoFrom(sql`1`.as('dummy')).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [], []] })
  async updateOcrVisibilities(
    assetId: string,
    visible: AssetOcrResponseDto[],
    hidden: AssetOcrResponseDto[],
  ): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      if (visible.length > 0) {
        await trx
          .updateTable('asset_ocr')
          .set({ isVisible: true })
          .where(
            'asset_ocr.id',
            'in',
            visible.map((i) => i.id),
          )
          .execute();
      }

      if (hidden.length > 0) {
        await trx
          .updateTable('asset_ocr')
          .set({ isVisible: false })
          .where(
            'asset_ocr.id',
            'in',
            hidden.map((i) => i.id),
          )
          .execute();
      }

      const searchText = visible.map((item) => item.text.trim()).join(' ');
      await trx.updateTable('ocr_search').set({ text: searchText }).where('assetId', '=', assetId).execute();
    });
  }
}
