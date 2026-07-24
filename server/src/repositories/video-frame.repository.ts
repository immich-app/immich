import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { VideoFrameTable } from 'src/schema/tables/video-frame.table';

export type VideoFrameInsert = Omit<Insertable<VideoFrameTable>, 'assetId'>;

@Injectable()
export class VideoFrameRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

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

  // TODO: implement this in a follow-up PR (ML on extracted frames)
  // @GenerateSql({ params: [DummyValue.UUID] })
  // async getFramesForEmbedding(assetId: string) {
  //   const extraction = await this.db
  //     .selectFrom('asset')
  //     .innerJoin('asset_file', 'asset.id', 'asset_file.assetId')
  //     .select(['asset_file.path'])
  //     .where('asset_file.assetId', '=', assetId)
  //     .where('asset_file.type', '=', sql.lit(AssetFileType.SampledVideo))
  //     .executeTakeFirst();

  //   if (!extraction?.path) {
  //     return null;
  //   }

  //   const frames = await this.db
  //     .selectFrom('video_frame')
  //     .selectAll()
  //     .where('assetId', '=', assetId)
  //     .orderBy('frameIndex', 'asc')
  //     .execute();

  //   return { path: extraction.path, frames };
  // }
}
