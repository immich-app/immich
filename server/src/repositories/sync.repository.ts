import { Injectable } from '@nestjs/common';
import { Kysely, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { SyncAck } from 'src/types';

export type SyncBackfillOptions = {
  nowId: string;
  afterUpdateId?: string;
  beforeUpdateId: string;
};

const dummyBackfillOptions = {
  nowId: DummyValue.UUID,
  beforeUpdateId: DummyValue.UUID,
  afterUpdateId: DummyValue.UUID,
};

export type SyncCreatedAfterOptions = {
  nowId: string;
  userId: string;
  afterCreateId?: string;
};

const dummyCreateAfterOptions = {
  nowId: DummyValue.UUID,
  userId: DummyValue.UUID,
  afterCreateId: DummyValue.UUID,
};

export type SyncQueryOptions = {
  nowId: string;
  userId: string;
  ack?: SyncAck;
};

const dummyQueryOptions = {
  nowId: DummyValue.UUID,
  userId: DummyValue.UUID,
  ack: {
    updateId: DummyValue.UUID,
  },
};

@Injectable()
export class SyncRepository {
  album: AlbumSync;
  albumAsset: AlbumAssetSync;
  albumAssetExif: AlbumAssetExifSync;
  albumToAsset: AlbumToAssetSync;
  albumUser: AlbumUserSync;
  asset: AssetSync;
  assetExif: AssetExifSync;
  assetFace: AssetFaceSync;
  assetMetadata: AssetMetadataSync;
  authUser: AuthUserSync;
  memory: MemorySync;
  memoryToAsset: MemoryToAssetSync;
  partner: PartnerSync;
  partnerAsset: PartnerAssetsSync;
  partnerAssetExif: PartnerAssetExifsSync;
  partnerStack: PartnerStackSync;
  person: PersonSync;
  stack: StackSync;
  user: UserSync;
  userMetadata: UserMetadataSync;

  constructor(@InjectKysely() private db: Kysely<DB>) {
    this.album = new AlbumSync(this.db);
    this.albumAsset = new AlbumAssetSync(this.db);
    this.albumAssetExif = new AlbumAssetExifSync(this.db);
    this.albumToAsset = new AlbumToAssetSync(this.db);
    this.albumUser = new AlbumUserSync(this.db);
    this.asset = new AssetSync(this.db);
    this.assetExif = new AssetExifSync(this.db);
    this.assetFace = new AssetFaceSync(this.db);
    this.assetMetadata = new AssetMetadataSync(this.db);
    this.authUser = new AuthUserSync(this.db);
    this.memory = new MemorySync(this.db);
    this.memoryToAsset = new MemoryToAssetSync(this.db);
    this.partner = new PartnerSync(this.db);
    this.partnerAsset = new PartnerAssetsSync(this.db);
    this.partnerAssetExif = new PartnerAssetExifsSync(this.db);
    this.partnerStack = new PartnerStackSync(this.db);
    this.person = new PersonSync(this.db);
    this.stack = new StackSync(this.db);
    this.user = new UserSync(this.db);
    this.userMetadata = new UserMetadataSync(this.db);
  }
}

class BaseSync {
  constructor(protected db: Kysely<DB>) {}

  protected backfillQuery<T extends keyof DB>(t: T, { nowId, beforeUpdateId, afterUpdateId }: SyncBackfillOptions) {
    const { table, ref } = this.db.dynamic;
    const updateIdRef = ref(`${t}.updateId`);

    return this.db
      .selectFrom(table(t).as(t))
      .where(updateIdRef, '<', nowId)
      .where(updateIdRef, '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (qb) => qb.where(updateIdRef, '>=', afterUpdateId!))
      .orderBy(updateIdRef, 'asc');
  }

  protected auditQuery<T extends keyof DB>(t: T, { nowId, ack }: SyncQueryOptions) {
    const { table, ref } = this.db.dynamic;
    const idRef = ref(`${t}.id`);

    return this.db
      .selectFrom(table(t).as(t))
      .where(idRef, '<', nowId)
      .$if(!!ack, (qb) => qb.where(idRef, '>', ack!.updateId))
      .orderBy(idRef, 'asc');
  }

  protected auditCleanup<T extends keyof DB>(t: T, days: number) {
    const { table, ref } = this.db.dynamic;

    return this.db
      .deleteFrom(table(t).as(t))
      .where(ref(`${t}.deletedAt`), '<', sql.raw(`now() - interval '${days} days'`))
      .execute();
  }

  protected upsertQuery<T extends keyof DB>(t: T, { nowId, ack }: SyncQueryOptions) {
    const { table, ref } = this.db.dynamic;
    const updateIdRef = ref(`${t}.updateId`);

    return this.db
      .selectFrom(table(t).as(t))
      .where(updateIdRef, '<', nowId)
      .$if(!!ack, (qb) => qb.where(updateIdRef, '>', ack!.updateId))
      .orderBy(updateIdRef, 'asc');
  }
}

class AlbumSync extends BaseSync {
  @GenerateSql({ params: [dummyCreateAfterOptions] })
  getCreatedAfter({ nowId, userId, afterCreateId }: SyncCreatedAfterOptions) {
    return this.db
      .selectFrom('album_user')
      .select(['albumsId as id', 'createId'])
      .where('usersId', '=', userId)
      .$if(!!afterCreateId, (qb) => qb.where('createId', '>=', afterCreateId!))
      .where('createId', '<', nowId)
      .orderBy('createId', 'asc')
      .execute();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('album_audit', options)
      .select(['id', 'albumId'])
      .where('userId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('album_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.upsertQuery('album', options)
      .distinctOn(['album.id', 'album.updateId'])
      .leftJoin('album_user as album_users', 'album.id', 'album_users.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_users.usersId', '=', userId)]))
      .select([
        'album.id',
        'album.ownerId',
        'album.albumName as name',
        'album.description',
        'album.createdAt',
        'album.updatedAt',
        'album.albumThumbnailAssetId as thumbnailAssetId',
        'album.isActivityEnabled',
        'album.order',
        'album.updateId',
      ])
      .stream();
  }
}

