import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import { anyUuid } from 'src/utils/database';

const builder = (db: Kysely<DB>) =>
  db
    .selectFrom('asset')
    .innerJoin('asset_exif', 'assetId', 'id')
    .select(['asset.id', 'asset.livePhotoVideoId', 'asset_exif.fileSizeInByte as size'])
    .where('asset.deletedAt', 'is', null);

@Injectable()
export class DownloadRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  downloadAssetIds(ids: string[]) {
    return builder(this.db).where('asset.id', '=', anyUuid(ids)).stream();
  }

  downloadMotionAssetIds(ids: string[]) {
    return builder(this.db).select(['asset.originalPath']).where('asset.id', '=', anyUuid(ids)).stream();
  }

  downloadAlbumId(albumId: string) {
    return builder(this.db)
      .innerJoin('album_asset', 'asset.id', 'album_asset.assetsId')
      .where('album_asset.albumsId', '=', albumId)
      .stream();
  }

  downloadUserId(userId: string) {
    return builder(this.db)
      .where('asset.ownerId', '=', userId)
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .stream();
  }
}
