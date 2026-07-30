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

  /**
   * Reads progress without gating on completion, so a partial transcript is legible while the job
   * is still running. A missing row means transcription has never started, a progress marker with
   * no `transcribedAt` means it is in flight, and `transcribedAt` means it finished.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  getStatus(assetId: string) {
    return this.db
      .selectFrom('asset_job_status')
      .select(['asset_job_status.transcribedAt', 'asset_job_status.transcriptionProgressMs'])
      .where('asset_job_status.assetId', '=', assetId)
      .executeTakeFirst();
  }

  async deleteAll() {
    await this.db.transaction().execute(async (trx) => {
      await sql`truncate ${sql.table('transcript_segment')}`.execute(trx);
      await trx
        .updateTable('asset_job_status')
        .set({ transcribedAt: null, transcriptionProgressMs: null })
        .where((eb) => eb.or([eb('transcribedAt', 'is not', null), eb('transcriptionProgressMs', 'is not', null)]))
        .execute();
    });
  }

  /** Clears any earlier attempt and opens a run at offset zero, so a restart cannot see stale rows. */
  @GenerateSql({ params: [DummyValue.UUID] })
  async reset(assetId: string) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('transcript_segment').where('assetId', '=', assetId).execute();
      await upsertProgress(trx, assetId, 0);
    });
  }

  /**
   * Commits one chunk's segments together with the progress marker it advances to. Splitting the
   * two would let a crash between them leave rows for a chunk that is then re-run, duplicating it.
   */
  @GenerateSql({
    params: [
      DummyValue.UUID,
      [{ assetId: DummyValue.UUID, startTime: DummyValue.NUMBER, endTime: DummyValue.NUMBER, text: DummyValue.STRING }],
      DummyValue.NUMBER,
    ],
  })
  async appendChunk(assetId: string, segments: Insertable<TranscriptSegmentTable>[], progressMs: number) {
    await this.db.transaction().execute(async (trx) => {
      if (segments.length > 0) {
        await trx.insertInto('transcript_segment').values(segments).execute();
      }

      // A chunk that voice activity detection found no speech in still advances progress; otherwise
      // it would be replayed on every resume.
      await upsertProgress(trx, assetId, progressMs);
    });
  }
}

const upsertProgress = (trx: Kysely<DB>, assetId: string, progressMs: number) =>
  trx
    .insertInto('asset_job_status')
    .values({ assetId, transcriptionProgressMs: progressMs })
    .onConflict((oc) => oc.column('assetId').doUpdateSet({ transcriptionProgressMs: progressMs }))
    .execute();
