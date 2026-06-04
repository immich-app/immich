import { Injectable } from '@nestjs/common';
import { Insertable, Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import {
  VideoStreamSegmentTable,
  VideoStreamSessionTable,
  VideoStreamVariantTable,
} from 'src/schema/tables/video-stream.table';
import { withAudioStream, withVideoFormat, withVideoPackets, withVideoStream } from 'src/utils/database';

@Injectable()
export class VideoStreamRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  createSession(session: Insertable<VideoStreamSessionTable>) {
    return this.db.insertInto('video_stream_session').values(session).returning(['id']).executeTakeFirstOrThrow();
  }

  createVariant(variant: Insertable<VideoStreamVariantTable>) {
    return this.db.insertInto('video_stream_variant').values(variant).returning(['id']).executeTakeFirstOrThrow();
  }

  async createSegment(segment: Insertable<VideoStreamSegmentTable>) {
    await this.db.insertInto('video_stream_segment').values(segment).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getSession(id: string) {
    return this.db
      .selectFrom('video_stream_session')
      .selectAll()
      .where('id', '=', id)
      .where('expiresAt', '>', new Date())
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getVariant(id: string) {
    return this.db.selectFrom('video_stream_variant').selectAll().where('id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.NUMBER] })
  getSegment(variantId: string, index: number) {
    return this.db
      .selectFrom('video_stream_segment')
      .selectAll()
      .where('variantId', '=', variantId)
      .where('index', '=', index)
      .executeTakeFirst();
  }

  @GenerateSql()
  getExpiredSessions() {
    return this.db
      .selectFrom('video_stream_session')
      .innerJoin('asset', 'asset.id', 'video_stream_session.assetId')
      .select(['video_stream_session.id', 'asset.ownerId'])
      .where('video_stream_session.expiresAt', '<=', new Date())
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  async extendSession(id: string, expiresAt: Date) {
    await this.db.updateTable('video_stream_session').set({ expiresAt }).where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteSession(id: string) {
    await this.db.deleteFrom('video_stream_session').where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getForMainPlaylist(id: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .where('asset.id', '=', id)
      .innerJoin('asset_video', 'asset.id', 'asset_video.assetId')
      .innerJoin('asset_keyframe', 'asset.id', 'asset_keyframe.assetId')
      .select((eb) => withVideoStream(eb).$notNull().as('videoStream'))
      .select((eb) => withVideoPackets(eb).$notNull().as('packets'))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  async getForMediaPlaylist(id: string, sessionId: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .innerJoin('video_stream_session', 'asset.id', 'video_stream_session.assetId')
      .where('asset.id', '=', id)
      .where('video_stream_session.id', '=', sessionId)
      .where('video_stream_session.expiresAt', '>', new Date())
      .innerJoin('asset_video', 'asset.id', 'asset_video.assetId')
      .innerJoin('asset_keyframe', 'asset.id', 'asset_keyframe.assetId')
      .select((eb) => withVideoStream(eb).$notNull().as('videoStream'))
      .select((eb) => withVideoPackets(eb).$notNull().as('packets'))
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getForTranscoding(id: string) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .where('asset.id', '=', id)
      .leftJoin('asset_audio', 'asset.id', 'asset_audio.assetId')
      .innerJoin('asset_video', 'asset.id', 'asset_video.assetId')
      .innerJoin('asset_keyframe', 'asset.id', 'asset_keyframe.assetId')
      .select('asset.originalPath')
      .select((eb) => withAudioStream(eb).as('audioStream'))
      .select((eb) => withVideoStream(eb).$notNull().as('videoStream'))
      .select((eb) => withVideoFormat(eb).$notNull().as('format'))
      .select((eb) => withVideoPackets(eb).$notNull().as('packets'))
      .executeTakeFirst();
  }
}
