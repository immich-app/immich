import { Injectable } from '@nestjs/common';
import { Insertable, Kysely, NotNull, sql, Updateable } from 'kysely';
import { jsonObjectFrom } from 'kysely/helpers/postgres';
import _ from 'lodash';
import { InjectKysely } from 'nestjs-kysely';
import { Album, columns } from 'src/database';
import { DB, SharedLinks } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkType } from 'src/enum';

export type SharedLinkSearchOptions = {
  userId: string;
  albumId?: string;
};

@Injectable()
export class SharedLinkRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  get(userId: string, id: string) {
    return this.db
      .selectFrom('shared_links')
      .selectAll('shared_links')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('shared_link__asset')
            .whereRef('shared_links.id', '=', 'shared_link__asset.sharedLinksId')
            .innerJoin('assets', 'assets.id', 'shared_link__asset.assetsId')
            .where('assets.deletedAt', 'is', null)
            .selectAll('assets')
            .innerJoinLateral(
              (eb) => eb.selectFrom('exif').selectAll('exif').whereRef('exif.assetId', '=', 'assets.id').as('exifInfo'),
              (join) => join.onTrue(),
            )
            .select((eb) => eb.fn.toJson('exifInfo').as('exifInfo'))
            .orderBy('assets.fileCreatedAt', 'asc')
            .as('a'),
        (join) => join.onTrue(),
      )
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('albums')
            .selectAll('albums')
            .whereRef('albums.id', '=', 'shared_links.albumId')
            .where('albums.deletedAt', 'is', null)
            .leftJoin('albums_assets_assets', 'albums_assets_assets.albumsId', 'albums.id')
            .leftJoinLateral(
              (eb) =>
                eb
                  .selectFrom('assets')
                  .selectAll('assets')
                  .whereRef('albums_assets_assets.assetsId', '=', 'assets.id')
                  .where('assets.deletedAt', 'is', null)
                  .innerJoinLateral(
                    (eb) =>
                      eb
                        .selectFrom('exif')
                        .selectAll('exif')
                        .whereRef('exif.assetId', '=', 'assets.id')
                        .as('assets_exifInfo'),
                    (join) => join.onTrue(),
                  )
                  .select((eb) => eb.fn.toJson(eb.table('assets_exifInfo')).as('exifInfo'))
                  .orderBy('assets.fileCreatedAt', 'asc')
                  .as('assets'),
              (join) => join.onTrue(),
            )
            .innerJoinLateral(
              (eb) =>
                eb
                  .selectFrom('users')
                  .selectAll('users')
                  .whereRef('users.id', '=', 'albums.ownerId')
                  .where('users.deletedAt', 'is', null)
                  .as('owner'),
              (join) => join.onTrue(),
            )
            .select((eb) =>
              eb.fn.coalesce(eb.fn.jsonAgg('assets').filterWhere('assets.id', 'is not', null), sql`'[]'`).as('assets'),
            )
            .select((eb) => eb.fn.toJson('owner').as('owner'))
            .groupBy(['albums.id', sql`"owner".*`])
            .as('album'),
        (join) => join.onTrue(),
      )
      .select((eb) =>
        eb.fn
          .coalesce(eb.fn.jsonAgg('a').filterWhere('a.id', 'is not', null), sql`'[]'`)
          .$castTo<MapAsset[]>()
          .as('assets'),
      )
      .groupBy(['shared_links.id', sql`"album".*`])
      .select((eb) => eb.fn.toJson('album').$castTo<Album | null>().as('album'))
      .where('shared_links.id', '=', id)
      .where('shared_links.userId', '=', userId)
      .where((eb) => eb.or([eb('shared_links.type', '=', SharedLinkType.INDIVIDUAL), eb('album.id', 'is not', null)]))
      .orderBy('shared_links.createdAt', 'desc')
      .executeTakeFirst();
  }

  @GenerateSql({ params: [{ userId: DummyValue.UUID, albumId: DummyValue.UUID }] })
  getAll({ userId, albumId }: SharedLinkSearchOptions) {
    return this.db
      .selectFrom('shared_links')
      .selectAll('shared_links')
      .where('shared_links.userId', '=', userId)
      .leftJoin('shared_link__asset', 'shared_link__asset.sharedLinksId', 'shared_links.id')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('assets')
            .select((eb) => eb.fn.jsonAgg('assets').as('assets'))
            .whereRef('assets.id', '=', 'shared_link__asset.assetsId')
            .where('assets.deletedAt', 'is', null)
            .as('assets'),
        (join) => join.onTrue(),
      )
      .select('assets.assets')
      .$narrowType<{ assets: NotNull }>()
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('albums')
            .selectAll('albums')
            .whereRef('albums.id', '=', 'shared_links.albumId')
            .innerJoinLateral(
              (eb) =>
                eb
                  .selectFrom('users')
                  .select([
                    'users.id',
                    'users.email',
                    'users.createdAt',
                    'users.profileImagePath',
                    'users.isAdmin',
                    'users.shouldChangePassword',
                    'users.deletedAt',
                    'users.oauthId',
                    'users.updatedAt',
                    'users.storageLabel',
                    'users.name',
                    'users.quotaSizeInBytes',
                    'users.quotaUsageInBytes',
                    'users.status',
                    'users.profileChangedAt',
                  ])
                  .whereRef('users.id', '=', 'albums.ownerId')
                  .where('users.deletedAt', 'is', null)
                  .as('owner'),
              (join) => join.onTrue(),
            )
            .select((eb) => eb.fn.toJson('owner').as('owner'))
            .where('albums.deletedAt', 'is', null)
            .as('album'),
        (join) => join.onTrue(),
      )
      .select((eb) => eb.fn.toJson('album').$castTo<Album | null>().as('album'))
      .where((eb) => eb.or([eb('shared_links.type', '=', SharedLinkType.INDIVIDUAL), eb('album.id', 'is not', null)]))
      .$if(!!albumId, (eb) => eb.where('shared_links.albumId', '=', albumId!))
      .orderBy('shared_links.createdAt', 'desc')
      .distinctOn(['shared_links.createdAt'])
      .execute();
  }

  @GenerateSql({ params: [DummyValue.BUFFER] })
  async getByKey(key: Buffer) {
    return this.db
      .selectFrom('shared_links')
      .where('shared_links.key', '=', key)
      .leftJoin('albums', 'albums.id', 'shared_links.albumId')
      .where('albums.deletedAt', 'is', null)
      .select((eb) => [
        ...columns.authSharedLink,
        jsonObjectFrom(
          eb.selectFrom('users').select(columns.authUser).whereRef('users.id', '=', 'shared_links.userId'),
        ).as('user'),
      ])
      .where((eb) => eb.or([eb('shared_links.type', '=', SharedLinkType.INDIVIDUAL), eb('albums.id', 'is not', null)]))
      .executeTakeFirst();
  }

  async create(entity: Insertable<SharedLinks> & { assetIds?: string[] }) {
    const { id } = await this.db
      .insertInto('shared_links')
      .values(_.omit(entity, 'assetIds'))
      .returningAll()
      .executeTakeFirstOrThrow();

    if (entity.assetIds && entity.assetIds.length > 0) {
      await this.db
        .insertInto('shared_link__asset')
        .values(entity.assetIds!.map((assetsId) => ({ assetsId, sharedLinksId: id })))
        .execute();
    }

    return this.getSharedLinks(id);
  }

  async update(entity: Updateable<SharedLinks> & { id: string; assetIds?: string[] }) {
    const { id } = await this.db
      .updateTable('shared_links')
      .set(_.omit(entity, 'assets', 'album', 'assetIds'))
      .where('shared_links.id', '=', entity.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (entity.assetIds && entity.assetIds.length > 0) {
      await this.db
        .insertInto('shared_link__asset')
        .values(entity.assetIds!.map((assetsId) => ({ assetsId, sharedLinksId: id })))
        .execute();
    }

    return this.getSharedLinks(id);
  }

  async remove(id: string): Promise<void> {
    await this.db.deleteFrom('shared_links').where('shared_links.id', '=', id).execute();
  }

  private getSharedLinks(id: string) {
    return this.db
      .selectFrom('shared_links')
      .selectAll('shared_links')
      .where('shared_links.id', '=', id)
      .leftJoin('shared_link__asset', 'shared_link__asset.sharedLinksId', 'shared_links.id')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('assets')
            .whereRef('assets.id', '=', 'shared_link__asset.assetsId')
            .selectAll('assets')
            .innerJoinLateral(
              (eb) => eb.selectFrom('exif').whereRef('exif.assetId', '=', 'assets.id').selectAll().as('exif'),
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
      .groupBy('shared_links.id')
      .executeTakeFirstOrThrow();
  }
}
