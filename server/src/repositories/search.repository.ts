import { Inject, Injectable } from '@nestjs/common';
import { Kysely, OrderByDirectionExpression, sql } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { randomUUID } from 'node:crypto';
import { DB } from 'src/db';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetEntity, searchAssetBuilder } from 'src/entities/asset.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { AssetType } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  AssetDuplicateSearch,
  AssetSearchOptions,
  FaceEmbeddingSearch,
  GetCameraMakesOptions,
  GetCameraModelsOptions,
  GetCitiesOptions,
  GetStatesOptions,
  ISearchRepository,
  SearchPaginationOptions,
  SmartSearchOptions,
} from 'src/interfaces/search.interface';
import { anyUuid, asUuid, asVector } from 'src/utils/database';
import { Paginated } from 'src/utils/pagination';
import { isValidInteger } from 'src/validation';

@Injectable()
export class SearchRepository implements ISearchRepository {
  constructor(
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @InjectKysely() private db: Kysely<DB>,
  ) {
    this.logger.setContext(SearchRepository.name);
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
  async searchMetadata(pagination: SearchPaginationOptions, options: AssetSearchOptions): Paginated<AssetEntity> {
    const orderDirection = (options.orderDirection?.toLowerCase() || 'desc') as OrderByDirectionExpression;
    const items = await searchAssetBuilder(this.db, options)
      .orderBy('assets.fileCreatedAt', orderDirection)
      .limit(pagination.size + 1)
      .offset((pagination.page - 1) * pagination.size)
      .execute();
    const hasNextPage = items.length > pagination.size;
    items.splice(pagination.size);
    return { items: items as any as AssetEntity[], hasNextPage };
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
  searchRandom(size: number, options: AssetSearchOptions): Promise<AssetEntity[]> {
    const uuid = randomUUID();
    const builder = searchAssetBuilder(this.db, options);
    const lessThan = builder.where('assets.id', '<', uuid).orderBy('assets.id').limit(size);
    const greaterThan = builder.where('assets.id', '>', uuid).orderBy('assets.id').limit(size);
    return sql`${lessThan} union all ${greaterThan}`.execute(this.db) as any as Promise<AssetEntity[]>;
  }

  @GenerateSql({
    params: [
      { page: 1, size: 200 },
      {
        takenAfter: DummyValue.DATE,
        embedding: Array.from({ length: 512 }, Math.random),
        lensModel: DummyValue.STRING,
        withStacked: true,
        isFavorite: true,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  async searchSmart(pagination: SearchPaginationOptions, options: SmartSearchOptions): Paginated<AssetEntity> {
    if (!isValidInteger(pagination.size, { min: 1, max: 1000 })) {
      throw new Error(`Invalid value for 'size': ${pagination.size}`);
    }

    const items = (await searchAssetBuilder(this.db, options)
      .innerJoin('smart_search', 'assets.id', 'smart_search.assetId')
      .orderBy(sql`smart_search.embedding <=> ${asVector(options.embedding)}`)
      .limit(pagination.size + 1)
      .offset((pagination.page - 1) * pagination.size)
      .execute()) as any as AssetEntity[];

    const hasNextPage = items.length > pagination.size;
    items.splice(pagination.size);
    return { items, hasNextPage };
  }

  @GenerateSql({
    params: [
      {
        assetId: DummyValue.UUID,
        embedding: Array.from({ length: 512 }, Math.random),
        maxDistance: 0.6,
        type: AssetType.IMAGE,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  searchDuplicates({ assetId, embedding, maxDistance, type, userIds }: AssetDuplicateSearch) {
    const vector = asVector(embedding);
    return this.db
      .with('cte', (qb) =>
        qb
          .selectFrom('assets')
          .select([
            'assets.id as assetId',
            'assets.duplicateId',
            sql<number>`smart_search.embedding <=> ${vector}`.as('distance'),
          ])
          .innerJoin('smart_search', 'assets.id', 'smart_search.assetId')
          .where('assets.ownerId', '=', anyUuid(userIds))
          .where('assets.deletedAt', 'is', null)
          .where('assets.isVisible', '=', true)
          .where('assets.type', '=', type)
          .where('assets.id', '!=', asUuid(assetId))
          .orderBy(sql`smart_search.embedding <=> ${vector}`)
          .limit(64),
      )
      .selectFrom('cte')
      .selectAll()
      .where('cte.distance', '<=', maxDistance as number)
      .execute();
  }

  @GenerateSql({
    params: [
      {
        userIds: [DummyValue.UUID],
        embedding: Array.from({ length: 512 }, Math.random),
        numResults: 10,
        maxDistance: 0.6,
      },
    ],
  })
  searchFaces({ userIds, embedding, numResults, maxDistance, hasPerson }: FaceEmbeddingSearch) {
    if (!isValidInteger(numResults, { min: 1, max: 1000 })) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    const vector = asVector(embedding);
    return this.db
      .with('cte', (qb) =>
        qb
          .selectFrom('asset_faces')
          .select([
            'asset_faces.id',
            'asset_faces.personId',
            sql<number>`face_search.embedding <=> ${vector}`.as('distance'),
          ])
          .innerJoin('assets', 'assets.id', 'asset_faces.assetId')
          .innerJoin('face_search', 'face_search.faceId', 'asset_faces.id')
          .where('assets.ownerId', '=', anyUuid(userIds))
          .where('assets.deletedAt', 'is', null)
          .$if(!!hasPerson, (qb) => qb.where('asset_faces.personId', 'is not', null))
          .orderBy(sql`face_search.embedding <=> ${vector}`)
          .limit(numResults),
      )
      .selectFrom('cte')
      .selectAll()
      .where('cte.distance', '<=', maxDistance)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  searchPlaces(placeName: string): Promise<GeodataPlacesEntity[]> {
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
      .execute() as Promise<GeodataPlacesEntity[]>;
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  getAssetsByCity(userIds: string[]): Promise<AssetEntity[]> {
    return this.db
      .withRecursive('cte', (qb) => {
        const base = qb
          .selectFrom('exif')
          .select(['city', 'assetId'])
          .innerJoin('assets', 'assets.id', 'exif.assetId')
          .where('assets.ownerId', '=', anyUuid(userIds))
          .where('assets.isVisible', '=', true)
          .where('assets.isArchived', '=', false)
          .where('assets.type', '=', 'IMAGE')
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
                .where('assets.isVisible', '=', true)
                .where('assets.isArchived', '=', false)
                .where('assets.type', '=', 'IMAGE')
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
      .select((eb) => eb.fn('to_jsonb', [eb.table('exif')]).as('exifInfo'))
      .orderBy('exif.city')
      .execute() as any as Promise<AssetEntity[]>;
  }

  async upsert(assetId: string, embedding: number[]): Promise<void> {
    const vector = asVector(embedding);
    await this.db
      .insertInto('smart_search')
      .values({ assetId: asUuid(assetId), embedding: vector } as any)
      .onConflict((oc) => oc.column('assetId').doUpdateSet({ embedding: vector } as any))
      .execute();
  }

  async getDimensionSize(): Promise<number> {
    const { rows } = await sql<{ dimsize: number }>`
      select atttypmod as dimsize
      from pg_attribute f
        join pg_class c ON c.oid = f.attrelid
      where c.relkind = 'r'::char
        and f.attnum > 0
        and c.relname = 'smart_search'
        and f.attname = 'embedding'
    `.execute(this.db);

    const dimSize = rows[0]['dimsize'];
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Could not retrieve CLIP dimension size`);
    }
    return dimSize;
  }

  setDimensionSize(dimSize: number): Promise<void> {
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Invalid CLIP dimension size: ${dimSize}`);
    }

    return this.db.transaction().execute(async (trx) => {
      await sql`truncate ${sql.table('smart_search')}`.execute(trx);
      await trx.schema
        .alterTable('smart_search')
        .alterColumn('embedding', (col) => col.setDataType(sql.lit(`vector(${dimSize})`)))
        .execute();
      await sql`reindex index clip_index`.execute(trx);
    });
  }

  async deleteAllSearchEmbeddings(): Promise<void> {
    await sql`truncate ${sql.table('smart_search')}`.execute(this.db);
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
      .where('isVisible', '=', true)
      .where('deletedAt', 'is', null)
      .where(field, 'is not', null);
  }
}
