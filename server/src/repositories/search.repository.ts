import { Injectable } from '@nestjs/common';
import { Kysely, OrderByDirection, Selectable, ShallowDehydrateObject, sql, SqlBool } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetStatus, AssetType, AssetVisibility, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { DB } from 'src/schema';
import { AssetExifTable } from 'src/schema/tables/asset-exif.table';
import { anyUuid, asUuid, searchAssetBuilder, withExifInner } from 'src/utils/database';
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
  SearchOcrOptions &
  SearchSpaceOptions &
  SearchOrderOptions;

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

export interface SpaceScopeOptions {
  spaceId?: string;
  timelineSpaceIds?: string[];
  takenAfter?: Date;
  takenBefore?: Date;
}

export interface GetStatesOptions extends SpaceScopeOptions {
  country?: string;
}

export interface GetCitiesOptions extends GetStatesOptions {
  state?: string;
}

export interface GetCameraModelsOptions extends SpaceScopeOptions {
  make?: string;
  lensModel?: string;
}

export interface GetCameraMakesOptions extends SpaceScopeOptions {
  model?: string;
  lensModel?: string;
}

export interface GetCameraLensModelsOptions extends SpaceScopeOptions {
  make?: string;
  model?: string;
}

export interface FilterSuggestionsOptions extends SpaceScopeOptions {
  personIds?: string[];
  country?: string;
  city?: string;
  make?: string;
  model?: string;
  tagIds?: string[];
  rating?: number;
  mediaType?: AssetType;
  isFavorite?: boolean;
}

export interface FilterSuggestionsResult {
  countries: string[];
  cameraMakes: string[];
  tags: Array<{ id: string; value: string }>;
  people: Array<{ id: string; name: string }>;
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

    const baseQuery = searchAssetBuilder(kysely, { ...options, ratingIsMinimum: true })
      .selectAll('asset')
      .innerJoin('smart_search', 'asset.id', 'smart_search.assetId')
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

  async getCountries(userIds: string[], options?: SpaceScopeOptions): Promise<string[]> {
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
    const res = await this.getExifField('city', userIds, options)
      .$if(!!options.country, (qb) => qb.where('country', '=', options.country!))
      .$if(!!options.state, (qb) => qb.where('state', '=', options.state!))
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
    options?: SpaceScopeOptions,
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

  async getFilterSuggestions(userIds: string[], options: FilterSuggestionsOptions): Promise<FilterSuggestionsResult> {
    const [countries, cameraMakes, tags, peopleResult, ratings, mediaTypes] = await Promise.all([
      this.getFilteredCountries(userIds, without(options, 'country', 'city')),
      this.getFilteredCameraMakes(userIds, without(options, 'make', 'model')),
      this.getFilteredTags(userIds, without(options, 'tagIds')),
      this.getFilteredPeople(userIds, without(options, 'personIds')),
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

  private getExifField<K extends 'city' | 'state' | 'country' | 'make' | 'model' | 'lensModel'>(
    field: K,
    userIds: string[],
    options?: SpaceScopeOptions,
  ) {
    return this.db
      .selectFrom('asset_exif')
      .select(field)
      .distinctOn(field)
      .innerJoin('asset', 'asset.id', 'asset_exif.assetId')
      .$if(!options?.spaceId && !options?.timelineSpaceIds, (qb) => qb.where('ownerId', '=', anyUuid(userIds)))
      .where('visibility', '=', AssetVisibility.Timeline)
      .where('deletedAt', 'is', null)
      .where(field, 'is not', null)
      .where(field, '!=', '' as any)
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
            eb('ownerId', '=', anyUuid(userIds)),
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
      .$if(!!options?.takenBefore, (qb) => qb.where('asset.fileCreatedAt', '<', options!.takenBefore!));
  }

  private buildFilteredAssetIds(userIds: string[], options: FilterSuggestionsOptions) {
    const needsExifJoin = !!(options.country || options.city || options.make || options.model || options.rating);

    return this.db
      .selectFrom('asset')
      .select('asset.id')
      .where('asset.visibility', '=', AssetVisibility.Timeline)
      .where('asset.deletedAt', 'is', null)
      .$if(!options.spaceId && !options.timelineSpaceIds, (qb) => qb.where('asset.ownerId', '=', anyUuid(userIds)))
      .$if(!!options.spaceId && !options.timelineSpaceIds, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', asUuid(options.spaceId!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', asUuid(options.spaceId!)),
            ),
          ]),
        ),
      )
      .$if(!!options.timelineSpaceIds, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.ownerId', '=', anyUuid(userIds)),
            eb.exists(
              eb
                .selectFrom('shared_space_asset')
                .whereRef('shared_space_asset.assetId', '=', 'asset.id')
                .where('shared_space_asset.spaceId', '=', anyUuid(options.timelineSpaceIds!)),
            ),
            eb.exists(
              eb
                .selectFrom('shared_space_library')
                .whereRef('shared_space_library.libraryId', '=', 'asset.libraryId')
                .where('shared_space_library.spaceId', '=', anyUuid(options.timelineSpaceIds!)),
            ),
          ]),
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
          .$if(!!options.rating, (qb) => qb.where('asset_exif.rating', '=', options.rating!)),
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
  ): Promise<{ people: Array<{ id: string; name: string }>; hasUnnamedPeople: boolean }> {
    const filteredIds = this.buildFilteredAssetIds(userIds, options);

    // When spaceId is set, return shared_space_person records (space-specific IDs and names)
    if (options.spaceId) {
      const spacePeople = await this.db
        .selectFrom('shared_space_person')
        .leftJoin('asset_face', 'asset_face.id', 'shared_space_person.representativeFaceId')
        .leftJoin('person', 'person.id', 'asset_face.personId')
        .select(['shared_space_person.id', 'shared_space_person.name'])
        .select('person.name as personalName')
        .where('shared_space_person.spaceId', '=', asUuid(options.spaceId))
        .where('shared_space_person.isHidden', '=', false)
        .where((eb) =>
          eb.exists(
            eb
              .selectFrom('shared_space_person_face')
              .innerJoin('asset_face as af', 'af.id', 'shared_space_person_face.assetFaceId')
              .whereRef('shared_space_person_face.personId', '=', 'shared_space_person.id')
              .where('af.assetId', 'in', filteredIds),
          ),
        )
        .orderBy('shared_space_person.name')
        .execute();

      // Use space person name, fallback to global person name
      const people = spacePeople
        .map((p) => ({
          id: p.id,
          name: p.name || (p as any).personalName || '',
        }))
        .filter((p) => p.name !== '')
        .toSorted((a, b) => a.name.localeCompare(b.name));

      const hasUnnamedPeople = spacePeople.some((p) => !p.name && !(p as any).personalName);

      return { people, hasUnnamedPeople };
    }

    // Global: return person records
    const people = await this.db
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
      .orderBy('person.name')
      .execute();

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
