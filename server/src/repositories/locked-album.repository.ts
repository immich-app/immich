import { BadRequestException, Injectable } from '@nestjs/common';
import { type ExpressionBuilder, type Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetStatus, AssetVisibility } from 'src/enum.js';
import { DB } from 'src/schema/index.js';

export interface LockedAlbum {
  id: string;
  albumName: string;
  createdAt: Date;
  updatedAt: Date;
  assetCount: number;
}

export interface LockedAlbumAssetPage {
  assetIds: string[];
  hasNextPage: boolean;
}

const withAssetCount = (ownerId: string) => (eb: ExpressionBuilder<DB, 'locked_album'>) =>
  eb
    .selectFrom('locked_album_asset')
    .innerJoin('asset', 'asset.id', 'locked_album_asset.assetId')
    .whereRef('locked_album_asset.albumId', '=', 'locked_album.id')
    .where('asset.ownerId', '=', ownerId)
    .where('asset.visibility', '=', AssetVisibility.Locked)
    .where('asset.status', '=', AssetStatus.Active)
    .where('asset.deletedAt', 'is', null)
    .select((eb) => sql<number>`${eb.fn.countAll()}::int`.as('count'))
    .$asScalar()
    .$notNull()
    .as('assetCount');

@Injectable()
export class LockedAlbumRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  private albums(ownerId: string) {
    return this.db
      .selectFrom('locked_album')
      .where('locked_album.ownerId', '=', ownerId)
      .select(['locked_album.id', 'locked_album.albumName', 'locked_album.createdAt', 'locked_album.updatedAt'])
      .select(withAssetCount(ownerId));
  }

  getAll(ownerId: string): Promise<LockedAlbum[]> {
    return this.albums(ownerId).orderBy('locked_album.createdAt', 'desc').orderBy('locked_album.id').execute();
  }

  get(ownerId: string, id: string): Promise<LockedAlbum | undefined> {
    return this.albums(ownerId).where('locked_album.id', '=', id).executeTakeFirst();
  }

  async create(ownerId: string, albumName: string): Promise<LockedAlbum> {
    const row = await this.db
      .insertInto('locked_album')
      .values({ ownerId, albumName })
      .returning(['id', 'albumName', 'createdAt', 'updatedAt'])
      .executeTakeFirstOrThrow();
    return { ...row, assetCount: 0 };
  }

  async update(ownerId: string, id: string, albumName: string): Promise<LockedAlbum | undefined> {
    return this.db.transaction().execute(async (tx) => {
      const row = await tx
        .updateTable('locked_album')
        .set({ albumName, updatedAt: new Date() })
        .where('ownerId', '=', ownerId)
        .where('id', '=', id)
        .returning('id')
        .executeTakeFirst();
      return row ? new LockedAlbumRepository(tx).get(ownerId, id) : undefined;
    });
  }

  async delete(ownerId: string, id: string): Promise<boolean> {
    const result = await this.db
      .deleteFrom('locked_album')
      .where('ownerId', '=', ownerId)
      .where('id', '=', id)
      .executeTakeFirst();
    return result.numDeletedRows > 0n;
  }

  async getAssetIds(
    ownerId: string,
    id: string,
    { skip, take }: { skip: number; take: number },
  ): Promise<LockedAlbumAssetPage> {
    const rows = await this.db
      .selectFrom('locked_album_asset')
      .innerJoin('locked_album', 'locked_album.id', 'locked_album_asset.albumId')
      .innerJoin('asset', 'asset.id', 'locked_album_asset.assetId')
      .where('locked_album.ownerId', '=', ownerId)
      .where('locked_album.id', '=', id)
      .where('asset.ownerId', '=', ownerId)
      .where('asset.visibility', '=', AssetVisibility.Locked)
      .where('asset.status', '=', AssetStatus.Active)
      .where('asset.deletedAt', 'is', null)
      .select('asset.id')
      .orderBy('asset.id', 'asc')
      .offset(skip)
      .limit(take + 1)
      .execute();
    return { assetIds: rows.slice(0, take).map(({ id }) => id), hasNextPage: rows.length > take };
  }

  async addAssets(ownerId: string, id: string, ids: string[]): Promise<void> {
    await this.db.transaction().execute(async (tx) => {
      await this.lockAlbum(tx, ownerId, id);
      const assetIds = [...new Set(ids)].sort();
      if (assetIds.length === 0) {
        return;
      }

      // FOR UPDATE, not FOR KEY SHARE: visibility/status changes must wait until validation and insertion commit.
      // Consistent UUID lock order also avoids deadlocks between overlapping requests for different albums.
      const assets = await tx
        .selectFrom('asset')
        .select('id')
        .where('id', 'in', assetIds)
        .where('ownerId', '=', ownerId)
        .where('visibility', '=', AssetVisibility.Locked)
        .where('status', '=', AssetStatus.Active)
        .where('deletedAt', 'is', null)
        .orderBy('id', 'asc')
        .forUpdate()
        .execute();
      if (assets.length !== assetIds.length) {
        throw new BadRequestException('Invalid locked album or assets');
      }

      await tx
        .insertInto('locked_album_asset')
        .values(assetIds.map((assetId) => ({ albumId: id, assetId })))
        .onConflict((oc) => oc.columns(['albumId', 'assetId']).doNothing())
        .execute();
      await tx
        .updateTable('locked_album')
        .set({ updatedAt: new Date() })
        .where('id', '=', id)
        .where('ownerId', '=', ownerId)
        .execute();
    });
  }

  async removeAssets(ownerId: string, id: string, ids: string[]): Promise<void> {
    await this.db.transaction().execute(async (tx) => {
      await this.lockAlbum(tx, ownerId, id);
      if (ids.length === 0) {
        return;
      }
      await tx.deleteFrom('locked_album_asset').where('albumId', '=', id).where('assetId', 'in', ids).execute();
      await tx
        .updateTable('locked_album')
        .set({ updatedAt: new Date() })
        .where('id', '=', id)
        .where('ownerId', '=', ownerId)
        .execute();
    });
  }

  private async lockAlbum(db: Kysely<DB>, ownerId: string, id: string): Promise<void> {
    const album = await db
      .selectFrom('locked_album')
      .select('id')
      .where('ownerId', '=', ownerId)
      .where('id', '=', id)
      .forUpdate()
      .executeTakeFirst();
    if (!album) {
      throw new BadRequestException('Invalid locked album or assets');
    }
  }
}
