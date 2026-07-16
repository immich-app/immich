import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { VideoFrameExtractionStatus } from 'src/enum';
import { DB } from 'src/schema';
import { VideoFrameExtractionTable } from 'src/schema/tables/video-frame-extraction.table';
import { VideoFrameTable } from 'src/schema/tables/video-frame.table';

export type VideoFrameInsert = Omit<Insertable<VideoFrameTable>, 'assetId'>;

@Injectable()
export class VideoFrameRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getExtractionRecord(assetId: string) {
    return this.db.selectFrom('video_frame_extraction').selectAll().where('assetId', '=', assetId).executeTakeFirst();
  }

  @GenerateSql({
    params: [
      DummyValue.UUID,
      { status: DummyValue.STRING, version: DummyValue.NUMBER, parameters: {}, parametersHash: DummyValue.STRING },
    ],
  })
  upsertExtractionRecord(assetId: string, record: Omit<Insertable<VideoFrameExtractionTable>, 'assetId'>) {
    return this.db
      .insertInto('video_frame_extraction')
      .values({ assetId, ...record })
      .onConflict((oc) => oc.column('assetId').doUpdateSet(record))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [{ frameIndex: 0, byteOffset: 0, byteSize: 0, intervalChange: 0 }]] })
  async upsertFrames(assetId: string, frames: VideoFrameInsert[]) {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('video_frame').where('assetId', '=', assetId).execute();
      if (frames.length > 0) {
        await trx
          .insertInto('video_frame')
          .values(frames.map((frame) => ({ assetId, ...frame })))
          .execute();
      }
    });
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteFrames(assetId: string) {
    await this.db.deleteFrom('video_frame').where('assetId', '=', assetId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.NUMBER] })
  getFrame(assetId: string, frameIndex: number) {
    return this.db
      .selectFrom('video_frame')
      .selectAll()
      .where('assetId', '=', assetId)
      .where('frameIndex', '=', frameIndex)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.NUMBER, DummyValue.NUMBER] })
  getFramesInRange(assetId: string, fromIndex: number, toIndex: number) {
    return this.db
      .selectFrom('video_frame')
      .selectAll()
      .where('assetId', '=', assetId)
      .where('frameIndex', '>=', fromIndex)
      .where('frameIndex', '<=', toIndex)
      .orderBy('frameIndex', 'asc')
      .execute();
  }

  /**
   * Returns the extraction artifact's location (path/init segment size) joined with all of an asset's
   * sampled frames, ordered by frame index - the single call a future ML-embedding consumer needs to
   * read frame bytes (artifact location + per-frame byte offsets) without a second round-trip or
   * reaching around this repository.
   */
  @GenerateSql({ params: [DummyValue.UUID] })
  async getFramesForEmbedding(assetId: string) {
    const extraction = await this.db
      .selectFrom('video_frame_extraction')
      .select(['path', 'initSegmentSize'])
      .where('assetId', '=', assetId)
      .where('status', '=', sql.lit(VideoFrameExtractionStatus.Completed))
      .executeTakeFirst();

    if (!extraction?.path) {
      return null;
    }

    const frames = await this.db
      .selectFrom('video_frame')
      .selectAll()
      .where('assetId', '=', assetId)
      .orderBy('frameIndex', 'asc')
      .execute();

    return { path: extraction.path, initSegmentSize: extraction.initSegmentSize, frames };
  }
}
