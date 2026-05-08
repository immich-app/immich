import { Injectable } from '@nestjs/common';
import { Kysely, OrderByDirection, Selectable, SelectQueryBuilder, ShallowDehydrateObject, sql, SqlBool } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetStatus, AssetType, AssetVisibility, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { DB } from 'src/schema';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import {
  anyUuid,
  asUuid,
  hasAnySpacePerson,
  hasPeople,
  hasTags,
  searchAssetBuilder,
  truncatedDate,
  withExifInner,
} from 'src/utils/database';
import { without } from 'src/utils/filter-suggestions';
import { paginationHelper } from 'src/utils/pagination';
import { isValidInteger } from 'src/validation';

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
  ratingIsMinimum?: boolean;
}

export interface SearchEmbeddingOptions {
  embedding: string;
  userIds: string[];
  maxDistance?: number;
}

export interface SearchOcrOptions {
  ocr?: string;
}

export interface SearchPeopleOptions {
  personIds?: string[];
  personMatchAny?: boolean;
  identityIds?: string[];
  forceEmptyResult?: boolean;
}

export interface SearchTagOptions {
  tagIds?: string[] | null;
  tagMatchAny?: boolean;
}

export interface SearchAlbumOptions {
  albumIds?: string[];
}

export interface SearchSpaceOptions {
  spaceId?: string;
  spacePersonIds?: string[];
  timelineSpaceIds?: string[];
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
  SearchOcrOptions &
  SearchSpaceOptions;

export type AssetSearchOptions = BaseAssetSearchOptions & SearchRelationOptions;

export type AssetSearchBuilderOptions = Omit<AssetSearchOptions, 'orderDirection'>;

export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions &
  SearchAlbumOptions &
  SearchOcrOptions &
  SearchSpaceOptions &
  SearchOrderOptions;

export type SmartSearchFacetsOptions = Omit<SmartSearchOptions, 'orderDirection'>;

type SmartFacetExclude =
  | 'time'
  | 'people'
  | 'location'
  | 'city'
  | 'camera'
  | 'cameraModel'
  | 'tags'
  | 'rating'
  | 'media';

export interface SmartSearchFacetsResult {
  total: number;
  timeBuckets: Array<{ timeBucket: string; count: number }>;
  countries: string[];
  cities: string[];
  cameraMakes: string[];
  cameraModels: string[];
  tags: FilterSuggestionsResult['tags'];
  people: FilterSuggestionsResult['people'];
  ratings: number[];
  mediaTypes: AssetType[];
  hasUnnamedPeople: boolean;
}

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

export interface SuggestionScopeOptions {
  albumId?: string;
  spaceId?: string;
  timelineSpaceIds?: string[];
  takenAfter?: Date;
  takenBefore?: Date;
}

interface ExifSuggestionScopeOptions extends SuggestionScopeOptions {
  isNotInAlbum?: boolean;
}

interface FilterSuggestionFilterOptions {
  personIds?: string[];
  identityIds?: string[];
  forceEmptyResult?: boolean;
  country?: string;
  city?: string;
  make?: string;
  model?: string;
  tagIds?: string[];
  rating?: number;
  mediaType?: AssetType;
  isFavorite?: boolean;
  isNotInAlbum?: boolean;
}

export interface GetStatesOptions extends ExifSuggestionScopeOptions {
  country?: string;
}

export interface GetCitiesOptions extends SuggestionScopeOptions, FilterSuggestionFilterOptions {
  state?: string;
}

export interface GetCameraModelsOptions extends ExifSuggestionScopeOptions {
  make?: string;
  lensModel?: string;
}

export interface GetCameraMakesOptions extends ExifSuggestionScopeOptions {
  model?: string;
  lensModel?: string;
}

export interface GetCameraLensModelsOptions extends ExifSuggestionScopeOptions {
  make?: string;
  model?: string;
}

export interface FilterSuggestionsOptions extends SuggestionScopeOptions, FilterSuggestionFilterOptions {}

type FilterSuggestionPerson = {
  id: string;
  name: string;
  primaryProfile?: { type: 'user-person' | 'space-person'; id: string; spaceId?: string };
};

type AccessibleTagScopeOptions = Pick<
  SuggestionScopeOptions,
  'spaceId' | 'timelineSpaceIds' | 'takenAfter' | 'takenBefore'
>;

export interface FilterSuggestionsResult {
  countries: string[];
  cameraMakes: string[];
  tags: Array<{ id: string; value: string }>;
  people: FilterSuggestionPerson[];
  ratings: number[];
  mediaTypes: string[];
  hasUnnamedPeople: boolean;
}

/** Skip threshold when disabled (0), undefined, or at max cosine distance (>= 2) since it would filter nothing */
export function isActiveDistanceThreshold(maxDistance: number | undefined): boolean {
  return (maxDistance ?? 0) > 0 && (maxDistance ?? 0) < 2;
}

@Injectable()
export class SearchRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [DummyValue.UUID] })
  getEmbedding(assetId: string) {
    return this.db
      .selectFrom('smart_search')
      .select('embedding')
      .where('assetId', '=', assetId)
      .executeTakeFirst()
      .then((row) => row?.embedding ?? null);
  }

  @GenerateSql(
    {
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
    },
    {
      name: 'identity-filter',
      params: [
        { page: 1, size: 100 },
        {
          userIds: [DummyValue.UUID],
          timelineSpaceIds: [DummyValue.UUID],
          identityIds: [DummyValue.UUID],
          withStacked: true,
        },
      ],
    },
  )
  async searchMetadata(pagination: SearchPaginationOptions, options: AssetSearchOptions) {
    const orderDirection = (options.orderDirection?.toLowerCase() || 'desc') as OrderByDirection;
    const items = await searchAssetBuilder(this.db, options)
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
    return searchAssetBuilder(this.db, options)
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
    return searchAssetBuilder(this.db, options)
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
    return searchAssetBuilder(this.db, options)
      .selectAll('asset')
      .$call(withExifInner)
      .where('asset_exif.fileSizeInByte', '>', options.minFileSize || 0)
      .orderBy('asset_exif.fileSizeInByte', orderDirection)
      .limit(size)
      .execute();
  }

  private buildSearchSmartQueries(
    kysely: Kysely<DB>,
    pagination: SearchPaginationOptions,
    options: SmartSearchOptions,
  ) {
    const hasDistanceThreshold = isActiveDistanceThreshold(options.maxDistance);
    const personIds = options.personIds?.filter(Boolean) ?? [];
    const identityIds = options.identityIds?.filter(Boolean) ?? [];

    let baseQuery = searchAssetBuilder(kysely, {
      ...without(options, 'personIds', 'personMatchAny', 'identityIds', 'forceEmptyResult'),
      ratingIsMinimum: true,
    })
      .selectAll('asset')
      .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
      .$if(!!options.forceEmptyResult, (qb) => qb.where(sql<SqlBool>`false`))
      .$if(hasDistanceThreshold, (qb) =>
        qb.where(sql<SqlBool>`(smart_search.embedding <=> ${options.embedding}) <= ${options.maxDistance!}`),
      )
      // DO NOT add a secondary ORDER BY key on any column here.
      // vchord's ordered index scan can only satisfy a single-key ORDER BY on
      // `smart_search.embedding <=>`. Any additional sort key forces the planner
      // to Parallel Seq Scan + in-memory sort (~15s on 200k rows vs ~200ms via
      // vchord). Cross-page duplicates from identical embeddings are caught by
      // the frontend dedup in web/src/lib/utils/search-dedup.ts.
      .orderBy(sql`smart_search.embedding <=> ${options.embedding}`);

    if (personIds.length > 0) {
      // Keep the smart_search ordered scan as the driving path. Materializing the
      // full matching asset_face set first pushes the planner back to tens of
      // thousands of smart_search PK lookups on person-filtered queries.
      baseQuery = baseQuery.where((eb) => {
        const hasVisiblePersonFace = (personId: string | string[]) =>
          eb.exists(
            eb
              .selectFrom('asset_face')
              .whereRef('asset_face.assetId', '=', 'asset.id')
              .where('asset_face.deletedAt', 'is', null)
              .where('asset_face.isVisible', 'is', true)
              .where('asset_face.personId', '=', Array.isArray(personId) ? anyUuid(personId) : asUuid(personId)),
          );

        return options.personMatchAny
          ? hasVisiblePersonFace(personIds)
          : eb.and(personIds.map((personId) => hasVisiblePersonFace(personId)));
      });
    }

    if (identityIds.length > 0) {
      baseQuery = baseQuery.where((eb) =>
        eb.and(
          identityIds.map((identityId) =>
            eb.exists(
              eb
                .selectFrom('asset_face')
                .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
                .whereRef('asset_face.assetId', '=', 'asset.id')
                .where('asset_face.deletedAt', 'is', null)
                .where('asset_face.isVisible', 'is', true)
                .where('face_identity_face.identityId', '=', asUuid(identityId)),
            ),
          ),
        ),
      );
    }

    if (options.orderDirection) {
      const orderDirection = options.orderDirection.toLowerCase() as OrderByDirection;
      const candidates = baseQuery.limit(500).as('candidates');
      const outerQuery = kysely
        .selectFrom(candidates)
        .selectAll()
        // sql.raw is safe here — orderDirection is validated to 'asc'|'desc' by the AssetOrder enum
        .orderBy(sql`"candidates"."fileCreatedAt" ${sql.raw(orderDirection)} nulls last`)
        // Stable tiebreaker (same rationale as the base query)
        .orderBy('candidates.id')
        .limit(pagination.size + 1)
        .offset((pagination.page - 1) * pagination.size);
      return { kind: 'cte' as const, base: baseQuery, outer: outerQuery };
    }

    const outerQuery = baseQuery.limit(pagination.size + 1).offset((pagination.page - 1) * pagination.size);

    return { kind: 'simple' as const, base: baseQuery, outer: outerQuery };
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
        spacePersonIds: [DummyValue.UUID],
        timelineSpaceIds: [DummyValue.UUID, DummyValue.UUID],
        orderDirection: 'desc',
        maxDistance: 0.75,
      },
    ],
  })
  searchSmart(pagination: SearchPaginationOptions, options: SmartSearchOptions) {
    if (!isValidInteger(pagination.size, { min: 1, max: 1000 })) {
      throw new Error(`Invalid value for 'size': ${pagination.size}`);
    }

    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Clip])}`.execute(trx);

      const { kind, outer } = this.buildSearchSmartQueries(trx, pagination, options);
      if (kind === 'cte') {
        const items = (await outer.execute()) as MapAsset[];
        return paginationHelper(items, pagination.size);
      }
      const items = await outer.execute();
      return paginationHelper(items, pagination.size);
    });
  }

  @GenerateSql({
    params: [
      {
        embedding: DummyValue.VECTOR,
        userIds: [DummyValue.UUID],
        timelineSpaceIds: [DummyValue.UUID, DummyValue.UUID],
        maxDistance: 0.75,
        country: DummyValue.STRING,
        make: DummyValue.STRING,
        tagIds: [DummyValue.UUID],
        rating: 4,
        type: AssetType.Image,
        takenAfter: DummyValue.DATE,
        takenBefore: DummyValue.DATE,
      },
    ],
  })
  async getSmartSearchFacets(options: SmartSearchFacetsOptions): Promise<SmartSearchFacetsResult> {
    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.Clip])}`.execute(trx);
      await this.createSmartFacetCandidates(trx, options);

      const total = await this.getSmartFacetTotal(trx, options);
      const timeBuckets = await this.getSmartFacetTimeBuckets(trx, options);
      const countries = await this.getSmartFacetCountries(trx, options);
      const cities = await this.getSmartFacetCities(trx, options);
      const cameraMakes = await this.getSmartFacetCameraMakes(trx, options);
      const cameraModels = await this.getSmartFacetCameraModels(trx, options);
      const tags = await this.getSmartFacetTags(trx, options);
      const peopleResult = await this.getSmartFacetPeople(trx, options);
      const ratings = await this.getSmartFacetRatings(trx, options);
      const mediaTypes = await this.getSmartFacetMediaTypes(trx, options);

      return {
        total,
        timeBuckets,
        countries,
        cities,
        cameraMakes,
        cameraModels,
        tags,
        people: peopleResult.people,
        ratings,
        mediaTypes,
        hasUnnamedPeople: peopleResult.hasUnnamedPeople,
      };
    });
  }

  private buildSmartFacetCandidateQuery(kysely: Kysely<DB>, options: SmartSearchFacetsOptions) {
    const hasDistanceThreshold = isActiveDistanceThreshold(options.maxDistance);

    return searchAssetBuilder(kysely, {
      ...without(
        options,
        'city',
        'country',
        'make',
        'model',
        'rating',
        'type',
        'isFavorite',
        'takenAfter',
        'takenBefore',
        'personIds',
        'personMatchAny',
        'identityIds',
        'forceEmptyResult',
        'spacePersonIds',
        'tagIds',
        'tagMatchAny',
      ),
      ratingIsMinimum: true,
    })
      .select('asset.id')
      .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
      .$if(!!options.forceEmptyResult, (qb) => qb.where(sql<SqlBool>`false`))
      .$if(hasDistanceThreshold, (qb) =>
        qb.where(sql<SqlBool>`(smart_search.embedding <=> ${options.embedding}) <= ${options.maxDistance!}`),
      )
      .where('smart_search.embedding', 'is not', null);
  }

  private async createSmartFacetCandidates(trx: Kysely<DB>, options: SmartSearchFacetsOptions) {
    await sql`drop table if exists smart_search_facet_candidates`.execute(trx);
    await sql`
      create temporary table smart_search_facet_candidates on commit drop as
      ${this.buildSmartFacetCandidateQuery(trx, options)}
    `.execute(trx);
    await sql`create index smart_search_facet_candidates_asset_id_idx on smart_search_facet_candidates ("id")`.execute(
      trx,
    );
  }

  private buildSmartFacetFilteredAssetIds(
    kysely: Kysely<DB>,
    options: SmartSearchFacetsOptions,
    exclude?: SmartFacetExclude,
  ) {
    const appliesCountry = exclude !== 'location' && options.country !== undefined;
    const appliesCity = exclude !== 'location' && exclude !== 'city' && options.city !== undefined;
    const appliesMake = exclude !== 'camera' && options.make !== undefined;
    const appliesModel = exclude !== 'camera' && exclude !== 'cameraModel' && options.model !== undefined;
    const appliesRating = exclude !== 'rating' && options.rating !== undefined;
    const needsExifJoin = !!(appliesCountry || appliesCity || appliesMake || appliesModel || appliesRating);

    return kysely
      .selectFrom('asset')
      .select('asset.id')
      .where(
        'asset.id',
        'in',
        kysely.selectFrom(sql<{ id: string }>`smart_search_facet_candidates`.as('candidates')).select('candidates.id'),
      )
      .$if(exclude !== 'time' && !!options.takenAfter, (qb) =>
        qb.where('asset.fileCreatedAt', '>=', options.takenAfter!),
      )
      .$if(exclude !== 'time' && !!options.takenBefore, (qb) =>
        qb.where('asset.fileCreatedAt', '<=', options.takenBefore!),
      )
      .$if(exclude !== 'media' && !!options.type, (qb) => qb.where('asset.type', '=', options.type!))
      .$if(options.isFavorite !== undefined, (qb) => qb.where('asset.isFavorite', '=', options.isFavorite!))
      .$if(needsExifJoin, (qb) =>
        qb
          .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
          .$if(appliesCountry, (qb) =>
            qb.where('asset_exif.country', options.country === null ? 'is' : '=', options.country!),
          )
          .$if(appliesCity, (qb) => qb.where('asset_exif.city', options.city === null ? 'is' : '=', options.city!))
          .$if(appliesMake, (qb) => qb.where('asset_exif.make', options.make === null ? 'is' : '=', options.make!))
          .$if(appliesModel, (qb) => qb.where('asset_exif.model', options.model === null ? 'is' : '=', options.model!))
          .$if(appliesRating, (qb) =>
            options.rating === null
              ? qb.where('asset_exif.rating', 'is', null)
              : qb.where('asset_exif.rating', '>=', options.rating!),
          ),
      )
      .$if(exclude !== 'people' && !!options.personIds?.length, (qb) => hasPeople(qb, options.personIds!))
      .$if(exclude !== 'people' && !!options.identityIds?.length, (qb) =>
        qb.where((eb) =>
          eb.and(
            options.identityIds!.map((identityId) =>
              eb.exists(
                eb
                  .selectFrom('asset_face')
                  .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
                  .whereRef('asset_face.assetId', '=', 'asset.id')
                  .where('asset_face.deletedAt', 'is', null)
                  .where('asset_face.isVisible', 'is', true)
                  .where('face_identity_face.identityId', '=', asUuid(identityId)),
              ),
            ),
          ),
        ),
      )
      .$if(exclude !== 'people' && !!options.spacePersonIds?.length, (qb) =>
        hasAnySpacePerson(qb, options.spacePersonIds!),
      )
      .$if(exclude !== 'tags' && !!options.tagIds?.length, (qb) => hasTags(qb, options.tagIds!))
      .$if(exclude !== 'tags' && options.tagIds === null, (qb) =>
        qb.where((eb) => eb.not(eb.exists((eb) => eb.selectFrom('tag_asset').whereRef('assetId', '=', 'asset.id')))),
      )
      .$if(!!options.forceEmptyResult, (qb) => qb.where(sql<SqlBool>`false`));
  }

  private async getSmartFacetTotal(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<number> {
    const row = await trx
      .selectFrom(this.buildSmartFacetFilteredAssetIds(trx, options).as('filtered'))
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .executeTakeFirstOrThrow();
    return Number(row.count);
  }

  private async getSmartFacetTimeBuckets(
    trx: Kysely<DB>,
    options: SmartSearchFacetsOptions,
  ): Promise<Array<{ timeBucket: string; count: number }>> {
    return trx
      .with('asset', (qb) =>
        qb
          .selectFrom('asset')
          .select(truncatedDate<Date>().as('timeBucket'))
          .where('asset.id', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'time')),
      )
      .selectFrom('asset')
      .select(sql<string>`("timeBucket" AT TIME ZONE 'UTC')::date::text`.as('timeBucket'))
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .groupBy('timeBucket')
      .orderBy('timeBucket', 'desc')
      .execute() as Promise<Array<{ timeBucket: string; count: number }>>;
  }

  private async getSmartFacetCountries(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
    const rows = await trx
      .selectFrom('asset_exif')
      .select('country')
      .distinct()
      .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'location'))
      .where('country', 'is not', null)
      .where('country', '!=', '')
      .orderBy('country')
      .execute();
    return rows.map((row) => row.country!);
  }

  private async getSmartFacetCities(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
    const rows = await trx
      .selectFrom('asset_exif')
      .select('city')
      .distinct()
      .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'city'))
      .where('city', 'is not', null)
      .where('city', '!=', '')
      .orderBy('city')
      .execute();
    return rows.map((row) => row.city!);
  }

  private async getSmartFacetCameraMakes(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
    const rows = await trx
      .selectFrom('asset_exif')
      .select('make')
      .distinct()
      .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'camera'))
      .where('make', 'is not', null)
      .where('make', '!=', '')
      .orderBy('make')
      .execute();
    return rows.map((row) => row.make!);
  }

  private async getSmartFacetCameraModels(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<string[]> {
    const rows = await trx
      .selectFrom('asset_exif')
      .select('model')
      .distinct()
      .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'cameraModel'))
      .where('model', 'is not', null)
      .where('model', '!=', '')
      .orderBy('model')
      .execute();
    return rows.map((row) => row.model!);
  }

  private async getSmartFacetTags(
    trx: Kysely<DB>,
    options: SmartSearchFacetsOptions,
  ): Promise<Array<{ id: string; value: string }>> {
    return trx
      .selectFrom('tag')
      .select(['tag.id', 'tag.value'])
      .distinct()
      .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
      .where('tag_asset.assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'tags'))
      .orderBy('tag.value')
      .execute();
  }

  private async getSmartFacetPeople(
    trx: Kysely<DB>,
    options: SmartSearchFacetsOptions,
  ): Promise<{ people: FilterSuggestionPerson[]; hasUnnamedPeople: boolean }> {
    const filteredIds = this.buildSmartFacetFilteredAssetIds(trx, options, 'people');

    if (options.spaceId) {
      const spacePeople = await trx
        .selectFrom('shared_space_person')
        .select(['shared_space_person.id', 'shared_space_person.name'])
        .where('shared_space_person.spaceId', '=', asUuid(options.spaceId))
        .where('shared_space_person.isHidden', '=', false)
        .where((eb) =>
          eb.exists(
            eb
              .selectFrom('shared_space_person_face')
              .innerJoin('asset_face as af', 'af.id', 'shared_space_person_face.assetFaceId')
              .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
              .where('af.deletedAt', 'is', null)
              .where('af.isVisible', 'is', true)
              .where('af.assetId', 'in', filteredIds),
          ),
        )
        .orderBy(sql`nullif("shared_space_person"."name", '')`)
        .orderBy('shared_space_person.id')
        .execute();

      const people = spacePeople
        .map((person) => ({
          id: person.id,
          name: person.name || '',
          primaryProfile: { type: 'space-person' as const, id: person.id, spaceId: options.spaceId },
        }))
        .filter((person) => person.name !== '')
        .toSorted((a, b) => a.name.localeCompare(b.name));

      const hasUnnamedPeople = spacePeople.some((person) => !person.name);

      return { people, hasUnnamedPeople };
    }

    if (options.timelineSpaceIds?.length) {
      return this.getFilteredIdentityPeople(filteredIds, options.userIds[0], options.timelineSpaceIds, trx);
    }

    const peopleRows = await trx
      .selectFrom('person')
      .select(['person.id', 'person.name'])
      .where('person.name', '!=', '')
      .where('person.isHidden', '=', false)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('asset_face')
            .whereRef('asset_face.personId', '=', 'person.id')
            .where('asset_face.deletedAt', 'is', null)
            .where('asset_face.isVisible', 'is', true)
            .where('asset_face.assetId', 'in', filteredIds),
        ),
      )
      .orderBy('person.name')
      .execute();
    const people = peopleRows.map((person) => ({
      ...person,
      primaryProfile: { type: 'user-person' as const, id: person.id },
    }));

    const unnamed = await trx
      .selectFrom('person')
      .select(sql`1`.as('exists'))
      .where((eb) => eb.or([eb('person.name', '=', ''), eb('person.name', 'is', null)]))
      .where('person.isHidden', '=', false)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('asset_face')
            .whereRef('asset_face.personId', '=', 'person.id')
            .where('asset_face.deletedAt', 'is', null)
            .where('asset_face.isVisible', 'is', true)
            .where('asset_face.assetId', 'in', filteredIds),
        ),
      )
      .limit(1)
      .executeTakeFirst();

    return { people, hasUnnamedPeople: !!unnamed };
  }

  private async getSmartFacetRatings(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<number[]> {
    const rows = await trx
      .selectFrom('asset_exif')
      .select('rating')
      .distinct()
      .where('assetId', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'rating'))
      .where('rating', 'is not', null)
      .where('rating', '>', 0)
      .orderBy('rating')
      .execute();
    return rows.map((row) => row.rating!);
  }

  private async getSmartFacetMediaTypes(trx: Kysely<DB>, options: SmartSearchFacetsOptions): Promise<AssetType[]> {
    const rows = await trx
      .selectFrom('asset')
      .select('type')
      .distinct()
      .where('id', 'in', this.buildSmartFacetFilteredAssetIds(trx, options, 'media'))
      .orderBy('type')
      .execute();
    return rows.map((row) => row.type);
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
    if (!isValidInteger(numResults, { min: 1, max: 1000 })) {
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

  async getCountries(userIds: string[], options?: ExifSuggestionScopeOptions): Promise<string[]> {
    const res = await this.getExifField('country', userIds, options).execute();
    return res.map((row) => row.country!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING] })
  async getStates(userIds: string[], options: GetStatesOptions): Promise<string[]> {
    const res = await this.getExifField('state', userIds, options)
      .$if(!!options.country, (qb) => qb.where('country', '=', options.country!))
      .execute();

    return res.map((row) => row.state!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING, DummyValue.STRING] })
  async getCities(userIds: string[], options: GetCitiesOptions): Promise<string[]> {
    const filteredIds = this.buildFilteredAssetIds(userIds, without(options, 'city'));
    const res = await this.db
      .selectFrom('asset_exif')
      .select('city')
      .distinct()
      .where('assetId', 'in', filteredIds)
      .where('city', 'is not', null)
      .where('city', '!=', '')
      .$if(!!options.state, (qb) => qb.where('state', '=', options.state!))
      .orderBy('city')
      .execute();

    return res.map((row) => row.city!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING, DummyValue.STRING] })
  async getCameraMakes(userIds: string[], options: GetCameraMakesOptions): Promise<string[]> {
    const res = await this.getExifField('make', userIds, options)
      .$if(!!options.model, (qb) => qb.where('model', '=', options.model!))
      .$if(!!options.lensModel, (qb) => qb.where('lensModel', '=', options.lensModel!))
      .execute();

    return res.map((row) => row.make!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING, DummyValue.STRING] })
  async getCameraModels(userIds: string[], options: GetCameraModelsOptions): Promise<string[]> {
    const res = await this.getExifField('model', userIds, options)
      .$if(!!options.make, (qb) => qb.where('make', '=', options.make!))
      .$if(!!options.lensModel, (qb) => qb.where('lensModel', '=', options.lensModel!))
      .execute();

    return res.map((row) => row.model!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING] })
  async getCameraLensModels(userIds: string[], options: GetCameraLensModelsOptions): Promise<string[]> {
    const res = await this.getExifField('lensModel', userIds, options)
      .$if(!!options.make, (qb) => qb.where('make', '=', options.make!))
      .$if(!!options.model, (qb) => qb.where('model', '=', options.model!))
      .execute();

    return res.map((row) => row.lensModel!);
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getAccessibleTags(
    userIds: string[],
    options?: AccessibleTagScopeOptions,
  ): Promise<Array<{ id: string; value: string }>> {
    return this.db
      .selectFrom('tag')
      .select(['tag.id', 'tag.value'])
      .distinct()
      .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
      .innerJoin('asset', 'tag_asset.assetId', 'asset.id')
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .$if(!options?.spaceId && !options?.timelineSpaceIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(userIds)))
      .$if(!!options?.spaceId && !options?.timelineSpaceIds, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', asUuid(options!.spaceId!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', asUuid(options!.spaceId!)),
            ),
          ]),
        ),
      )
      .$if(!!options?.timelineSpaceIds, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.ownerId', '=', anyUuid(userIds)),
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
          ]),
        ),
      )
      .$if(!!options?.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options!.takenAfter!))
      .$if(!!options?.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<', options!.takenBefore!))
      .orderBy('tag.value')
      .execute();
  }

  @GenerateSql({
    name: 'identity-filter-suggestions',
    params: [
      [DummyValue.UUID],
      {
        timelineSpaceIds: [DummyValue.UUID],
        identityIds: [DummyValue.UUID],
        takenAfter: DummyValue.DATE,
      },
    ],
    sortQueries: [
      'select distinct\n  "country"',
      'select distinct\n  "make"',
      'select distinct\n  "tag"."id"',
      'WITH\n  filtered_assets',
      'select distinct\n  "rating"',
      'select distinct\n  "type"',
    ],
  })
  async getFilterSuggestions(userIds: string[], options: FilterSuggestionsOptions): Promise<FilterSuggestionsResult> {
    const [countries, cameraMakes, tags, peopleResult, ratings, mediaTypes] = await Promise.all([
      this.getFilteredCountries(userIds, without(options, 'country', 'city')),
      this.getFilteredCameraMakes(userIds, without(options, 'make', 'model')),
      this.getFilteredTags(userIds, without(options, 'tagIds')),
      this.getFilteredPeople(userIds, without(options, 'personIds', 'identityIds')),
      this.getFilteredRatings(userIds, without(options, 'rating')),
      this.getFilteredMediaTypes(userIds, without(options, 'mediaType')),
    ]);

    return {
      countries,
      cameraMakes,
      tags,
      people: peopleResult.people,
      ratings,
      mediaTypes,
      hasUnnamedPeople: peopleResult.hasUnnamedPeople,
    };
  }

  private applySuggestionScope<T extends SelectQueryBuilder<DB, any, any>>(
    qb: T,
    userIds: string[],
    options?: ExifSuggestionScopeOptions,
  ) {
    return qb
      .$if(!!options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('album_asset')
              .whereRef('album_asset.assetId', '=', 'asset.id')
              .where('album_asset.albumId', '=', asUuid(options!.albumId!)),
          ),
        ),
      )
      .$if(!!options?.albumId && !!options?.timelineSpaceIds?.length, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.ownerId', '=', anyUuid(userIds)),
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
          ]),
        ),
      )
      .$if(!!options?.albumId && !options?.timelineSpaceIds?.length, (qb) =>
        qb.where('asset.ownerId', '=', anyUuid(userIds)),
      )
      .$if(!options?.albumId && !options?.spaceId && !options?.timelineSpaceIds, (qb) =>
        qb.where('asset.ownerId', '=', anyUuid(userIds)),
      )
      .$if(!!options?.spaceId && !options?.timelineSpaceIds && !options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', asUuid(options!.spaceId!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', asUuid(options!.spaceId!)),
            ),
          ]),
        ),
      )
      .$if(!!options?.timelineSpaceIds && !options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.ownerId', '=', anyUuid(userIds)),
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', anyUuid(options!.timelineSpaceIds!)),
            ),
          ]),
        ),
      );
  }

  private getExifField<K extends 'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel'>(
    field: K,
    userIds: string[],
    options?: ExifSuggestionScopeOptions,
  ) {
    return this.applySuggestionScope(
      this.db
        .selectFrom('asset_exif')
        .select(field)
        .distinctOn(field)
        .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
        .where('visibility', '=', AssetVisibility.Timeline)
        .where('deletedAt', 'is', null)
        .where(field, 'is not', null)
        .where(field, '!=', '' as any),
      userIds,
      options,
    )
      .$if(!!options?.isNotInAlbum && !options?.albumId, (qb) =>
        qb.where((eb) =>
          eb.not(eb.exists((eb) => eb.selectFrom('album_asset').whereRef('album_asset.assetId', '=', 'asset.id'))),
        ),
      )
      .$if(!!options?.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options!.takenAfter!))
      .$if(!!options?.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<', options!.takenBefore!));
  }

  private buildFilteredAssetIds(userIds: string[], options: FilterSuggestionsOptions) {
    const needsExifJoin = !!(options.country || options.city || options.make || options.model || options.rating);

    return this.applySuggestionScope(
      this.db
        .selectFrom('asset')
        .select('asset.id')
        .where('asset.visibility', '=', AssetVisibility.Timeline)
        .where('asset.deletedAt', 'is', null),
      userIds,
      options,
    )
      .$if(!!options.forceEmptyResult, (qb) => qb.where(sql<SqlBool>`false`))
      .$if(!!options.isNotInAlbum && !options.albumId, (qb) =>
        qb.where((eb) =>
          eb.not(eb.exists((eb) => eb.selectFrom('album_asset').whereRef('album_asset.assetId', '=', 'asset.id'))),
        ),
      )
      .$if(!!options.takenAfter, (qb) => qb.where('asset.fileCreatedAt', '>=', options.takenAfter!))
      .$if(!!options.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<', options.takenBefore!))
      .$if(needsExifJoin, (qb) =>
        qb
          .innerJoin('asset_exif', 'asset_exif.assetId', 'asset.id')
          .$if(!!options.country, (qb) => qb.where('asset_exif.country', '=', options.country!))
          .$if(!!options.city, (qb) => qb.where('asset_exif.city', '=', options.city!))
          .$if(!!options.make, (qb) => qb.where('asset_exif.make', '=', options.make!))
          .$if(!!options.model, (qb) => qb.where('asset_exif.model', '=', options.model!))
          .$if(!!options.rating, (qb) => qb.where('asset_exif.rating', '>=', options.rating!)),
      )
      .$if(!!options.personIds?.length && !!options.spaceId, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('shared_space_person_face')
              .innerJoin('asset_face', 'asset_face.id', 'shared_space_person_face.assetFaceId')
              .whereRef('asset_face.assetId', '=', 'asset.id')
              .where('asset_face.deletedAt', 'is', null)
              .where('asset_face.isVisible', 'is', true)
              .where('shared_space_person_face.personId', '=', anyUuid(options.personIds!)),
          ),
        ),
      )
      .$if(!!options.personIds?.length && !options.spaceId, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('asset_face')
              .whereRef('asset_face.assetId', '=', 'asset.id')
              .where('asset_face.personId', '=', anyUuid(options.personIds!)),
          ),
        ),
      )
      .$if(!!options.identityIds?.length, (qb) =>
        qb.where((eb) =>
          eb.and(
            options.identityIds!.map((identityId) =>
              eb.exists(
                eb
                  .selectFrom('asset_face')
                  .innerJoin('face_identity_face', 'face_identity_face.assetFaceId', 'asset_face.id')
                  .whereRef('asset_face.assetId', '=', 'asset.id')
                  .where('asset_face.deletedAt', 'is', null)
                  .where('asset_face.isVisible', 'is', true)
                  .where('face_identity_face.identityId', '=', asUuid(identityId)),
              ),
            ),
          ),
        ),
      )
      .$if(!!options.tagIds?.length, (qb) =>
        qb.where((eb) =>
          eb.exists(
            eb
              .selectFrom('tag_asset')
              .whereRef('tag_asset.assetId', '=', 'asset.id')
              .where('tag_asset.tagId', '=', anyUuid(options.tagIds!)),
          ),
        ),
      )
      .$if(!!options.mediaType, (qb) => qb.where('asset.type', '=', options.mediaType!))
      .$if(options.isFavorite !== undefined && options.isFavorite !== null, (qb) =>
        qb.where('asset.isFavorite', '=', options.isFavorite!),
      );
  }

  private async getFilteredCountries(userIds: string[], options: FilterSuggestionsOptions): Promise<string[]> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);
    const res = await this.db
      .selectFrom('asset_exif')
      .select('country')
      .distinct()
      .where('assetId', 'in', filteredIds)
      .where('country', 'is not', null)
      .where('country', '!=', '')
      .orderBy('country')
      .execute();
    return res.map((row) => row.country!);
  }

  private async getFilteredCameraMakes(userIds: string[], options: FilterSuggestionsOptions): Promise<string[]> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);
    const res = await this.db
      .selectFrom('asset_exif')
      .select('make')
      .distinct()
      .where('assetId', 'in', filteredIds)
      .where('make', 'is not', null)
      .where('make', '!=', '')
      .orderBy('make')
      .execute();
    return res.map((row) => row.make!);
  }

  private async getFilteredTags(
    userIds: string[],
    options: FilterSuggestionsOptions,
  ): Promise<Array<{ id: string; value: string }>> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);
    return this.db
      .selectFrom('tag')
      .select(['tag.id', 'tag.value'])
      .distinct()
      .innerJoin('tag_asset', 'tag.id', 'tag_asset.tagId')
      .where('tag_asset.assetId', 'in', filteredIds)
      .orderBy('tag.value')
      .execute();
  }

  private async getFilteredPeople(
    userIds: string[],
    options: FilterSuggestionsOptions,
  ): Promise<{ people: FilterSuggestionPerson[]; hasUnnamedPeople: boolean }> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);

    // When spaceId is set, return shared_space_person records (space-specific IDs and names)
    if (options.spaceId) {
      const spacePeople = await this.buildFilteredSpacePeopleQuery(filteredIds, options.spaceId).execute();

      const people = spacePeople
        .map((p) => ({
          id: p.id,
          name: p.name || '',
          primaryProfile: { type: 'space-person' as const, id: p.id, spaceId: options.spaceId },
        }))
        .filter((p) => p.name !== '');

      const hasUnnamedPeople = spacePeople.some((p) => !p.name);

      return { people, hasUnnamedPeople };
    }

    if (options.timelineSpaceIds?.length) {
      return this.getFilteredIdentityPeople(filteredIds, userIds[0], options.timelineSpaceIds);
    }

    // Global: return person records
    const peopleRows = await this.buildFilteredGlobalPeopleQuery(filteredIds).execute();
    const people = peopleRows.map((person) => ({
      ...person,
      primaryProfile: { type: 'user-person' as const, id: person.id },
    }));

    const unnamed = await this.db
      .selectFrom('person')
      .select(sql`1`.as('exists'))
      .where((eb) => eb.or([eb('person.name', '=', ''), eb('person.name', 'is', null)]))
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('asset_face')
            .whereRef('asset_face.personId', '=', 'person.id')
            .where('asset_face.assetId', 'in', filteredIds),
        ),
      )
      .limit(1)
      .executeTakeFirst();

    return { people, hasUnnamedPeople: !!unnamed };
  }

  private buildFilteredSpacePeopleQuery(filteredIds: SelectQueryBuilder<DB, 'asset', { id: string }>, spaceId: string) {
    return this.db
      .selectFrom('shared_space_person')
      .select(['shared_space_person.id', 'shared_space_person.name'])
      .where('shared_space_person.spaceId', '=', asUuid(spaceId))
      .where('shared_space_person.isHidden', '=', false)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('shared_space_person_face')
            .innerJoin('asset_face as af', 'af.id', 'shared_space_person_face.assetFaceId')
            .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
            .where('af.deletedAt', 'is', null)
            .where('af.isVisible', 'is', true)
            .where('af.assetId', 'in', filteredIds),
        ),
      )
      .orderBy(sql`nullif("shared_space_person"."name", '')`)
      .orderBy('shared_space_person.id');
  }

  private buildFilteredGlobalPeopleQuery(filteredIds: SelectQueryBuilder<DB, 'asset', { id: string }>) {
    return this.db
      .selectFrom('person')
      .select(['person.id', 'person.name'])
      .where('person.name', '!=', '')
      .where('person.isHidden', '=', false)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('asset_face')
            .whereRef('asset_face.personId', '=', 'person.id')
            .where('asset_face.assetId', 'in', filteredIds),
        ),
      )
      .orderBy('person.isFavorite', 'desc')
      .orderBy('person.name');
  }

  private async getFilteredIdentityPeople(
    filteredIds: SelectQueryBuilder<DB, 'asset', { id: string }>,
    userId: string,
    timelineSpaceIds: string[],
    db: Kysely<DB> = this.db,
  ): Promise<{ people: FilterSuggestionPerson[]; hasUnnamedPeople: boolean }> {
    const result = await sql<{
      id: string;
      name: string | null;
      profileType: 'user-person' | 'space-person';
      profileId: string;
      spaceId: string | null;
    }>`
      WITH filtered_assets AS (
        ${filteredIds}
      ),
      identity_faces AS (
        SELECT DISTINCT
          face_identity_face."identityId"
        FROM face_identity_face
        INNER JOIN asset_face ON asset_face.id = face_identity_face."assetFaceId"
        INNER JOIN filtered_assets ON filtered_assets.id = asset_face."assetId"
        WHERE asset_face."deletedAt" IS NULL
          AND asset_face."isVisible" = true
      ),
      profiles AS (
        SELECT
          'user-person'::text AS "profileType",
          person.id AS "profileId",
          NULL::uuid AS "spaceId",
          person."identityId",
          person.name,
          person."isHidden",
          person."updatedAt",
          0 AS "profileRank"
        FROM person
        WHERE person."ownerId" = ${userId}
          AND person."identityId" IS NOT NULL
          AND EXISTS (SELECT 1 FROM identity_faces WHERE identity_faces."identityId" = person."identityId")
        UNION ALL
        SELECT
          'space-person'::text AS "profileType",
          shared_space_person.id AS "profileId",
          shared_space_person."spaceId",
          shared_space_person."identityId",
          COALESCE(NULLIF(shared_space_person_alias.alias, ''), shared_space_person.name, '') AS name,
          shared_space_person."isHidden",
          shared_space_person."updatedAt",
          CASE WHEN NULLIF(shared_space_person_alias.alias, '') IS NULL THEN 2 ELSE 1 END AS "profileRank"
        FROM shared_space_person
        LEFT JOIN shared_space_person_alias
          ON shared_space_person_alias."personId" = shared_space_person.id
          AND shared_space_person_alias."userId" = ${userId}
        WHERE shared_space_person."spaceId" = ${anyUuid(timelineSpaceIds)}
          AND shared_space_person."identityId" IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM shared_space_person_face
            INNER JOIN asset_face AS profile_face
              ON profile_face.id = shared_space_person_face."assetFaceId"
            WHERE shared_space_person_face."personId" = shared_space_person.id
              AND profile_face."deletedAt" IS NULL
              AND profile_face."isVisible" = true
          )
          AND EXISTS (
            SELECT 1 FROM identity_faces WHERE identity_faces."identityId" = shared_space_person."identityId"
          )
      ),
      ranked_profiles AS (
        SELECT
          profiles.*,
          row_number() OVER (
            PARTITION BY profiles."identityId"
            ORDER BY
              NULLIF(profiles.name, '') IS NULL,
              profiles."profileRank",
              lower(profiles.name),
              profiles."updatedAt" DESC,
              profiles."profileId"
          ) AS display_rn,
          row_number() OVER (
            PARTITION BY profiles."identityId"
            ORDER BY
              CASE
                WHEN profiles."profileType" = 'user-person' THEN 0
                ELSE profiles."profileRank"
              END,
              NULLIF(profiles.name, '') IS NULL,
              lower(profiles.name),
              profiles."updatedAt" DESC,
              profiles."profileId"
          ) AS primary_rn
        FROM profiles
        WHERE profiles."isHidden" = false
      )
      SELECT
        CASE
          WHEN primary_profiles."profileType" = 'space-person' THEN 'space-person:' || primary_profiles."profileId"::text
          ELSE 'person:' || primary_profiles."profileId"::text
        END AS id,
        COALESCE(NULLIF(display_profiles.name, ''), primary_profiles.name, '') AS name,
        primary_profiles."profileType",
        primary_profiles."profileId",
        primary_profiles."spaceId"
      FROM ranked_profiles AS primary_profiles
      INNER JOIN ranked_profiles AS display_profiles
        ON display_profiles."identityId" = primary_profiles."identityId"
        AND display_profiles.display_rn = 1
      WHERE primary_profiles.primary_rn = 1
      ORDER BY
        NULLIF(COALESCE(NULLIF(display_profiles.name, ''), primary_profiles.name, ''), '') IS NULL,
        lower(COALESCE(NULLIF(display_profiles.name, ''), primary_profiles.name, '')),
        primary_profiles."profileId"
    `.execute(db);

    return {
      people: result.rows
        .map((row) => ({
          id: row.id,
          name: row.name ?? '',
          primaryProfile:
            row.profileType === 'space-person'
              ? { type: row.profileType, id: row.profileId, spaceId: row.spaceId ?? undefined }
              : { type: row.profileType, id: row.profileId },
        }))
        .filter((person) => person.name !== ''),
      hasUnnamedPeople: result.rows.some((row) => !row.name),
    };
  }

  private async getFilteredRatings(userIds: string[], options: FilterSuggestionsOptions): Promise<number[]> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);
    const res = await this.db
      .selectFrom('asset_exif')
      .select('rating')
      .distinct()
      .where('assetId', 'in', filteredIds)
      .where('rating', 'is not', null)
      .where('rating', '>', 0)
      .orderBy('rating')
      .execute();
    return res.map((row) => row.rating!);
  }

  private async getFilteredMediaTypes(userIds: string[], options: FilterSuggestionsOptions): Promise<string[]> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);
    const res = await this.db
      .selectFrom('asset')
      .select('type')
      .distinct()
      .where('id', 'in', filteredIds)
      .orderBy('type')
      .execute();
    return res.map((row) => row.type);
  }
}
