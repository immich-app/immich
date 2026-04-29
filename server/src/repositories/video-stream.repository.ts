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
    return this.db.selectFrom('video_stream_session').selectAll().where('id', '=', id).executeTakeFirst();
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
    return this.db.selectFrom('video_stream_session').select(['id']).where('expiresAt', '<=', new Date()).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.DATE] })
  async extendSession(id: string, expiresAt: Date) {
    await this.db.updateTable('video_stream_session').set({ expiresAt }).where('id', '=', id).execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async deleteSession(id: string) {
    await this.db.deleteFrom('video_stream_session').where('id', '=', id).execute();
  }
}
