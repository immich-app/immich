import { Injectable } from '@nestjs/common';
import { Kysely, QueryCreator, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';

export interface OcrInsertData {
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
  async getById(id: string) {
    return this.db
      .selectFrom('asset_ocr')
      .selectAll('asset_ocr')
      .where('asset_ocr.assetId', '=', id)
      .executeTakeFirst();
  }

  async deleteAll(): Promise<void> {
    await sql`truncate ${sql.table('asset_ocr')}`.execute(this.db);
    await sql`truncate ${sql.table('ocr_search')}`.execute(this.db);
  }

  async upsert(assetId: string, ocrDataList: OcrInsertData[]): Promise<void> {
    if (ocrDataList.length === 0) {
      return;
    }

    const assetOcrData = ocrDataList.map(item => ({
      assetId,
      ...item,
    }));

    const searchText = ocrDataList.map(item => item.text.trim()).join('');

    await this.db.transaction().execute(async (trx: Kysely<DB>) => {
      await trx
        .with('deleted_ocr', (db: QueryCreator<DB>) =>
          db.deleteFrom('asset_ocr').where('assetId', '=', assetId).returningAll()
        )
        .insertInto('asset_ocr')
        .values(assetOcrData)
        .execute();

      if (searchText.trim()) {
        await trx
          .with('deleted_search', (db: QueryCreator<DB>) =>
            db.deleteFrom('ocr_search').where('assetId', '=', assetId).returningAll()
          )
          .insertInto('ocr_search')
          .values({
            assetId,
            text: searchText,
          })
          .execute();
      } else {
        await trx
          .deleteFrom('ocr_search')
          .where('assetId', '=', assetId)
          .execute();
      }
    });
  }
}
