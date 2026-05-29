import { Injectable } from '@nestjs/common';
import { Kysely, OrderByDirection, Selectable, ShallowDehydrateObject, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { SearchFilter, SearchOrder } from 'src/dtos/search.dto';
import { AssetOrder, AssetStatus, AssetType, AssetVisibility, SearchOrderField, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { DB } from 'src/schema';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { anyUuid, searchAssetBuilder, searchAssetBuilderLegacy, withExifInner } from 'src/utils/database';
import { paginationHelper } from 'src/utils/pagination';
import z from 'zod';

export interface SearchAssetIdOptions {
  checksum?: Buffer;
  id?: string;
}

export interface SearchUserIdOptions {
  libraryId?: string | null;
  userIds?: string[];
}

export type SearchIdOptions = SearchAssetIdOptions & SearchUserIdOptions;

export interface SearchStatusOptions {
  isEncoded?: boolean;
  isFavorite?: boolean;
  isMotion?: boolean;
  isOffline?: boolean;
  isNotInAlbum?: boolean;
  type?: AssetType;
  status?: AssetStatus;
  withArchived?: boolean;
  withDeleted?: boolean;
  visibility?: AssetVisibility;
}

export interface SearchOneToOneRelationOptions {
  withExif?: boolean;
  withStacked?: boolean;
}

export interface SearchRelationOptions extends SearchOneToOneRelationOptions {
  withFaces?: boolean;
  withPeople?: boolean;
}

export interface SearchDateOptions {
  createdBefore?: Date;
  createdAfter?: Date;
  takenBefore?: Date;
  takenAfter?: Date;
  trashedBefore?: Date;
  trashedAfter?: Date;
  updatedBefore?: Date;
  updatedAfter?: Date;
}

export interface SearchPathOptions {
  encodedVideoPath?: string;
  originalFileName?: string;
  originalPath?: string;
  previewPath?: string;
  thumbnailPath?: string;
}

export interface SearchExifOptions {
  city?: string | null;
  country?: string | null;
  lensModel?: string | null;
  make?: string | null;
  model?: string | null;
  state?: string | null;
  description?: string | null;
  rating?: number | null;
}

export interface SearchEmbeddingOptions {
  embedding: string;
  userIds: string[];
}

export interface SearchOcrOptions {
  ocr?: string;
}

export interface SearchPeopleOptions {
  personIds?: string[];
}

export interface SearchTagOptions {
  tagIds?: string[] | null;
}

export interface SearchAlbumOptions {
  albumIds?: string[];
}

export interface SearchOrderOptions {
  orderDirection?: 'asc' | 'desc';
}

export interface SearchPaginationOptions {
  page: number;
  size: number;
}

type BaseAssetSearchOptions = SearchDateOptions &
  SearchIdOptions &
  SearchExifOptions &
  SearchOrderOptions &
  SearchPathOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchAlbumOptions &
  SearchOcrOptions;

export type AssetSearchOptions = Omit<BaseAssetSearchOptions, 'visibility'> &
  SearchRelationOptions & { visibility?: AssetVisibility | 'not-locked' };

export type AssetSearchBuilderOptions = Omit<AssetSearchOptions, 'orderDirection'>;

export interface AssetSearchBuilderV3Options {
  filter?: SearchFilter;
  /** Server-derived ownership scope. Never client-controlled. */
  userIds?: string[];
  withExif?: boolean;
  withFaces?: boolean;
  withPeople?: boolean;
  withStacked?: boolean;
  order?: SearchOrder;
}

export interface AssetSearchPaginationV3Options {
  cursor?: string;
  size: number;
}

export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  Omit<SearchStatusOptions, 'visibility'> &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchOcrOptions & { visibility?: AssetVisibility | 'not-locked' };

export type OcrSearchOptions = SearchDateOptions & SearchOcrOptions;

export type LargeAssetSearchOptions = AssetSearchOptions & { minFileSize?: number };

export interface FaceEmbeddingSearch extends SearchEmbeddingOptions {
  hasPerson?: boolean;
  numResults: number;
  maxDistance: number;
  minBirthDate?: Date | null;
}

export interface FaceSearchResult {
  distance: number;
  id: string;
  personId: string | null;
}

export interface AssetDuplicateResult {
  assetId: string;
  duplicateId: string | null;
  distance: number;
}

export interface GetStatesOptions {
  country?: string;
}

export interface GetCitiesOptions extends GetStatesOptions {
  state?: string;
}

export interface GetCameraModelsOptions {
  make?: string;
  lensModel?: string;
}

export interface GetCameraMakesOptions {
  model?: string;
  lensModel?: string;
}

export interface GetCameraLensModelsOptions {
  make?: string;
  model?: string;
}

@Injectable()
export class SearchRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({
    params: [
      { page: 1, size: 100 },
      {
        takenAfter: DummyValue.DATE,
        lensModel: DummyValue.STRING,
        withStacked: true,
        isFavorite: true,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  async searchMetadata(pagination: SearchPaginationOptions, options: AssetSearchOptions) {
    const orderDirection = (options.orderDirection?.toLowerCase() || 'desc') as OrderByDirection;
    const items = await searchAssetBuilderLegacy(this.db, options)
      .selectAll('asset')
      .orderBy('asset.fileCreatedAt', orderDirection)
      .limit(pagination.size + 1)
      .offset((pagination.page - 1) * pagination.size)
      .execute();

    return paginationHelper(items, pagination.size);
  }

  @GenerateSql({
    params: [
      {
        takenAfter: DummyValue.DATE,
        lensModel: DummyValue.STRING,
        isFavorite: true,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  searchStatistics(options: AssetSearchOptions) {
    return searchAssetBuilderLegacy(this.db, options)
      .select((qb) => qb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({
    params: [
      100,
      {
        takenAfter: DummyValue.DATE,
        lensModel: DummyValue.STRING,
        withStacked: true,
        isFavorite: true,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  async searchRandom(size: number, options: AssetSearchOptions) {
    return searchAssetBuilderLegacy(this.db, options)
      .selectAll('asset')
      .orderBy(sql`random()`)
      .limit(size)
      .execute();
  }

  @GenerateSql({
    params: [
      100,
      {
        takenAfter: DummyValue.DATE,
        lensModel: DummyValue.STRING,
        withStacked: true,
        isFavorite: true,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  searchLargeAssets(size: number, options: LargeAssetSearchOptions) {
    const orderDirection = (options.orderDirection?.toLowerCase() || 'desc') as OrderByDirection;
    return searchAssetBuilderLegacy(this.db, options)
      .selectAll('asset')
      .$call(withExifInner)
      .where('asset_exif.fileSizeInByte', '>', options.minFileSize || 0)
      .orderBy('asset_exif.fileSizeInByte', orderDirection)
      .limit(size)
      .execute();
  }

  @GenerateSql({
    params: [
      { page: 1, size: 200 },
      {
        takenAfter: DummyValue.DATE,
        embedding: DummyValue.VECTOR,
        lensModel: DummyValue.STRING,
        withStacked: true,
        isFavorite: true,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  searchSmart(pagination: SearchPaginationOptions, options: SmartSearchOptions) {
    if (!z.int().min(1).max(1000).safeParse(pagination.size).success) {
      throw new Error(`Invalid value for 'size': ${pagination.size}`);
    }

    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Clip])}`.execute(trx);
      const items = await searchAssetBuilderLegacy(trx, options)
        .selectAll('asset')
        .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
        .orderBy(sql`smart_search.embedding <=> ${options.embedding}`)
        .limit(pagination.size + 1)
        .offset((pagination.page - 1) * pagination.size)
        .execute();
      return paginationHelper(items, pagination.size);
    });
  }

  @GenerateSql({
    params: [DummyValue.UUID],
  })
  async getEmbedding(assetId: string) {
    return this.db.selectFrom('smart_search').selectAll().where('assetId', '=', assetId).executeTakeFirst();
  }

  @GenerateSql({
    params: [
      {
        userIds: [DummyValue.UUID],
        embedding: DummyValue.VECTOR,
        numResults: 10,
        maxDistance: 0.6,
      },
    ],
  })
  searchFaces({ userIds, embedding, numResults, maxDistance, hasPerson, minBirthDate }: FaceEmbeddingSearch) {
    if (!z.int().min(1).max(1000).safeParse(numResults).success) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Face])}`.execute(trx);
      return await trx
        .with('cte', (qb) =>
          qb
            .selectFrom('asset_face')
            .select([
              'asset_face.id',
              'asset_face.personId',
              sql<number>`face_search.embedding <=> ${embedding}`.as('distance'),
            ])
            .innerJoin('asset', 'asset.id', 'asset_face.assetId')
            .innerJoin('face_search', 'face_search.faceId', 'asset_face.id')
            .leftJoin('person', 'person.id', 'asset_face.personId')
            .where('asset.ownerId', '=', anyUuid(userIds))
            .where('asset.deletedAt', 'is', null)
            .$if(!!hasPerson, (qb) => qb.where('asset_face.personId', 'is not', null))
            .$if(!!minBirthDate, (qb) =>
              qb.where((eb) =>
                eb.or([eb('person.birthDate', 'is', null), eb('person.birthDate', '<=', minBirthDate!)]),
              ),
            )
            .orderBy('distance')
            .limit(numResults),
        )
        .selectFrom('cte')
        .selectAll()
        .where('cte.distance', '<=', maxDistance)
        .execute();
    });
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  searchPlaces(placeName: string) {
    return this.db
      .selectFrom('geodata_places')
      .selectAll()
      .where(
        () =>
          // kysely doesn't support trigram %>> or <->>> operators
          sql`
            f_unaccent(name) %>> f_unaccent(${placeName}) or
            f_unaccent("admin2Name") %>> f_unaccent(${placeName}) or
            f_unaccent("admin1Name") %>> f_unaccent(${placeName}) or
            f_unaccent("alternateNames") %>> f_unaccent(${placeName})
          `,
      )
      .orderBy(
        sql`
          coalesce(f_unaccent(name) <->>> f_unaccent(${placeName}), 0.1) +
          coalesce(f_unaccent("admin2Name") <->>> f_unaccent(${placeName}), 0.1) +
          coalesce(f_unaccent("admin1Name") <->>> f_unaccent(${placeName}), 0.1) +
          coalesce(f_unaccent("alternateNames") <->>> f_unaccent(${placeName}), 0.1)
        `,
      )
      .limit(20)
      .execute();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  getAssetsByCity(userIds: string[]) {
    return this.db
      .withRecursive('cte', (qb) => {
        const base = qb
          .selectFrom('asset_exif')
          .select(['city', 'assetId'])
          .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
          .where('asset.ownerId', '=', anyUuid(userIds))
          .where('asset.visibility', '=', AssetVisibility.Timeline)
          .where('asset.type', '=', AssetType.Image)
          .where('asset.deletedAt', 'is', null)
          .orderBy('city')
          .limit(1);

        const recursive = qb
          .selectFrom('cte')
          .select(['l.city', 'l.assetId'])
          .innerJoinLateral(
            (qb) =>
              qb
                .selectFrom('asset_exif')
                .select(['city', 'assetId'])
                .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
                .where('asset.ownerId', '=', anyUuid(userIds))
                .where('asset.visibility', '=', AssetVisibility.Timeline)
                .where('asset.type', '=', AssetType.Image)
                .where('asset.deletedAt', 'is', null)
                .whereRef('asset_exif.city', '>', 'cte.city')
                .orderBy('city')
                .limit(1)
                .as('l'),
            (join) => join.onTrue(),
          );

        return sql<{ city: string; assetId: string }>`(${base} union all ${recursive})`;
      })
      .selectFrom('asset')
      .innerJoin('asset_exif', 'asset.id', 'asset_exif.assetId')
      .innerJoin('cte', 'asset.id', 'cte.assetId')
      .selectAll('asset')
      .select((eb) =>
        eb
          .fn('to_jsonb', [eb.table('asset_exif')])
          .$castTo<ShallowDehydrateObject<Selectable<AssetExifTable>>>()
          .as('exifInfo'),
      )
      .orderBy('asset_exif.city')
      .execute();
  }

  async upsert(assetId: string, embedding: string): Promise<void> {
    await this.db
      .insertInto('smart_search')
      .values({ assetId, embedding })
      .onConflict((oc) => oc.column('assetId').doUpdateSet((eb) => ({ embedding: eb.ref('excluded.embedding') })))
      .execute();
  }

  async getCountries(userIds: string[]): Promise<string[]> {
    const res = await this.getExifField('country', userIds).execute();
    return res.map((row) => row.country!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING] })
  async getStates(userIds: string[], { country }: GetStatesOptions): Promise<string[]> {
    const res = await this.getExifField('state', userIds)
      .$if(!!country, (qb) => qb.where('country', '=', country!))
      .execute();

    return res.map((row) => row.state!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING, DummyValue.STRING] })
  async getCities(userIds: string[], { country, state }: GetCitiesOptions): Promise<string[]> {
    const res = await this.getExifField('city', userIds)
      .$if(!!country, (qb) => qb.where('country', '=', country!))
      .$if(!!state, (qb) => qb.where('state', '=', state!))
      .execute();

    return res.map((row) => row.city!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING, DummyValue.STRING] })
  async getCameraMakes(userIds: string[], { model, lensModel }: GetCameraMakesOptions): Promise<string[]> {
    const res = await this.getExifField('make', userIds)
      .$if(!!model, (qb) => qb.where('model', '=', model!))
      .$if(!!lensModel, (qb) => qb.where('lensModel', '=', lensModel!))
      .execute();

    return res.map((row) => row.make!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING, DummyValue.STRING] })
  async getCameraModels(userIds: string[], { make, lensModel }: GetCameraModelsOptions): Promise<string[]> {
    const res = await this.getExifField('model', userIds)
      .$if(!!make, (qb) => qb.where('make', '=', make!))
      .$if(!!lensModel, (qb) => qb.where('lensModel', '=', lensModel!))
      .execute();

    return res.map((row) => row.model!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING] })
  async getCameraLensModels(userIds: string[], { make, model }: GetCameraLensModelsOptions): Promise<string[]> {
    const res = await this.getExifField('lensModel', userIds)
      .$if(!!make, (qb) => qb.where('make', '=', make!))
      .$if(!!model, (qb) => qb.where('model', '=', model!))
      .execute();

    return res.map((row) => row.lensModel!);
  }

  // ---------------------------------------------------------------------------
  // v3 SQL coverage scaffolding — these methods exist solely to give the SQL
  // generator structurally distinct snapshots of the new `searchAssetBuilder`.
  // They have no consumer yet. PR 2 rewires the legacy methods above to use
  // `searchAssetBuilder` and deletes these scaffolding methods.
  // ---------------------------------------------------------------------------

  @GenerateSql(
    { name: 'baseline', params: [{ size: 100 }, { userIds: [DummyValue.UUID] }] },
    {
      name: 'string-eq-null',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { city: { eq: null } } }],
    },
    {
      name: 'string-pattern-like',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { description: { like: DummyValue.STRING } } }],
    },
    {
      name: 'string-pattern-notLike',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { description: { notLike: DummyValue.STRING } } }],
    },
    {
      name: 'string-pattern-startsWith',
      params: [
        { size: 100 },
        { userIds: [DummyValue.UUID], filter: { originalFileName: { startsWith: DummyValue.STRING } } },
      ],
    },
    {
      name: 'string-similarity-ocr',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { ocr: { matches: DummyValue.STRING } } }],
    },
    {
      name: 'ids-any',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { albumIds: { any: [DummyValue.UUID] } } }],
    },
    {
      name: 'ids-all',
      params: [
        { size: 100 },
        { userIds: [DummyValue.UUID], filter: { personIds: { all: [DummyValue.UUID, DummyValue.UUID] } } },
      ],
    },
    {
      name: 'ids-none',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { tagIds: { none: [DummyValue.UUID] } } }],
    },
    {
      name: 'ids-tags-all',
      params: [
        { size: 100 },
        { userIds: [DummyValue.UUID], filter: { tagIds: { all: [DummyValue.UUID, DummyValue.UUID] } } },
      ],
    },
    {
      name: 'has-albums-false',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { hasAlbums: { eq: false } } }],
    },
    {
      name: 'is-encoded',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { isEncoded: { eq: true } } }],
    },
    {
      name: 'number-range',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { fileSizeInBytes: { gte: 100, lte: 1000 } } }],
    },
    {
      name: 'date-eq',
      params: [{ size: 100 }, { userIds: [DummyValue.UUID], filter: { takenAt: { eq: DummyValue.DATE } } }],
    },
    {
      name: 'date-range',
      params: [
        { size: 100 },
        {
          userIds: [DummyValue.UUID],
          filter: { takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE } },
        },
      ],
    },
    {
      name: 'order-fileSize-noExif',
      params: [
        { size: 100 },
        {
          userIds: [DummyValue.UUID],
          order: { field: SearchOrderField.FileSizeInBytes, direction: AssetOrder.Desc },
          withExif: false,
        },
      ],
    },
    {
      name: 'order-rating-withExif',
      params: [
        { size: 100 },
        {
          userIds: [DummyValue.UUID],
          order: { field: SearchOrderField.Rating, direction: AssetOrder.Asc },
          withExif: true,
        },
      ],
    },
    {
      name: 'or-branches',
      params: [
        { size: 100 },
        {
          userIds: [DummyValue.UUID],
          filter: {
            or: [{ isFavorite: { eq: true } }, { personIds: { any: [DummyValue.UUID] } }],
          },
        },
      ],
    },
    {
      name: 'or-with-top-level',
      params: [
        { size: 100 },
        {
          userIds: [DummyValue.UUID],
          filter: {
            takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE },
            or: [{ isFavorite: { eq: true } }, { albumIds: { any: [DummyValue.UUID] } }],
          },
        },
      ],
    },
  )
  async searchMetadataV3(pagination: AssetSearchPaginationV3Options, options: AssetSearchBuilderV3Options) {
    return await searchAssetBuilder(this.db, options)
      .selectAll('asset')
      .limit(pagination.size + 1)
      .execute();
  }

  @GenerateSql(
    { name: 'baseline', params: [{ userIds: [DummyValue.UUID] }] },
    {
      name: 'with-filter',
      params: [
        {
          userIds: [DummyValue.UUID],
          filter: {
            takenAt: { gte: DummyValue.DATE, lt: DummyValue.DATE },
            fileSizeInBytes: { gte: 100 },
          },
        },
      ],
    },
    {
      name: 'with-or',
      params: [
        {
          userIds: [DummyValue.UUID],
          filter: {
            or: [{ isFavorite: { eq: true } }, { hasAlbums: { eq: false } }],
          },
        },
      ],
    },
  )
  searchStatisticsV3(options: AssetSearchBuilderV3Options) {
    return searchAssetBuilder(this.db, options)
      .select((qb) => qb.fn.countAll<number>().as('total'))
      .executeTakeFirstOrThrow();
  }

  private getExifField(field: 'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel', userIds: string[]) {
    return this.db
      .selectFrom('asset_exif')
      .select(field)
      .distinctOn(field)
      .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
      .where('ownerId', '=', anyUuid(userIds))
      .where('visibility', '=', AssetVisibility.Timeline)
      .where('deletedAt', 'is', null)
      .where(field, 'is not', null)
      .where(field, '!=', '');
  }
}
