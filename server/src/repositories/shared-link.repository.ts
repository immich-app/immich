import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, sql, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import _ from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { Album, columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkType } from 'src/enum';
import { DB } from 'src/schema';
import { SharedLinkTable } from 'src/schema/tables/shared-link.table';

export type SharedLinkSearchOptions = {
  userId: string;
  id?: string;
  albumId?: string;
};

@Injectable()
export class SharedLinkRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  get(userId: string, id: string) {
    return this.db
      .selectFrom('shared_link')
      .selectAll('shared_link')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('shared_link_asset')
            .whereRef('shared_link.id', '=', 'shared_link_asset.sharedLinkId')
            .innerJoin('asset', 'asset.id', 'shared_link_asset.assetId')
            .where('asset.deletedAt', 'is', null)
            .selectAll('asset')
            .innerJoinLateral(
              (eb) =>
                eb
                  .selectFrom('asset_exif')
                  .selectAll('asset_exif')
                  .whereRef('asset_exif.assetId', '=', 'asset.id')
                  .as('exifInfo'),
              (join) => join.onTrue(),
            )
            .select((eb) => eb.fn.toJson('exifInfo').as('exifInfo'))
            .orderBy('asset.fileCreatedAt', 'asc')
            .as('a'),
        (join) => join.onTrue(),
      )
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('album')
            .selectAll('album')
            .whereRef('album.id', '=', 'shared_link.albumId')
            .where('album.deletedAt', 'is', null)
            .leftJoin('album_asset', 'album_asset.albumId', 'album.id')
            .leftJoinLateral(
              (eb) =>
                eb
                  .selectFrom('asset')
                  .selectAll('asset')
                  .whereRef('album_asset.assetId', '=', 'asset.id')
                  .where('asset.deletedAt', 'is', null)
                  .innerJoinLateral(
                    (eb) =>
                      eb
                        .selectFrom('asset_exif')
                        .selectAll('asset_exif')
                        .whereRef('asset_exif.assetId', '=', 'asset.id')
                        .as('exifInfo'),
                    (join) => join.onTrue(),
                  )
                  .select((eb) => eb.fn.toJson(eb.table('exifInfo')).as('exifInfo'))
                  .orderBy('asset.fileCreatedAt', 'asc')
                  .as('assets'),
              (join) => join.onTrue(),
            )
            .innerJoinLateral(
              (eb) =>
                eb
                  .selectFrom('user')
                  .selectAll('user')
                  .whereRef('user.id', '=', 'album.ownerId')
                  .where('user.deletedAt', 'is', null)
                  .as('owner'),
              (join) => join.onTrue(),
            )
            .select((eb) =>
              eb.fn
                .coalesce(
                  eb.fn
                    .jsonAgg('assets')
                    .orderBy('assets.fileCreatedAt', 'asc')
                    .filterWhere('assets.id', 'is not', null),

                  sql`'[]'`,
                )
                .as('assets'),
            )
            .select((eb) => eb.fn.toJson('owner').as('owner'))
            .groupBy(['album.id', sql`"owner".*`])
            .as('album'),
        (join) => join.onTrue(),
      )
      .select((eb) =>
        eb.fn
          .coalesce(eb.fn.jsonAgg('a').filterWhere('a.id', 'is not', null), sql`'[]'`)
          .$castTo<MapAsset[]>()
          .as('assets'),
      )
      .groupBy(['shared_link.id', sql`"album".*`])
      .select((eb) => eb.fn.toJson('album').$castTo<Album | null>().as('album'))
      .where('shared_link.id', '=', id)
      .where('shared_link.userId', '=', userId)
      .where((eb) => eb.or([eb('shared_link.type', '=', SharedLinkType.Individual), eb('album.id', 'is not', null)]))
      .orderBy('shared_link.createdAt', 'desc')
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, albumId: DummyValue.UUID }] })
  getAll({ userId, id, albumId }: SharedLinkSearchOptions) {
    return this.db
      .selectFrom('shared_link')
      .selectAll('shared_link')
      .where('shared_link.userId', '=', userId)
      .leftJoin('shared_link_asset', 'shared_link_asset.sharedLinkId', 'shared_link.id')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset')
            .select((eb) => eb.fn.jsonAgg('asset').as('assets'))
            .whereRef('asset.id', '=', 'shared_link_asset.assetId')
            .where('asset.deletedAt', 'is', null)
            .as('assets'),
        (join) => join.onTrue(),
      )
      .select('assets.assets')
      .$narrowType<{ assets: NotNull }>()
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('album')
            .selectAll('album')
            .whereRef('album.id', '=', 'shared_link.albumId')
            .innerJoinLateral(
              (eb) =>
                eb
                  .selectFrom('user')
                  .select([
                    'user.id',
                    'user.email',
                    'user.createdAt',
                    'user.profileImagePath',
                    'user.isAdmin',
                    'user.shouldChangePassword',
                    'user.deletedAt',
                    'user.oauthId',
                    'user.updatedAt',
                    'user.storageLabel',
                    'user.name',
                    'user.quotaSizeInBytes',
                    'user.quotaUsageInBytes',
                    'user.status',
                    'user.profileChangedAt',
                  ])
                  .whereRef('user.id', '=', 'album.ownerId')
                  .where('user.deletedAt', 'is', null)
                  .as('owner'),
              (join) => join.onTrue(),
            )
            .select((eb) => eb.fn.toJson('owner').as('owner'))
            .where('album.deletedAt', 'is', null)
            .as('album'),
        (join) => join.onTrue(),
      )
      .select((eb) => eb.fn.toJson('album').$castTo<Album | null>().as('album'))
      .where((eb) => eb.or([eb('shared_link.type', '=', SharedLinkType.Individual), eb('album.id', 'is not', null)]))
      .$if(!!albumId, (eb) => eb.where('shared_link.albumId', '=', albumId!))
      .$if(!!id, (eb) => eb.where('shared_link.id', '=', id!))
      .orderBy('shared_link.createdAt', 'desc')
      .distinctOn(['shared_link.createdAt'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.BUFFER] })
  getByKey(key: Buffer) {
    return this.authBuilder().where('shared_link.key', '=', key).executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.BUFFER] })
  getBySlug(slug: string) {
    return this.authBuilder().where('shared_link.slug', '=', slug).executeTakeFirst();
  }

  private authBuilder() {
    return this.db
      .selectFrom('shared_link')
      .leftJoin('album', 'album.id', 'shared_link.albumId')
      .where('album.deletedAt', 'is', null)
      .select((eb) => [
        ...columns.authSharedLink,
        jsonObjectFrom(
          eb.selectFrom('user').select(columns.authUser).whereRef('user.id', '=', 'shared_link.userId'),
        ).as('user'),
      ])
      .where((eb) => eb.or([eb('shared_link.type', '=', SharedLinkType.Individual), eb('album.id', 'is not', null)]));
  }

  async create(entity: Insertable<SharedLinkTable> & { assetIds?: string[] }) {
    const { id } = await this.db
      .insertInto('shared_link')
      .values(_.omit(entity, 'assetIds'))
      .returningAll()
      .executeTakeFirstOrThrow();

    if (entity.assetIds && entity.assetIds.length > 0) {
      await this.db
        .insertInto('shared_link_asset')
        .values(entity.assetIds!.map((assetId) => ({ assetId, sharedLinkId: id })))
        .execute();
    }

    return this.getSharedLinks(id);
  }

  async update(entity: Updateable<SharedLinkTable> & { id: string; assetIds?: string[] }) {
    const { id } = await this.db
      .updateTable('shared_link')
      .set(_.omit(entity, 'assets', 'album', 'assetIds'))
      .where('shared_link.id', '=', entity.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (entity.assetIds && entity.assetIds.length > 0) {
      await this.db
        .insertInto('shared_link_asset')
        .values(entity.assetIds!.map((assetId) => ({ assetId, sharedLinkId: id })))
        .execute();
    }

    return this.getSharedLinks(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.deleteFrom('shared_link').where('shared_link.id', '=', id).execute();
  }

  private getSharedLinks(id: string) {
    return this.db
      .selectFrom('shared_link')
      .selectAll('shared_link')
      .where('shared_link.id', '=', id)
      .leftJoin('shared_link_asset', 'shared_link_asset.sharedLinkId', 'shared_link.id')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset')
            .whereRef('asset.id', '=', 'shared_link_asset.assetId')
            .selectAll('asset')
            .innerJoinLateral(
              (eb) =>
                eb.selectFrom('asset_exif').whereRef('asset_exif.assetId', '=', 'asset.id').selectAll().as('exif'),
              (join) => join.onTrue(),
            )
            .as('assets'),
        (join) => join.onTrue(),
      )
      .select((eb) =>
        eb.fn
          .coalesce(eb.fn.jsonAgg('assets').filterWhere('assets.id', 'is not', null), sql`'[]'`)
          .$castTo<MapAsset[]>()
          .as('assets'),
      )
      .groupBy('shared_link.id')
      .executeTakeFirstOrThrow();
  }
}
