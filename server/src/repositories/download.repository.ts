import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { anyUuid, withoutNsfwAssets } from 'src/utils/database';

type DownloadPrivacyOptions = {
  excludeNsfw?: boolean;
};

const builder = (db: Kysely<DB>, options: DownloadPrivacyOptions = {}) =>
  db
    .selectFrom('asset')
    .innerJoin('asset_exif', 'assetId', 'id')
    .select(['asset.id', 'asset.livePhotoVideoId', 'asset_exif.fileSizeInByte as size'])
    .where('asset.deletedAt', 'is', null)
    .$if(!!options.excludeNsfw, withoutNsfwAssets);

@Injectable()
export class DownloadRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  downloadAssetIds(ids: string[], options?: DownloadPrivacyOptions) {
    return builder(this.db, options).where('asset.id', '=', anyUuid(ids)).stream();
  }

  downloadMotionAssetIds(ids: string[], options?: DownloadPrivacyOptions) {
    return builder(this.db, options).select(['asset.originalPath']).where('asset.id', '=', anyUuid(ids)).stream();
  }

  downloadAlbumId(albumId: string, options?: DownloadPrivacyOptions) {
    return builder(this.db, options)
      .innerJoin('album_asset', 'asset.id', 'album_asset.assetId')
      .where('album_asset.albumId', '=', albumId)
      .stream();
  }

  downloadUserId(userId: string, options?: DownloadPrivacyOptions) {
    return builder(this.db, options)
      .where('asset.ownerId', '=', userId)
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .stream();
  }
}
