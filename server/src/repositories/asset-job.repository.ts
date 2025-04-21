import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { columns } from 'src/database';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType } from 'src/enum';
import { StorageAsset } from 'src/types';
import { anyUuid, asUuid, withExifInner, withFaces, withFiles } from 'src/utils/database';

@Injectable()
export class AssetJobRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getForSearchDuplicatesJob(id: string) {
    return this.db
      .selectFrom('assets')
      .where('assets.id', '=', asUuid(id))
      .leftJoin('smart_search', 'assets.id', 'smart_search.assetId')
      .select((eb) => [
        'id',
        'type',
        'ownerId',
        'duplicateId',
        'stackId',
        'isVisible',
        'smart_search.embedding',
        withFiles(eb, AssetFileType.PREVIEW),
      ])
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForSidecarWriteJob(id: string) {
    return this.db
      .selectFrom('assets')
      .where('assets.id', '=', asUuid(id))
      .select((eb) => [
        'id',
        'sidecarPath',
        'originalPath',
        jsonArrayFrom(
          eb
            .selectFrom('tags')
            .select(['tags.value'])
            .innerJoin('tag_asset', 'tags.id', 'tag_asset.tagsId')
            .whereRef('assets.id', '=', 'tag_asset.assetsId'),
        ).as('tags'),
      ])
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [false], stream: true })
  streamForThumbnailJob(force: boolean) {
    return this.db
      .selectFrom('assets')
      .select(['assets.id', 'assets.thumbhash'])
      .select(withFiles)
      .where('assets.deletedAt', 'is', null)
      .where('assets.isVisible', '=', true)
      .$if(!force, (qb) =>
        qb
          // If there aren't any entries, metadata extraction hasn't run yet which is required for thumbnails
          .innerJoin('asset_job_status', 'asset_job_status.assetId', 'assets.id')
          .where((eb) =>
            eb.or([
              eb('asset_job_status.previewAt', 'is', null),
              eb('asset_job_status.thumbnailAt', 'is', null),
              eb('assets.thumbhash', 'is', null),
            ]),
          ),
      )
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForMigrationJob(id: string) {
    return this.db
      .selectFrom('assets')
      .select(['assets.id', 'assets.ownerId', 'assets.encodedVideoPath'])
      .select(withFiles)
      .where('assets.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForGenerateThumbnailJob(id: string) {
    return this.db
      .selectFrom('assets')
      .select([
        'assets.id',
        'assets.isVisible',
        'assets.originalFileName',
        'assets.originalPath',
        'assets.ownerId',
        'assets.thumbhash',
        'assets.type',
      ])
      .select(withFiles)
      .$call(withExifInner)
      .where('assets.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForMetadataExtraction(id: string) {
    return this.db
      .selectFrom('assets')
      .select(columns.asset)
      .select(withFaces)
      .where('assets.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID, AssetFileType.THUMBNAIL] })
  getAlbumThumbnailFiles(id: string, fileType?: AssetFileType) {
    return this.db
      .selectFrom('asset_files')
      .select(columns.assetFiles)
      .where('asset_files.assetId', '=', id)
      .$if(!!fileType, (qb) => qb.where('asset_files.type', '=', fileType!))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForClipEncoding(id: string) {
    return this.db
      .selectFrom('assets')
      .select(['assets.id', 'assets.isVisible'])
      .select((eb) => withFiles(eb, AssetFileType.PREVIEW))
      .where('assets.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForDetectFacesJob(id: string) {
    return this.db
      .selectFrom('assets')
      .select(['assets.id', 'assets.isVisible'])
      .$call(withExifInner)
      .select((eb) => withFaces(eb, true))
      .select((eb) => withFiles(eb, AssetFileType.PREVIEW))
      .where('assets.id', '=', id)
      .executeTakeFirst();
  }

  getForSyncAssets(ids: string[]) {
    return this.db
      .selectFrom('assets')
      .select([
        'assets.id',
        'assets.isOffline',
        'assets.libraryId',
        'assets.originalPath',
        'assets.status',
        'assets.fileModifiedAt',
      ])
      .where('assets.id', '=', anyUuid(ids))
      .execute();
  }

  private storageTemplateAssetQuery() {
    return this.db
      .selectFrom('assets')
      .innerJoin('exif', 'assets.id', 'exif.assetId')
      .select([
        'assets.id',
        'assets.ownerId',
        'assets.type',
        'assets.checksum',
        'assets.originalPath',
        'assets.isExternal',
        'assets.sidecarPath',
        'assets.originalFileName',
        'assets.livePhotoVideoId',
        'assets.fileCreatedAt',
        'exif.timeZone',
        'exif.fileSizeInByte',
      ])
      .where('assets.deletedAt', 'is', null);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForStorageTemplateJob(id: string): Promise<StorageAsset | undefined> {
    return this.storageTemplateAssetQuery().where('assets.id', '=', id).executeTakeFirst() as Promise<
      StorageAsset | undefined
    >;
  }

  @GenerateSql({ params: [], stream: true })
  streamForStorageTemplateJob() {
    return this.storageTemplateAssetQuery().stream() as AsyncIterableIterator<StorageAsset>;
  }

  @GenerateSql({ params: [DummyValue.DATE], stream: true })
  streamForDeletedJob(trashedBefore: Date) {
    return this.db
      .selectFrom('assets')
      .select(['id', 'isOffline'])
      .where('assets.deletedAt', '<=', trashedBefore)
      .stream();
  }
}
