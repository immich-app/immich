import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';

export interface OcrInsertData {
  assetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;
  text: string;
  confidence: number;
}

@Injectable()
export class OcrRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getById(id: string) {
    return this.db.selectFrom('asset_ocr').selectAll('asset_ocr').where('asset_ocr.id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByAssetId(id: string) {
    return this.db.selectFrom('asset_ocr').selectAll('asset_ocr').where('asset_ocr.assetId', '=', id).execute();
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
          confidence: DummyValue.NUMBER,
        },
      ],
    ],
  })
  upsert(assetId: string, ocrDataList: OcrInsertData[]) {
    if (ocrDataList.length === 0) {
      return;
    }

    const searchText = ocrDataList.map((item) => item.text.trim()).join(' ');

    return this.db
      .with('deleted_ocr', (db) => db.deleteFrom('asset_ocr').where('assetId', '=', assetId))
      .with('inserted_ocr', (db) => db.insertInto('asset_ocr').values(ocrDataList))
      .with('inserted_search', (db) =>
        db
          .insertInto('ocr_search')
          .values({ assetId, text: searchText })
          .onConflict((oc) => oc.column('assetId').doUpdateSet((eb) => ({ text: eb.ref('excluded.text') }))),
      )
      .selectNoFrom(sql`1`.as('dummy'))
      .execute();
  }
}
