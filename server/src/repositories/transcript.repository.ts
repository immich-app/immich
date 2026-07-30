import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { TranscriptSegmentTable } from 'src/schema/tables/transcript-segment.table';

@Injectable()
export class TranscriptRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getByAssetId(id: string) {
    return this.db
      .selectFrom('transcript_segment')
      .selectAll('transcript_segment')
      .where('transcript_segment.assetId', '=', id)
      .orderBy('transcript_segment.startTime', 'asc')
      .execute();
  }

  deleteAll() {
    return sql`truncate ${sql.table('transcript_segment')}`.execute(this.db);
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      [{ assetId: DummyValue.UUID, startTime: DummyValue.NUMBER, endTime: DummyValue.NUMBER, text: DummyValue.STRING }],
    ],
  })
  upsert(assetId: string, segments: Insertable<TranscriptSegmentTable>[]) {
    return this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('transcript_segment').where('assetId', '=', assetId).execute();
      if (segments.length > 0) {
        await trx.insertInto('transcript_segment').values(segments).execute();
      }
    });
  }
}
