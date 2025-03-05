import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { anyUuid } from 'src/utils/database';

const builder = (db: Kysely<DB>) =>
  db
    .selectFrom('assets')
    .innerJoin('exif', 'assetId', 'id')
    .select(['assets.id', 'assets.livePhotoVideoId', 'exif.fileSizeInByte as size'])
    .where('assets.deletedAt', 'is', null);

@Injectable()
export class DownloadRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  downloadAssetIds(ids: string[]) {
    return builder(this.db).where('assets.id', '=', anyUuid(ids)).stream();
  }

  downloadMotionAssetIds(ids: string[]) {
    return builder(this.db).select(['assets.originalPath']).where('assets.id', '=', anyUuid(ids)).stream();
  }

  downloadAlbumId(albumId: string) {
    return builder(this.db)
      .innerJoin('albums_assets_assets', 'assets.id', 'albums_assets_assets.assetsId')
      .where('albums_assets_assets.albumsId', '=', albumId)
      .stream();
  }

  downloadUserId(userId: string) {
    return builder(this.db).where('assets.ownerId', '=', userId).where('assets.isVisible', '=', true).stream();
  }
}
