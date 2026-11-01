import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetVisibility } from 'src/enum.js';
import { DB } from 'src/schema/index.js';
import { anyUuid, asUuid, isAssetVisible, type PrivateTagAccessOptions } from 'src/utils/database.js';

const builder = (db: Kysely<DB>, privateOwnerId?: string, options: PrivateTagAccessOptions = {}) =>
  db
    .selectFrom('asset')
    .innerJoin('asset_exif', 'assetId', 'id')
    .select(['asset.id', 'asset.livePhotoVideoId', 'asset_exif.fileSizeInByte as size'])
    .where('asset.deletedAt', 'is', null)
    .where((eb) =>
      isAssetVisible(eb.ref('asset.id'), { ...options, includePrivate: !!privateOwnerId, privateOwnerId }),
    );

@Injectable()
export class DownloadRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  downloadAssetIds(ids: string[], privateOwnerId?: string, options: PrivateTagAccessOptions = {}) {
    return builder(this.db, privateOwnerId, options).where('asset.id', '=', anyUuid(ids)).stream();
  }

  downloadMotionAssetIds(ids: string[], privateOwnerId?: string, options: PrivateTagAccessOptions = {}) {
    return builder(this.db, privateOwnerId, options)
      .select(['asset.originalPath'])
      .where('asset.id', '=', anyUuid(ids))
      .stream();
  }

  downloadAlbumId(albumId: string, privateOwnerId?: string, options: PrivateTagAccessOptions = {}) {
    return builder(this.db, privateOwnerId, { ...options, albumId: asUuid(albumId) })
      .innerJoin('album_asset', 'asset.id', 'album_asset.assetId')
      .where('album_asset.albumId', '=', albumId)
      .stream();
  }

  downloadUserId(userId: string, privateOwnerId?: string, options: PrivateTagAccessOptions = {}) {
    return builder(this.db, privateOwnerId, options)
      .where('asset.ownerId', '=', userId)
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .stream();
  }
}
