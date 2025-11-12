import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';

export type VideoSegmentUpsert = {
  segmentIndex: number;
  startTime: number;
  endTime: number;
  embedding: string;
};

@Injectable()
export class VideoSegmentRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  deleteByAssetId(assetId: string) {
    return this.db.deleteFrom('video_segment').where('assetId', '=', assetId).execute();
  }

  async replace(assetId: string, segments: VideoSegmentUpsert[]): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx.deleteFrom('video_segment').where('assetId', '=', assetId).execute();
      if (segments.length === 0) {
        return;
      }

      await trx
        .insertInto('video_segment')
        .values(
          segments.map((segment) => ({
            assetId,
            segmentIndex: segment.segmentIndex,
            startTime: segment.startTime,
            endTime: segment.endTime,
            embedding: segment.embedding,
          })),
        )
        .execute();
    });
  }
}
