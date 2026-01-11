import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { jsonArrayFrom } from 'kysely/helpers/postgres';
import { InjectKysely } from 'nestjs-kysely';
import { Asset, columns } from 'src/database';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFileType, AssetType, AssetVisibility } from 'src/enum';
import { DB } from 'src/schema';
import {
  anyUuid,
  asUuid,
  toJson,
  withDefaultVisibility,
  withEdits,
  withExif,
  withExifInner,
  withFaces,
  withFacesAndPeople,
  withFilePath,
  withFiles,
} from 'src/utils/database';

@Injectable()
export class AssetJobRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getForSearchDuplicatesJob(id: string) {
    return this.db
      .selectFrom('asset')
      .where('asset.id', '=', asUuid(id))
      .leftJoin('smart_search', 'asset.id', 'smart_search.assetId')
      .select(['id', 'type', 'ownerId', 'duplicateId', 'stackId', 'visibility', 'smart_search.embedding'])
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForSidecarWriteJob(id: string) {
    return this.db
      .selectFrom('asset')
      .where('asset.id', '=', asUuid(id))
      .select(['id', 'originalPath'])
      .select((eb) => withFiles(eb, AssetFileType.Sidecar))
      .select((eb) =>
        jsonArrayFrom(
          eb
            .selectFrom('tag')
            .select(['tag.value'])
            .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
            .whereRef('asset.id', '=', 'tag_asset.assetId'),
        ).as('tags'),
      )
      .$call(withExifInner)
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForSidecarCheckJob(id: string) {
    return this.db
      .selectFrom('asset')
      .where('asset.id', '=', asUuid(id))
      .select(['id', 'originalPath'])
      .select((eb) => withFiles(eb, AssetFileType.Sidecar))
      .limit(1)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [false], stream: true })
  streamForThumbnailJob(force: boolean) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.thumbhash'])
      .select(withFiles)
      .select(withEdits)
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .$if(!force, (qb) =>
        qb
          // If there aren't any entries, metadata extraction hasn't run yet which is required for thumbnails
          .innerJoin('asset_job_status', 'asset_job_status.assetId', 'asset.id')
          .where((eb) =>
            eb.or([
              eb('asset_job_status.previewAt', 'is', null),
              eb('asset_job_status.thumbnailAt', 'is', null),
              eb('asset.thumbhash', 'is', null),
            ]),
          ),
      )
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForMigrationJob(id: string) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.ownerId', 'asset.encodedVideoPath'])
      .select(withFiles)
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForGenerateThumbnailJob(id: string) {
    return this.db
      .selectFrom('asset')
      .select([
        'asset.id',
        'asset.visibility',
        'asset.originalFileName',
        'asset.originalPath',
        'asset.ownerId',
        'asset.thumbhash',
        'asset.type',
      ])
      .select(withFiles)
      .select(withEdits)
      .$call(withExifInner)
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForMetadataExtraction(id: string) {
    return this.db
      .selectFrom('asset')
      .select(columns.asset)
      .select(withFaces)
      .select((eb) => withFiles(eb, AssetFileType.Sidecar))
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getLockedPropertiesForMetadataExtraction(assetId: string) {
    return this.db
      .selectFrom('asset_exif')
      .select('asset_exif.lockedProperties')
      .where('asset_exif.assetId', '=', assetId)
      .executeTakeFirst()
      .then((row) => row?.lockedProperties ?? []);
  }

  @GenerateSql({ params: [DummyValue.UUID, AssetFileType.Thumbnail] })
  getAlbumThumbnailFiles(id: string, fileType?: AssetFileType) {
    return this.db
      .selectFrom('asset_file')
      .select(columns.assetFiles)
      .where('asset_file.assetId', '=', id)
      .$if(!!fileType, (qb) => qb.where('asset_file.type', '=', fileType!))
      .execute();
  }

  private assetsWithPreviews() {
    return this.db
      .selectFrom('asset')
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .where('asset.deletedAt', 'is', null)
      .innerJoin('asset_job_status as job_status', 'assetId', 'asset.id')
      .where('job_status.previewAt', 'is not', null);
  }

  @GenerateSql({ params: [], stream: true })
  streamForSearchDuplicates(force?: boolean) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id'])
      .where('asset.deletedAt', 'is', null)
      .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
      .$call(withDefaultVisibility)
      .$if(!force, (qb) =>
        qb
          .innerJoin('asset_job_status as job_status', 'job_status.assetId', 'asset.id')
          .where('job_status.duplicatesDetectedAt', 'is', null),
      )
      .stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamForEncodeClip(force?: boolean) {
    return this.assetsWithPreviews()
      .select(['asset.id'])
      .$if(!force, (qb) =>
        qb.where((eb) => eb.not((eb) => eb.exists(eb.selectFrom('smart_search').whereRef('assetId', '=', 'asset.id')))),
      )
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForClipEncoding(id: string) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.visibility'])
      .select((eb) => withFiles(eb, AssetFileType.Preview))
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForDetectFacesJob(id: string) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.visibility'])
      .$call(withExifInner)
      .select((eb) => withFaces(eb, true, true))
      .select((eb) => withFiles(eb, AssetFileType.Preview))
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForOcr(id: string) {
    return this.db
      .selectFrom('asset')
      .select((eb) => ['asset.visibility', withFilePath(eb, AssetFileType.Preview).as('previewFile')])
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  getForSyncAssets(ids: string[]) {
    return this.db
      .selectFrom('asset')
      .select([
        'asset.id',
        'asset.isOffline',
        'asset.libraryId',
        'asset.originalPath',
        'asset.status',
        'asset.fileModifiedAt',
      ])
      .where('asset.id', '=', anyUuid(ids))
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForAssetDeletion(id: string) {
    return this.db
      .selectFrom('asset')
      .select([
        'asset.id',
        'asset.visibility',
        'asset.libraryId',
        'asset.ownerId',
        'asset.livePhotoVideoId',
        'asset.encodedVideoPath',
        'asset.originalPath',
        'asset.isOffline',
      ])
      .$call(withExif)
      .select(withFacesAndPeople)
      .select(withFiles)
      .leftJoin('stack', 'stack.id', 'asset.stackId')
      .leftJoinLateral(
        (eb) =>
          eb
            .selectFrom('asset as stacked')
            .select(['stack.id', 'stack.primaryAssetId'])
            .select((eb) => eb.fn<Asset[]>('array_agg', [eb.table('stacked')]).as('assets'))
            .where('stacked.deletedAt', 'is not', null)
            .where('stacked.visibility', '=', AssetVisibility.Timeline)
            .whereRef('stacked.stackId', '=', 'stack.id')
            .groupBy('stack.id')
            .as('stacked_assets'),
        (join) => join.on('stack.id', 'is not', null),
      )
      .select((eb) => toJson(eb, 'stacked_assets').as('stack'))
      .where('asset.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [], stream: true })
  streamForVideoConversion(force?: boolean) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id'])
      .where('asset.type', '=', AssetType.Video)
      .$if(!force, (qb) =>
        qb
          .where((eb) => eb.or([eb('asset.encodedVideoPath', 'is', null), eb('asset.encodedVideoPath', '=', '')]))
          .where('asset.visibility', '!=', AssetVisibility.Hidden),
      )
      .where('asset.deletedAt', 'is', null)
      .stream();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForVideoConversion(id: string) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id', 'asset.ownerId', 'asset.originalPath', 'asset.encodedVideoPath'])
      .where('asset.id', '=', id)
      .where('asset.type', '=', AssetType.Video)
      .executeTakeFirst();
  }

  @GenerateSql({ params: [], stream: true })
  streamForMetadataExtraction(force?: boolean) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id'])
      .$if(!force, (qb) =>
        qb
          .leftJoin('asset_job_status', 'asset_job_status.assetId', 'asset.id')
          .where((eb) =>
            eb.or([eb('asset_job_status.metadataExtractedAt', 'is', null), eb('asset_job_status.assetId', 'is', null)]),
          ),
      )
      .where('asset.deletedAt', 'is', null)
      .stream();
  }

  private storageTemplateAssetQuery() {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .select([
        'asset.id',
        'asset.ownerId',
        'asset.type',
        'asset.checksum',
        'asset.originalPath',
        'asset.isExternal',
        'asset.originalFileName',
        'asset.livePhotoVideoId',
        'asset.fileCreatedAt',
        'asset_exif.timeZone',
        'asset_exif.fileSizeInByte',
        'asset_exif.make',
        'asset_exif.model',
        'asset_exif.lensModel',
      ])
      .select((eb) => withFiles(eb, AssetFileType.Sidecar))
      .where('asset.deletedAt', 'is', null);
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getForStorageTemplateJob(id: string) {
    return this.storageTemplateAssetQuery().where('asset.id', '=', id).executeTakeFirst();
  }

  @GenerateSql({ params: [], stream: true })
  streamForStorageTemplateJob() {
    return this.storageTemplateAssetQuery().stream();
  }

  @GenerateSql({ params: [DummyValue.DATE], stream: true })
  streamForDeletedJob(trashedBefore: Date) {
    return this.db
      .selectFrom('asset')
      .select(['id', 'isOffline'])
      .where('asset.deletedAt', '<=', trashedBefore)
      .stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamForSidecar(force?: boolean) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id'])
      .$if(!force, (qb) =>
        qb.where((eb) =>
          eb.not(
            eb.exists(
              eb
                .selectFrom('asset_file')
                .select('asset_file.id')
                .whereRef('asset_file.assetId', '=', 'asset.id')
                .where('asset_file.type', '=', AssetFileType.Sidecar),
            ),
          ),
        ),
      )
      .stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamForDetectFacesJob(force?: boolean) {
    return this.assetsWithPreviews()
      .$if(force === false, (qb) => qb.where('job_status.facesRecognizedAt', 'is', null))
      .select(['asset.id'])
      .orderBy('asset.fileCreatedAt', 'desc')
      .stream();
  }

  @GenerateSql({ params: [], stream: true })
  streamForOcrJob(force?: boolean) {
    return this.db
      .selectFrom('asset')
      .select(['asset.id'])
      .$if(!force, (qb) =>
        qb
          .innerJoin('asset_job_status', 'asset_job_status.assetId', 'asset.id')
          .where('asset_job_status.ocrAt', 'is', null),
      )
      .where('asset.deletedAt', 'is', null)
      .where('asset.visibility', '!=', AssetVisibility.Hidden)
      .stream();
  }

  @GenerateSql({ params: [DummyValue.DATE], stream: true })
  streamForMigrationJob() {
    return this.db.selectFrom('asset').select(['id']).where('asset.deletedAt', 'is', null).stream();
  }
}
