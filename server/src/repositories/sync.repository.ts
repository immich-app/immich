import { Injectable } from '@nestjs/common';
import { Kysely, SelectQueryBuilder } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';
import { SyncAck } from 'src/types';

type AuditTables =
  | 'user_audit'
  | 'partner_audit'
  | 'asset_audit'
  | 'album_audit'
  | 'album_user_audit'
  | 'album_asset_audit'
  | 'memory_audit'
  | 'memory_asset_audit'
  | 'stack_audit'
  | 'person_audit'
  | 'user_metadata_audit'
  | 'asset_face_audit';
type UpsertTables =
  | 'user'
  | 'partner'
  | 'asset'
  | 'asset_exif'
  | 'album'
  | 'album_user'
  | 'memory'
  | 'memory_asset'
  | 'stack'
  | 'person'
  | 'user_metadata'
  | 'asset_face';

export type SyncQueryOptions = {
  nowId: string;
  userId: string;
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
  authUser: AuthUserSync;
  memory: MemorySync;
  memoryToAsset: MemoryToAssetSync;
  partner: PartnerSync;
  partnerAsset: PartnerAssetsSync;
  partnerAssetExif: PartnerAssetExifsSync;
  partnerStack: PartnerStackSync;
  people: PersonSync;
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
    this.authUser = new AuthUserSync(this.db);
    this.memory = new MemorySync(this.db);
    this.memoryToAsset = new MemoryToAssetSync(this.db);
    this.partner = new PartnerSync(this.db);
    this.partnerAsset = new PartnerAssetsSync(this.db);
    this.partnerAssetExif = new PartnerAssetExifsSync(this.db);
    this.partnerStack = new PartnerStackSync(this.db);
    this.people = new PersonSync(this.db);
    this.stack = new StackSync(this.db);
    this.user = new UserSync(this.db);
    this.userMetadata = new UserMetadataSync(this.db);
  }
}

class BaseSync {
  constructor(protected db: Kysely<DB>) {}

  protected auditTableFilters(nowId: string, ack?: SyncAck) {
    return <T extends keyof Pick<DB, AuditTables>, D>(qb: SelectQueryBuilder<DB, T, D>) => {
      const builder = qb as SelectQueryBuilder<DB, AuditTables, D>;
      return builder
        .where('id', '<', nowId)
        .$if(!!ack, (qb) => qb.where('id', '>', ack!.updateId))
        .orderBy('id', 'asc') as SelectQueryBuilder<DB, T, D>;
    };
  }

  protected upsertTableFilters(nowId: string, ack?: SyncAck) {
    return <T extends keyof Pick<DB, UpsertTables>, D>(qb: SelectQueryBuilder<DB, T, D>) => {
      const builder = qb as SelectQueryBuilder<DB, UpsertTables, D>;
      return builder
        .where('updateId', '<', nowId)
        .$if(!!ack, (qb) => qb.where('updateId', '>', ack!.updateId))
        .orderBy('updateId', 'asc') as SelectQueryBuilder<DB, T, D>;
    };
  }
}

class AlbumSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID] })
  getCreatedAfter({ nowId, userId }: SyncQueryOptions, afterCreateId?: string) {
    return this.db
      .selectFrom('album_user')
      .select(['albumsId as id', 'createId'])
      .where('usersId', '=', userId)
      .$if(!!afterCreateId, (qb) => qb.where('createId', '>=', afterCreateId!))
      .where('createId', '<', nowId)
      .orderBy('createId', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_audit')
      .select(['id', 'albumId'])
      .where('userId', '=', userId)
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album')
      .distinctOn(['album.id', 'album.updateId'])
      .where('album.updateId', '<', nowId)
      .$if(!!ack, (qb) => qb.where('album.updateId', '>', ack!.updateId))
      .orderBy('album.updateId', 'asc')
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
  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill({ nowId }: SyncQueryOptions, albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('album_asset')
      .innerJoin('asset', 'asset.id', 'album_asset.assetsId')
      .select(columns.syncAsset)
      .select('album_asset.updateId')
      .where('album_asset.albumsId', '=', albumId)
      .where('album_asset.updateId', '<', nowId)
      .where('album_asset.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('album_asset.updateId', '>=', afterUpdateId!))
      .orderBy('album_asset.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpdates({ nowId, userId }: SyncQueryOptions, albumToAssetAck: SyncAck, ack?: SyncAck) {
    return this.db
      .selectFrom('asset')
      .innerJoin('album_asset', 'album_asset.assetsId', 'asset.id')
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('asset.updateId', '<', nowId)
      .where('album_asset.updateId', '<=', albumToAssetAck.updateId) // Ensure we only send updates for assets that the client already knows about
      .$if(!!ack, (qb) => qb.where('asset.updateId', '>', ack!.updateId))
      .orderBy('asset.updateId', 'asc')
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getCreates({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_asset')
      .select('album_asset.updateId')
      .innerJoin('asset', 'asset.id', 'album_asset.assetsId')
      .select(columns.syncAsset)
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where('album_asset.updateId', '<', nowId)
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .$if(!!ack, (qb) => qb.where('album_asset.updateId', '>', ack!.updateId))
      .orderBy('album_asset.updateId', 'asc')
      .stream();
  }
}

class AlbumAssetExifSync extends BaseSync {
  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill({ nowId }: SyncQueryOptions, albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('album_asset')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'album_asset.assetsId')
      .select(columns.syncAssetExif)
      .select('album_asset.updateId')
      .where('album_asset.albumsId', '=', albumId)
      .where('album_asset.updateId', '<', nowId)
      .where('album_asset.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('album_asset.updateId', '>=', afterUpdateId!))
      .orderBy('album_asset.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpdates({ nowId, userId }: SyncQueryOptions, albumToAssetAck: SyncAck, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_exif')
      .innerJoin('album_asset', 'album_asset.assetsId', 'asset_exif.assetId')
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .where('album_asset.updateId', '<=', albumToAssetAck.updateId) // Ensure we only send exif updates for assets that the client already knows about
      .where('asset_exif.updateId', '<', nowId)
      .$if(!!ack, (qb) => qb.where('asset_exif.updateId', '>', ack!.updateId))
      .orderBy('asset_exif.updateId', 'asc')
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getCreates({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_asset')
      .select('album_asset.updateId')
      .innerJoin('asset_exif', 'asset_exif.assetId', 'album_asset.assetsId')
      .select(columns.syncAssetExif)
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where('album_asset.updateId', '<', nowId)
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .$if(!!ack, (qb) => qb.where('album_asset.updateId', '>', ack!.updateId))
      .orderBy('album_asset.updateId', 'asc')
      .stream();
  }
}

class AlbumToAssetSync extends BaseSync {
  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill({ nowId }: SyncQueryOptions, albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('album_asset as album_assets')
      .select(['album_assets.assetsId as assetId', 'album_assets.albumsId as albumId', 'album_assets.updateId'])
      .where('album_assets.albumsId', '=', albumId)
      .where('album_assets.updateId', '<', nowId)
      .where('album_assets.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('album_assets.updateId', '>=', afterUpdateId!))
      .orderBy('album_assets.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_asset_audit')
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
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_asset')
      .select(['album_asset.assetsId as assetId', 'album_asset.albumsId as albumId', 'album_asset.updateId'])
      .where('album_asset.updateId', '<', nowId)
      .$if(!!ack, (qb) => qb.where('album_asset.updateId', '>', ack!.updateId))
      .orderBy('album_asset.updateId', 'asc')
      .innerJoin('album', 'album.id', 'album_asset.albumsId')
      .leftJoin('album_user', 'album_user.albumsId', 'album_asset.albumsId')
      .where((eb) => eb.or([eb('album.ownerId', '=', userId), eb('album_user.usersId', '=', userId)]))
      .stream();
  }
}

class AlbumUserSync extends BaseSync {
  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill({ nowId }: SyncQueryOptions, albumId: string, afterUpdateId: string | undefined, beforeUpdateId: string) {
    return this.db
      .selectFrom('album_user')
      .select(columns.syncAlbumUser)
      .select('album_user.updateId')
      .where('albumsId', '=', albumId)
      .where('updateId', '<', nowId)
      .where('updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('updateId', '>=', afterUpdateId!))
      .orderBy('updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_user_audit')
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
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('album_user')
      .select(columns.syncAlbumUser)
      .select('album_user.updateId')
      .where('album_user.updateId', '<', nowId)
      .$if(!!ack, (qb) => qb.where('album_user.updateId', '>', ack!.updateId))
      .orderBy('album_user.updateId', 'asc')
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
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_audit')
      .select(['id', 'assetId'])
      .where('ownerId', '=', userId)
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset')
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('ownerId', '=', userId)
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class AuthUserSync extends BaseSync {
  @GenerateSql({ params: [], stream: true })
  getUpserts({ nowId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('user')
      .select(columns.syncUser)
      .select(['isAdmin', 'pinCode', 'oauthId', 'storageLabel', 'quotaSizeInBytes', 'quotaUsageInBytes'])
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class PersonSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('person_audit')
      .select(['id', 'personId'])
      .where('ownerId', '=', userId)
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('person')
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
      .where('ownerId', '=', userId)
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class AssetFaceSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_face_audit')
      .select(['asset_face_audit.id', 'assetFaceId'])
      .orderBy('asset_face_audit.id', 'asc')
      .leftJoin('asset', 'asset.id', 'asset_face_audit.assetId')
      .where('asset.ownerId', '=', userId)
      .where('asset_face_audit.id', '<', nowId)
      .$if(!!ack, (qb) => qb.where('asset_face_audit.id', '>', ack!.updateId))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_face')
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
      .where('asset_face.updateId', '<', nowId)
      .$if(!!ack, (qb) => qb.where('asset_face.updateId', '>', ack!.updateId))
      .orderBy('asset_face.updateId', 'asc')
      .leftJoin('asset', 'asset.id', 'asset_face.assetId')
      .where('asset.ownerId', '=', userId)
      .stream();
  }
}

class AssetExifSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_exif')
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .where('assetId', 'in', (eb) => eb.selectFrom('asset').select('id').where('ownerId', '=', userId))
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class MemorySync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('memory_audit')
      .select(['id', 'memoryId'])
      .where('userId', '=', userId)
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('memory')
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
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class MemoryToAssetSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('memory_asset_audit')
      .select(['id', 'memoryId', 'assetId'])
      .where('memoryId', 'in', (eb) => eb.selectFrom('memory').select('id').where('ownerId', '=', userId))
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('memory_asset')
      .select(['memoriesId as memoryId', 'assetsId as assetId'])
      .select('updateId')
      .where('memoriesId', 'in', (eb) => eb.selectFrom('memory').select('id').where('ownerId', '=', userId))
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class PartnerSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }] })
  getCreatedAfter({ nowId, userId }: SyncQueryOptions, afterCreateId?: string) {
    return this.db
      .selectFrom('partner')
      .select(['sharedById', 'createId'])
      .where('sharedWithId', '=', userId)
      .$if(!!afterCreateId, (qb) => qb.where('createId', '>=', afterCreateId!))
      .where('createId', '<', nowId)
      .orderBy('partner.createId', 'asc')
      .execute();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('partner_audit')
      .select(['id', 'sharedById', 'sharedWithId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('partner')
      .select(['sharedById', 'sharedWithId', 'inTimeline', 'updateId'])
      .where((eb) => eb.or([eb('sharedById', '=', userId), eb('sharedWithId', '=', userId)]))
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class PartnerAssetsSync extends BaseSync {
  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill(
    { nowId }: SyncQueryOptions,
    partnerId: string,
    afterUpdateId: string | undefined,
    beforeUpdateId: string,
  ) {
    return this.db
      .selectFrom('asset')
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('ownerId', '=', partnerId)
      .where('updateId', '<', nowId)
      .where('updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('updateId', '>=', afterUpdateId!))
      .orderBy('updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_audit')
      .select(['id', 'assetId'])
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset')
      .select(columns.syncAsset)
      .select('asset.updateId')
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class PartnerAssetExifsSync extends BaseSync {
  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill(
    { nowId }: SyncQueryOptions,
    partnerId: string,
    afterUpdateId: string | undefined,
    beforeUpdateId: string,
  ) {
    return this.db
      .selectFrom('asset_exif')
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
      .where('asset.ownerId', '=', partnerId)
      .where('asset_exif.updateId', '<', nowId)
      .where('asset_exif.updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('asset_exif.updateId', '>=', afterUpdateId!))
      .orderBy('asset_exif.updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('asset_exif')
      .select(columns.syncAssetExif)
      .select('asset_exif.updateId')
      .where('assetId', 'in', (eb) =>
        eb
          .selectFrom('asset')
          .select('id')
          .where('ownerId', 'in', (eb) =>
            eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', userId),
          ),
      )
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class StackSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('stack_audit')
      .select(['id', 'stackId'])
      .where('userId', '=', userId)
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('stack')
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', '=', userId)
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class PartnerStackSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('stack_audit')
      .select(['id', 'stackId'])
      .where('userId', 'in', (eb) => eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', userId))
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({
    params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }, DummyValue.UUID, DummyValue.UUID, DummyValue.UUID],
    stream: true,
  })
  getBackfill(
    { nowId }: SyncQueryOptions,
    partnerId: string,
    afterUpdateId: string | undefined,
    beforeUpdateId: string,
  ) {
    return this.db
      .selectFrom('stack')
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', '=', partnerId)
      .where('updateId', '<', nowId)
      .where('updateId', '<=', beforeUpdateId)
      .$if(!!afterUpdateId, (eb) => eb.where('updateId', '>=', afterUpdateId!))
      .orderBy('updateId', 'asc')
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('stack')
      .select(columns.syncStack)
      .select('updateId')
      .where('ownerId', 'in', (eb) =>
        eb.selectFrom('partner').select(['sharedById']).where('sharedWithId', '=', userId),
      )
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}

class UserSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db.selectFrom('user_audit').select(['id', 'userId']).$call(this.auditTableFilters(nowId, ack)).stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db.selectFrom('user').select(columns.syncUser).$call(this.upsertTableFilters(nowId, ack)).stream();
  }
}

class UserMetadataSync extends BaseSync {
  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getDeletes({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('user_metadata_audit')
      .select(['id', 'userId', 'key'])
      .where('userId', '=', userId)
      .$call(this.auditTableFilters(nowId, ack))
      .stream();
  }

  @GenerateSql({ params: [{ nowId: DummyValue.UUID, userId: DummyValue.UUID }], stream: true })
  getUpserts({ nowId, userId }: SyncQueryOptions, ack?: SyncAck) {
    return this.db
      .selectFrom('user_metadata')
      .select(['userId', 'key', 'value', 'updateId'])
      .where('userId', '=', userId)
      .$call(this.upsertTableFilters(nowId, ack))
      .stream();
  }
}
