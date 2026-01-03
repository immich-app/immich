import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, sql } from 'kysely';
import _ from 'lodash';
import { DateTime } from 'luxon';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { DownloadRequestTable } from 'src/schema/tables/download-request.table';

@Injectable()
export class DownloadRequestRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  cleanup() {
    return this.db
      .deleteFrom('download_request')
      .where('download_request.expiresAt', '<=', DateTime.now().toJSDate())
      .returning(['id'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db
      .selectFrom('download_request')
      .selectAll('download_request')
      .where((eb) =>
        eb.and([eb('download_request.id', '=', id), eb('download_request.expiresAt', '>', DateTime.now().toJSDate())]),
      )
      .leftJoin('download_request_asset', 'download_request_asset.downloadRequestId', 'download_request.id')
      .select((eb) =>
        eb.fn
          .coalesce(eb.fn.jsonAgg('download_request_asset.assetId'), sql`'[]'`)
          .$castTo<string[]>()
          .as('assetIds'),
      )
      .groupBy('download_request.id')
      .executeTakeFirstOrThrow();
  }

  async create(entity: Insertable<DownloadRequestTable> & { assetIds?: string[] }) {
    const { id } = await this.db
      .insertInto('download_request')
      .values(_.omit(entity, 'assetIds'))
      .returningAll()
      .executeTakeFirstOrThrow();

    if (entity.assetIds && entity.assetIds.length > 0) {
      await this.db
        .insertInto('download_request_asset')
        .values(entity.assetIds!.map((assetId) => ({ assetId, downloadRequestId: id })))
        .execute();
    }

    return this.getDownloadRequest(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.deleteFrom('download_request').where('download_request.id', '=', id).execute();
  }

  private getDownloadRequest(id: string) {
    return this.db
      .selectFrom('download_request')
      .selectAll('download_request')
      .where('download_request.id', '=', id)
      .executeTakeFirstOrThrow();
  }
}
