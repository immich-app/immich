import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { OcrEntity } from 'src/entities/ocr.entity';


@Injectable()
export class OcrRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getOcrById(id: string): Promise<OcrEntity | null> {
    return this.db
      .selectFrom('asset_ocr')
      .selectAll('asset_ocr')
      .where('asset_ocr.assetId', '=', id)
      .executeTakeFirst() as Promise<OcrEntity | null>;
  }

  async insertOcrData(assetId: string, text: string): Promise<void> {
    await this.db
      .insertInto('asset_ocr')
      .values({ assetId, text })
      .execute();
  }

  async deleteAllOcr(): Promise<void> {
    await sql`truncate ${sql.table('asset_ocr')}`.execute(this.db);
  }

  getAllOcr(options: Partial<OcrEntity> = {}): AsyncIterableIterator<OcrEntity> {
    return this.db
      .selectFrom('asset_ocr')
      .selectAll('asset_ocr')
      .$if(!!options.assetId, (qb) => qb.where('asset_ocr.assetId', '=', options.assetId!))
      .stream() as AsyncIterableIterator<OcrEntity>;
  }


  @GenerateSql()
  async getLatestOcrDate(): Promise<string | undefined> {
    const result = (await this.db
      .selectFrom('asset_job_status')
      .select((eb) => sql`${eb.fn.max('asset_job_status.ocrAt')}::text`.as('latestDate'))
      .executeTakeFirst()) as { latestDate: string } | undefined;

    return result?.latestDate;
  }

  async updateOcrData(id: string, ocrData: string): Promise<void> {
    await this.db
      .updateTable('asset_ocr')
      .set({ text: ocrData })
      .where('id', '=', id)
      .execute();
  }

  getOcrWithoutText(): Promise<OcrEntity[]> {
    return this.db
      .selectFrom('asset_ocr')
      .selectAll('asset_ocr')
      .where('text', 'is', null)
      .execute() as Promise<OcrEntity[]>;
  }

  async delete(ocr: OcrEntity[]): Promise<void> {
    await this.db
      .deleteFrom('asset_ocr')
      .where('id', 'in', ocr.map((o) => o.id))
      .execute();
  }
}
