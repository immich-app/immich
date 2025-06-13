import { Injectable } from '@nestjs/common';
import { Kysely, OrderByDirection, Selectable, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { randomUUID } from 'node:crypto';
import { DB, Exif } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { MapAsset } from 'src/dtos/asset-response.dto';
import { AssetStatus, AssetType, AssetVisibility, VectorIndex } from 'src/enum';
import { probes } from 'src/repositories/database.repository';
import { anyUuid, searchAssetBuilder } from 'src/utils/database';
import { paginationHelper } from 'src/utils/pagination';
import { isValidInteger } from 'src/validation';

export interface SearchAssetIdOptions {
  checksum?: Buffer;
  deviceAssetId?: string;
  id?: string;
}

export interface SearchUserIdOptions {
  deviceId?: string;
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

export interface SearchPeopleOptions {
  personIds?: string[];
}

export interface SearchTagOptions {
  tagIds?: string[];
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
  SearchAlbumOptions;

export type AssetSearchOptions = BaseAssetSearchOptions & SearchRelationOptions;

export type AssetSearchBuilderOptions = Omit<AssetSearchOptions, 'orderDirection'>;

export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions &
  SearchTagOptions;

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
}

export interface GetCameraMakesOptions {
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
    const items = await searchAssetBuilder(this.db, options)
      .selectAll('assets')
      .orderBy('assets.fileCreatedAt', orderDirection)
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
    const uuid = randomUUID();
    const builder = searchAssetBuilder(this.db, options);
    const lessThan = builder
      .selectAll('assets')
      .where('assets.id', '<', uuid)
      .orderBy(sql`random()`)
      .limit(size);
    const greaterThan = builder
      .selectAll('assets')
      .where('assets.id', '>', uuid)
      .orderBy(sql`random()`)
      .limit(size);
    const { rows } = await sql<MapAsset>`${lessThan} union all ${greaterThan} limit ${size}`.execute(this.db);
    return rows;
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
    if (!isValidInteger(pagination.size, { min: 1, max: 1000 })) {
      throw new Error(`Invalid value for 'size': ${pagination.size}`);
    }

    return this.db.transaction().execute(async (trx) => {
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.CLIP])}`.execute(trx);
      const items = await searchAssetBuilder(trx, options)
        .selectAll('assets')
        .innerJoin('smart_search', 'assets.id', 'smart_search.assetId')
        .orderBy(sql`smart_search.embedding <=> ${options.embedding}`)
        .limit(pagination.size + 1)
        .offset((pagination.page - 1) * pagination.size)
        .execute();
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
      await sql`set local vchordrq.probes = ${sql.lit(probes[VectorIndex.FACE])}`.execute(trx);
      return await trx
        .with('cte', (qb) =>
          qb
            .selectFrom('asset_faces')
            .select([
              'asset_faces.id',
              'asset_faces.personId',
              sql<number>`face_search.embedding <=> ${embedding}`.as('distance'),
            ])
            .innerJoin('assets', 'assets.id', 'asset_faces.assetId')
            .innerJoin('face_search', 'face_search.faceId', 'asset_faces.id')
            .leftJoin('person', 'person.id', 'asset_faces.personId')
            .where('assets.ownerId', '=', anyUuid(userIds))
            .where('assets.deletedAt', 'is', null)
            .$if(!!hasPerson, (qb) => qb.where('asset_faces.personId', 'is not', null))
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
          .selectFrom('exif')
          .select(['city', 'assetId'])
          .innerJoin('assets', 'assets.id', 'exif.assetId')
          .where('assets.ownerId', '=', anyUuid(userIds))
          .where('assets.visibility', '=', AssetVisibility.TIMELINE)
          .where('assets.type', '=', AssetType.IMAGE)
          .where('assets.deletedAt', 'is', null)
          .orderBy('city')
          .limit(1);

        const recursive = qb
          .selectFrom('cte')
          .select(['l.city', 'l.assetId'])
          .innerJoinLateral(
            (qb) =>
              qb
                .selectFrom('exif')
                .select(['city', 'assetId'])
                .innerJoin('assets', 'assets.id', 'exif.assetId')
                .where('assets.ownerId', '=', anyUuid(userIds))
                .where('assets.visibility', '=', AssetVisibility.TIMELINE)
                .where('assets.type', '=', AssetType.IMAGE)
                .where('assets.deletedAt', 'is', null)
                .whereRef('exif.city', '>', 'cte.city')
                .orderBy('city')
                .limit(1)
                .as('l'),
            (join) => join.onTrue(),
          );

        return sql<{ city: string; assetId: string }>`(${base} union all ${recursive})`;
      })
      .selectFrom('assets')
      .innerJoin('exif', 'assets.id', 'exif.assetId')
      .innerJoin('cte', 'assets.id', 'cte.assetId')
      .selectAll('assets')
      .select((eb) =>
        eb
          .fn('to_jsonb', [eb.table('exif')])
          .$castTo<Selectable<Exif>>()
          .as('exifInfo'),
      )
      .orderBy('exif.city')
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

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING] })
  async getCameraMakes(userIds: string[], { model }: GetCameraMakesOptions): Promise<string[]> {
    const res = await this.getExifField('make', userIds)
      .$if(!!model, (qb) => qb.where('model', '=', model!))
      .execute();

    return res.map((row) => row.make!);
  }

  @GenerateSql({ params: [[DummyValue.UUID], DummyValue.STRING] })
  async getCameraModels(userIds: string[], { make }: GetCameraModelsOptions): Promise<string[]> {
    const res = await this.getExifField('model', userIds)
      .$if(!!make, (qb) => qb.where('make', '=', make!))
      .execute();

    return res.map((row) => row.model!);
  }

  private getExifField<K extends 'city' | 'state' | 'country' | 'make' | 'model'>(field: K, userIds: string[]) {
    return this.db
      .selectFrom('exif')
      .select(field)
      .distinctOn(field)
      .innerJoin('assets', 'assets.id', 'exif.assetId')
      .where('ownerId', '=', anyUuid(userIds))
      .where('visibility', '=', AssetVisibility.TIMELINE)
      .where('deletedAt', 'is', null)
      .where(field, 'is not', null);
  }
}
