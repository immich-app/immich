import { Injectable } from '@nestjs/common';
import { Kysely, SelectQueryBuilder, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { SyncAck } from 'src/types';

type AuditTables =
  | 'users_audit'
  | 'partners_audit'
  | 'assets_audit'
  | 'albums_audit'
  | 'album_users_audit'
  | 'album_assets_audit'
  | 'memories_audit'
  | 'memory_assets_audit'
  | 'stacks_audit';
type UpsertTables =
  | 'users'
  | 'partners'
  | 'assets'
  | 'exif'
  | 'albums'
  | 'albums_shared_users_users'
  | 'memories'
  | 'memories_assets_assets'
  | 'asset_stack';

@Injectable()
export class SyncRepository {
  album: AlbumSync;
  albumAsset: AlbumAssetSync;
  albumAssetExif: AlbumAssetExifSync;
  albumToAsset: AlbumToAssetSync;
  albumUser: AlbumUserSync;
  asset: AssetSync;
  assetExif: AssetExifSync;
  memory: MemorySync;
  memoryToAsset: MemoryToAssetSync;
  partner: PartnerSync;
  partnerAsset: PartnerAssetsSync;
  partnerAssetExif: PartnerAssetExifsSync;
  partnerStack: PartnerStackSync;
  stack: StackSync;
  user: UserSync;

  constructor(@InjectKysely() private db: Kysely<DB>) {
    this.album = new AlbumSync(this.db);
    this.albumAsset = new AlbumAssetSync(this.db);
    this.albumAssetExif = new AlbumAssetExifSync(this.db);
    this.albumToAsset = new AlbumToAssetSync(this.db);
    this.albumUser = new AlbumUserSync(this.db);
    this.asset = new AssetSync(this.db);
    this.assetExif = new AssetExifSync(this.db);
    this.memory = new MemorySync(this.db);
    this.memoryToAsset = new MemoryToAssetSync(this.db);
    this.partner = new PartnerSync(this.db);
    this.partnerAsset = new PartnerAssetsSync(this.db);
    this.partnerAssetExif = new PartnerAssetExifsSync(this.db);
    this.partnerStack = new PartnerStackSync(this.db);
    this.stack = new StackSync(this.db);
    this.user = new UserSync(this.db);
  }
}

class BaseSync {
  constructor(protected db: Kysely<DB>) {}

  protected auditTableFilters<T extends keyof Pick<DB, AuditTables>, D>(
    qb: SelectQueryBuilder<DB, T, D>,
    ack?: SyncAck,
  ) {
    const builder = qb as SelectQueryBuilder<DB, AuditTables, D>;
    return builder
      .where('deletedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
      .orderBy('id', 'asc') as SelectQueryBuilder<DB, T, D>;
  }

  protected upsertTableFilters<T extends keyof Pick<DB, UpsertTables>, D>(
    qb: SelectQueryBuilder<DB, T, D>,
    ack?: SyncAck,
  ) {
    const builder = qb as SelectQueryBuilder<DB, UpsertTables, D>;
    return builder
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
      .orderBy('updateId', 'asc') as SelectQueryBuilder<DB, T, D>;
  }
}

class AlbumSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getCreatedAfter(userId: string, afterCreateId?: string) {
    return this.db
      .selectFrom('albums_shared_users_users')
      .select(['albumsId as id', 'createId'])
      .where('usersId', '=', userId)
      .$if(!!afterCreateId, (qb) => qb.where('createId', '>=', afterCreateId!))
      .where('createdAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy('createId', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('albums_audit')
      .select(['id', 'albumId'])
      .where('userId', '=', userId)
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('albums')
      .distinctOn(['albums.id', 'albums.updateId'])
      .where('albums.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('albums.updateId', '>', ack!.updateId))
      .orderBy('albums.updateId', 'asc')
      .leftJoin('albums_shared_users_users as album_users', 'albums.id', 'album_users.albumsId')
      .where((eb) => eb.or([eb('albums.ownerId', '=', userId), eb('album_users.usersId', '=', userId)]))
      .select([
        'albums.id',
        'albums.ownerId',
        'albums.albumName as name',
        'albums.description',
        'albums.createdAt',
        'albums.updatedAt',
        'albums.albumThumbnailAssetId as thumbnailAssetId',
        'albums.isActivityEnabled',
        'albums.order',
        'albums.updateId',
      ])
      .stream();
  }
}

class AlbumAssetSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('assets')
      .innerJoin('albums_assets_assets as album_assets', 'album_assets.assetsId', 'assets.id')
      .select(columns.syncAsset)
      .select('assets.updateId')
      .where('album_assets.albumsId', '=', albumId)
      .where('assets.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('assets.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('assets.updateId', '>=', afterUpdateId!))
      .orderBy('assets.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .innerJoin('albums_assets_assets as album_assets', 'album_assets.assetsId', 'assets.id')
      .select(columns.syncAsset)
      .select('assets.updateId')
      .where('assets.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('assets.updateId', '>', ack!.updateId))
      .orderBy('assets.updateId', 'asc')
      .innerJoin('albums', 'albums.id', 'album_assets.albumsId')
      .leftJoin('albums_shared_users_users as album_users', 'album_users.albumsId', 'album_assets.albumsId')
      .where((eb) => eb.or([eb('albums.ownerId', '=', userId), eb('album_users.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumAssetExifSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('exif')
      .innerJoin('albums_assets_assets as album_assets', 'album_assets.assetsId', 'exif.assetId')
      .select(columns.syncAssetExif)
      .select('exif.updateId')
      .where('album_assets.albumsId', '=', albumId)
      .where('exif.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('exif.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('exif.updateId', '>=', afterUpdateId!))
      .orderBy('exif.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .innerJoin('albums_assets_assets as album_assets', 'album_assets.assetsId', 'exif.assetId')
      .select(columns.syncAssetExif)
      .select('exif.updateId')
      .where('exif.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('exif.updateId', '>', ack!.updateId))
      .orderBy('exif.updateId', 'asc')
      .innerJoin('albums', 'albums.id', 'album_assets.albumsId')
      .leftJoin('albums_shared_users_users as album_users', 'album_users.albumsId', 'album_assets.albumsId')
      .where((eb) => eb.or([eb('albums.ownerId', '=', userId), eb('album_users.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumToAssetSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('albums_assets_assets as album_assets')
      .select(['album_assets.assetsId as assetId', 'album_assets.albumsId as albumId', 'album_assets.updateId'])
      .where('album_assets.albumsId', '=', albumId)
      .where('album_assets.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('album_assets.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('album_assets.updateId', '>=', afterUpdateId!))
      .orderBy('album_assets.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('album_assets_audit')
      .select(['id', 'assetId', 'albumId'])
      .where((eb) =>
        eb(
          'albumId',
          'in',
          eb
            .selectFrom('albums')
            .select(['id'])
            .where('ownerId', '=', userId)
            .union((eb) =>
              eb.parens(
                eb
                  .selectFrom('albums_shared_users_users as albumUsers')
                  .select(['albumUsers.albumsId as id'])
                  .where('albumUsers.usersId', '=', userId),
              ),
            ),
        ),
      )
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('albums_assets_assets as album_assets')
      .select(['album_assets.assetsId as assetId', 'album_assets.albumsId as albumId', 'album_assets.updateId'])
      .where('album_assets.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('album_assets.updateId', '>', ack!.updateId))
      .orderBy('album_assets.updateId', 'asc')
      .innerJoin('albums', 'albums.id', 'album_assets.albumsId')
      .leftJoin('albums_shared_users_users as album_users', 'album_users.albumsId', 'album_assets.albumsId')
      .where((eb) => eb.or([eb('albums.ownerId', '=', userId), eb('album_users.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumUserSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('albums_shared_users_users as album_users')
      .select(columns.syncAlbumUser)
      .select('album_users.updateId')
      .where('albumsId', '=', albumId)
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('updateId', '>=', afterUpdateId!))
      .orderBy('updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('album_users_audit')
      .select(['id', 'userId', 'albumId'])
      .where((eb) =>
        eb(
          'albumId',
          'in',
          eb
            .selectFrom('albums')
            .select(['id'])
            .where('ownerId', '=', userId)
            .union((eb) =>
              eb.parens(
                eb
                  .selectFrom('albums_shared_users_users as albumUsers')
                  .select(['albumUsers.albumsId as id'])
                  .where('albumUsers.usersId', '=', userId),
              ),
            ),
        ),
      )
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('albums_shared_users_users as album_users')
      .select(columns.syncAlbumUser)
      .select('album_users.updateId')
      .where('album_users.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .$if(!!ack, (qb) => qb.where('album_users.updateId', '>', ack!.updateId))
      .orderBy('album_users.updateId', 'asc')
      .where((eb) =>
        eb(
          'album_users.albumsId',
          'in',
          eb
            .selectFrom('albums')
            .select(['id'])
            .where('ownerId', '=', userId)
            .union((eb) =>
              eb.parens(
                eb
                  .selectFrom('albums_shared_users_users as albumUsers')
                  .select(['albumUsers.albumsId as id'])
                  .where('albumUsers.usersId', '=', userId),
              ),
            ),
        ),
      )
      .stream();
  }
}

class AssetSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets_audit')
      .select(['id', 'assetId'])
      .where('ownerId', '=', userId)
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .select('assets.updateId')
      .where('ownerId', '=', userId)
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class AssetExifSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .select(columns.syncAssetExif)
      .select('exif.updateId')
      .where('assetId', 'in', (eb) => eb.selectFrom('assets').select('id').where('ownerId', '=', userId))
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class MemorySync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('memories_audit')
      .select(['id', 'memoryId'])
      .where('userId', '=', userId)
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('memories')
      .select([
        'id',
        'createdAt',
        'updatedAt',
        'deletedAt',
        'ownerId',
        'type',
        'data',
        'isSaved',
        'memoryAt',
        'seenAt',
        'showAt',
        'hideAt',
      ])
      .select('updateId')
      .where('ownerId', '=', userId)
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class MemoryToAssetSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('memory_assets_audit')
      .select(['id', 'memoryId', 'assetId'])
      .where('memoryId', 'in', (eb) => eb.selectFrom('memories').select('id').where('ownerId', '=', userId))
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('memories_assets_assets')
      .select(['memoriesId as memoryId', 'assetsId as assetId'])
      .select('updateId')
      .where('memoriesId', 'in', (eb) => eb.selectFrom('memories').select('id').where('ownerId', '=', userId))
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class PartnerSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID] })
  getCreatedAfter(userId: string, afterCreateId?: string) {
    return this.db
      .selectFrom('partners')
      .select(['sharedById', 'createId'])
      .where('sharedWithId', '=', userId)
      .$if(!!afterCreateId, (qb) => qb.where('createId', '>=', afterCreateId!))
      .where('createdAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .orderBy('partners.createId', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('partners_audit')
      .select(['id', 'sharedById', 'sharedWithId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('partners')
      .select(['sharedById', 'sharedWithId', 'inTimeline', 'updateId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class PartnerAssetsSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(partnerId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .select('assets.updateId')
      .where('ownerId', '=', partnerId)
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('updateId', '>=', afterUpdateId!))
      .orderBy('updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets_audit')
      .select(['id', 'assetId'])
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('assets')
      .select(columns.syncAsset)
      .select('assets.updateId')
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class PartnerAssetExifsSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(partnerId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('exif')
      .select(columns.syncAssetExif)
      .select('exif.updateId')
      .innerJoin('assets', 'assets.id', 'exif.assetId')
      .where('assets.ownerId', '=', partnerId)
      .where('exif.updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('exif.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('exif.updateId', '>=', afterUpdateId!))
      .orderBy('exif.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('exif')
      .select(columns.syncAssetExif)
      .select('exif.updateId')
      .where('assetId', 'in', (eb) =>
        eb
          .selectFrom('assets')
          .select('id')
          .where('ownerId', 'in', (eb) =>
            eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
          ),
      )
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class StackSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('stacks_audit')
      .select(['id', 'stackId'])
      .where('userId', '=', userId)
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_stack')
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', '=', userId)
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}

class PartnerStackSync extends BaseSync {
  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getDeletes(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('stacks_audit')
      .select(['id', 'stackId'])
      .where('userId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.UUID, DummyValue.UUID], stream: true })
  getBackfill(partnerId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('asset_stack')
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', '=', partnerId)
      .where('updatedAt', '<', sql.raw<Date>("now() - interval '1 millisecond'"))
      .where('updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('updateId', '>=', afterUpdateId!))
      .orderBy('updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID], stream: true })
  getUpserts(userId: string, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_stack')
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partners').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}
class UserSync extends BaseSync {
  @GenerateSql({ params: [], stream: true })
  getDeletes(ack?: SyncAck) {
    return this.db
      .selectFrom('users_audit')
      .select(['id', 'userId'])
      .$call((qb) => this.auditTableFilters(qb, ack))
      .stream();
  }

  @GenerateSql({ params: [], stream: true })
  getUpserts(ack?: SyncAck) {
    return this.db
      .selectFrom('users')
      .select(['id', 'name', 'email', 'deletedAt', 'updateId'])
      .$call((qb) => this.upsertTableFilters(qb, ack))
      .stream();
  }
}
