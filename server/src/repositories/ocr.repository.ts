import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';

export interface OcrInsertData {
  assetId: string;
  boundingBoxX1: number;
  boundingBoxY1: number;
  boundingBoxX2: number;
  boundingBoxY2: number;
  text: string;
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
  }

  async insertMany(ocrDataList: OcrInsertData[]): Promise<void> {
    if (ocrDataList.length === 0) {
      return;
    }
    
    await this.db
      .insertInto('asset_ocr')
      .values(ocrDataList)
      .execute();
  }
}