class AlbumAssetSync extends BaseSync {
  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, albumId: string) {
    return this.backfillQuery('album_asset', options)
      .innerJoin('asset', 'asset.id', 'album_asset.assetsId')
      .select(columns.syncAsset)
      .select('album_asset.updateId')
      .where('album_asset.albumsId', '=', albumId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions, { updateId: DummyValue.UUID }], stream: true })
  getUpdates(options: SyncQueryOptions, albumToAssetAck: SyncAck) {
    const userId = options.userId;
    return this.upsertQuery('asset', options)
      .innerJoin('album_asset', 'album_asset.assetsId', 'asset.id')
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('album_asset.updateId', '<=', albumToAssetAck.updateId) // Ensure we only send updates for assets that the client already knows about
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getCreates(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.upsertQuery('album_asset', options)
      .select('album_asset.updateId')
      .innerJoin('asset', 'asset.id', 'album_asset.assetsId')
      .select(columns.syncAsset)
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumAssetExifSync extends BaseSync {
  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, albumId: string) {
    return this.backfillQuery('album_asset', options)
      .innerJoin('asset_exif', 'asset_exif.assetId', 'album_asset.assetsId')
      .select(columns.syncAssetExif)
      .select('album_asset.updateId')
      .where('album_asset.albumsId', '=', albumId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions, { updateId: DummyValue.UUID }], stream: true })
  getUpdates(options: SyncQueryOptions, albumToAssetAck: SyncAck) {
    const userId = options.userId;
    return this.upsertQuery('asset_exif', options)
      .innerJoin('album_asset', 'album_asset.assetsId', 'asset_exif.assetId')
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .where('album_asset.updateId', '<=', albumToAssetAck.updateId) // Ensure we only send exif updates for assets that the client already knows about
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getCreates(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.upsertQuery('album_asset', options)
      .select('album_asset.updateId')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'album_asset.assetsId')
      .select(columns.syncAssetExif)
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumToAssetSync extends BaseSync {
  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, albumId: string) {
    return this.backfillQuery('album_asset', options)
      .select(['album_asset.assetsId as assetId', 'album_asset.albumsId as albumId', 'album_asset.updateId'])
      .where('album_asset.albumsId', '=', albumId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.auditQuery('album_asset_audit', options)
      .select(['id', 'assetId', 'albumId'])
      .where((eb) =>
        eb(
          'albumId',
          'in',
          eb
            .selectFrom('album')
            .select(['id'])
            .where('ownerId', '=', userId)
            .union((eb) =>
              eb.parens(
                eb
                  .selectFrom('album_user')
                  .select(['album_user.albumsId as id'])
                  .where('album_user.usersId', '=', userId),
              ),
            ),
        ),
      )
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('album_asset_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.upsertQuery('album_asset', options)
      .select(['album_asset.assetsId as assetId', 'album_asset.albumsId as albumId', 'album_asset.updateId'])
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumUserSync extends BaseSync {
  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, albumId: string) {
    return this.backfillQuery('album_user', options)
      .select(columns.syncAlbumUser)
      .select('album_user.updateId')
      .where('albumsId', '=', albumId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.auditQuery('album_user_audit', options)
      .select(['id', 'userId', 'albumId'])
      .where((eb) =>
        eb(
          'albumId',
          'in',
          eb
            .selectFrom('album')
            .select(['id'])
            .where('ownerId', '=', userId)
            .union((eb) =>
              eb.parens(
                eb
                  .selectFrom('album_user')
                  .select(['album_user.albumsId as id'])
                  .where('album_user.usersId', '=', userId),
              ),
            ),
        ),
      )
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('album_user_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.upsertQuery('album_user', options)
      .select(columns.syncAlbumUser)
      .select('album_user.updateId')
      .where((eb) =>
        eb(
          'album_user.albumsId',
          'in',
          eb
            .selectFrom('album')
            .select(['id'])
            .where('ownerId', '=', userId)
            .union((eb) =>
              eb.parens(
                eb
                  .selectFrom('album_user as albumUsers')
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
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('asset_audit', options)
      .select(['id', 'assetId'])
      .where('ownerId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('asset_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('asset', options)
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('ownerId', '=', options.userId)
      .stream();
  }
}

class AuthUserSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('user', options)
      .select(columns.syncUser)
      .select(['isAdmin', 'pinCode', 'oauthId', 'storageLabel', 'quotaSizeInBytes', 'quotaUsageInBytes'])
      .where('id', '=', options.userId)
      .stream();
  }
}

class PersonSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('person_audit', options)
      .select(['id', 'personId'])
      .where('ownerId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('person_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('person', options)
      .select([
        'id',
        'createdAt',
        'updatedAt',
        'ownerId',
        'name',
        'birthDate',
        'isHidden',
        'isFavorite',
        'color',
        'updateId',
        'faceAssetId',
      ])
      .where('ownerId', '=', options.userId)
      .stream();
  }
}

class AssetFaceSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('asset_face_audit', options)
      .select(['asset_face_audit.id', 'assetFaceId'])
      .leftJoin('asset', 'asset.id', 'asset_face_audit.assetId')
      .where('asset.ownerId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('asset_face_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('asset_face', options)
      .select([
        'asset_face.id',
        'assetId',
        'personId',
        'imageWidth',
        'imageHeight',
        'boundingBoxX1',
        'boundingBoxY1',
        'boundingBoxX2',
        'boundingBoxY2',
        'sourceType',
        'asset_face.updateId',
      ])
      .leftJoin('asset', 'asset.id', 'asset_face.assetId')
      .where('asset.ownerId', '=', options.userId)
      .stream();
  }
}

class AssetExifSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('asset_exif', options)
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .where('assetId', 'in', (eb) => eb.selectFrom('asset').select('id').where('ownerId', '=', options.userId))
      .stream();
  }
}

class MemorySync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('memory_audit', options)
      .select(['id', 'memoryId'])
      .where('userId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('memory_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('memory', options)
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
      .where('ownerId', '=', options.userId)
      .stream();
  }
}

class MemoryToAssetSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('memory_asset_audit', options)
      .select(['id', 'memoryId', 'assetId'])
      .where('memoryId', 'in', (eb) => eb.selectFrom('memory').select('id').where('ownerId', '=', options.userId))
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('memory_asset_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('memory_asset', options)
      .select(['memoriesId as memoryId', 'assetsId as assetId'])
      .select('updateId')
      .where('memoriesId', 'in', (eb) => eb.selectFrom('memory').select('id').where('ownerId', '=', options.userId))
      .stream();
  }
}

class PartnerSync extends BaseSync {
  @GenerateSql({ params: [dummyCreateAfterOptions] })
  getCreatedAfter({ nowId, userId, afterCreateId }: SyncCreatedAfterOptions) {
    return this.db
      .selectFrom('partner')
      .select(['sharedById', 'createId'])
      .where('sharedWithId', '=', userId)
      .$if(!!afterCreateId, (qb) => qb.where('createId', '>=', afterCreateId!))
      .where('createId', '<', nowId)
      .orderBy('partner.createId', 'asc')
      .execute();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.auditQuery('partner_audit', options)
      .select(['id', 'sharedById', 'sharedWithId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('partner_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    const userId = options.userId;
    return this.upsertQuery('partner', options)
      .select(['sharedById', 'sharedWithId', 'inTimeline', 'updateId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .stream();
  }
}

class PartnerAssetsSync extends BaseSync {
  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, partnerId: string) {
    return this.backfillQuery('asset', options)
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('ownerId', '=', partnerId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('asset_audit', options)
      .select(['id', 'assetId'])
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', options.userId),
      )
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('asset', options)
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', options.userId),
      )
      .stream();
  }
}

class PartnerAssetExifsSync extends BaseSync {
  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, partnerId: string) {
    return this.backfillQuery('asset_exif', options)
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
      .where('asset.ownerId', '=', partnerId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('asset_exif', options)
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .where('assetId', 'in', (eb) =>
        eb
          .selectFrom('asset')
          .select('id')
          .where('ownerId', 'in', (eb) =>
            eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', options.userId),
          ),
      )
      .stream();
  }
}

class StackSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('stack_audit', options)
      .select(['id', 'stackId'])
      .where('userId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('stack_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('stack', options)
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', '=', options.userId)
      .stream();
  }
}

class PartnerStackSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('stack_audit', options)
      .select(['id', 'stackId'])
      .where('userId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', options.userId),
      )
      .stream();
  }

  @GenerateSql({ params: [dummyBackfillOptions, DummyValue.UUID], stream: true })
  getBackfill(options: SyncBackfillOptions, partnerId: string) {
    return this.backfillQuery('stack', options)
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', '=', partnerId)
      .stream();
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('stack', options)
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', options.userId),
      )
      .stream();
  }
}

class UserSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('user_audit', options).select(['id', 'userId']).stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('user_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('user', options).select(columns.syncUser).stream();
  }
}

class UserMetadataSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getDeletes(options: SyncQueryOptions) {
    return this.auditQuery('user_metadata_audit', options)
      .select(['id', 'userId', 'key'])
      .where('userId', '=', options.userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('user_metadata_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions], stream: true })
  getUpserts(options: SyncQueryOptions) {
    return this.upsertQuery('user_metadata', options)
      .select(['userId', 'key', 'value', 'updateId'])
      .where('userId', '=', options.userId)
      .stream();
  }
}

class AssetMetadataSync extends BaseSync {
  @GenerateSql({ params: [dummyQueryOptions, DummyValue.UUID], stream: true })
  getDeletes(options: SyncQueryOptions, userId: string) {
    return this.auditQuery('asset_metadata_audit', options)
      .select(['asset_metadata_audit.id', 'assetId', 'key'])
      .leftJoin('asset', 'asset.id', 'asset_metadata_audit.assetId')
      .where('asset.ownerId', '=', userId)
      .stream();
  }

  cleanupAuditTable(daysAgo: number) {
    return this.auditCleanup('asset_metadata_audit', daysAgo);
  }

  @GenerateSql({ params: [dummyQueryOptions, DummyValue.UUID], stream: true })
  getUpserts(options: SyncQueryOptions, userId: string) {
    return this.upsertQuery('asset_metadata', options)
      .select(['assetId', 'key', 'value', 'asset_metadata.updateId'])
      .innerJoin('asset', 'asset.id', 'asset_metadata.assetId')
      .where('asset.ownerId', '=', userId)
      .stream();
  }
}
