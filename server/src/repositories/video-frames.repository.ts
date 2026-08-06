import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { VideoFramesTable } from 'src/schema/tables/video-frames.table';

export type VideoFramesInsert = Omit<Insertable<VideoFramesTable>, 'assetId'>;

@Injectable()
export class VideoFrameRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, [{ byteOffset: [0], byteSize: [0], intervalChange: [0] }]] })
  async upsertFrames(assetId: string, frames: VideoFramesInsert) {
    return this.db
      .insertInto('video_frames')
      .values({ assetId, ...frames })
      .onConflict((oc) => oc.column('assetId').doUpdateSet({ ...frames }))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteFrames(assetId: string) {
    await this.db.deleteFrom('video_frames').where('assetId', '=', assetId).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getFrames(assetId: string) {
    return this.db.selectFrom('video_frames').selectAll().where('assetId', '=', assetId).executeTakeFirst();
  }
}
