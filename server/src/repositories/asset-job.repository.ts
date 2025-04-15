import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { withFiles } from 'src/entities/asset.entity';
import { AssetFileType } from 'src/enum';
import { StorageAsset } from 'src/types';
import { asUuid } from 'src/utils/database';

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

  getForStorageTemplateJob(id: string): Promise<StorageAsset | undefined> {
    return this.storageTemplateAssetQuery().where('assets.id', '=', id).executeTakeFirst() as Promise<
      StorageAsset | undefined
    >;
  }

  streamForStorageTemplateJob() {
    return this.storageTemplateAssetQuery().stream() as AsyncIterableIterator<StorageAsset>;
  }

  streamForDeletedJob(trashedBefore: Date) {
    return this.db
      .selectFrom('assets')
      .select(['id', 'isOffline'])
      .where('assets.deletedAt', '<=', trashedBefore)
      .stream();
  }
}
