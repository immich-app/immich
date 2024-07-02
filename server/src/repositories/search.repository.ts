import { Inject, Injectable } from '@nestjs/common';
import { Kysely, OrderByDirectionExpression, sql } from 'kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  AssetDuplicateResult,
  AssetDuplicateSearch,
  AssetSearchBuilderOptions,
  AssetSearchOptions,
  FaceEmbeddingSearch,
  FaceSearchResult,
  ISearchRepository,
  SearchPaginationOptions,
  SmartSearchOptions,
} from 'src/interfaces/search.interface';
import { DB } from 'src/prisma/generated/types';
import { PrismaRepository } from 'src/repositories/prisma.repository';
import { asVector, withExif, withFaces, withPeople, withSmartInfo } from 'src/utils/database';
import { Instrumentation } from 'src/utils/instrumentation';
import { getCLIPModelInfo } from 'src/utils/misc';
import { Paginated } from 'src/utils/pagination';
import { isValidInteger } from 'src/validation';

@Instrumentation()
@Injectable()
export class SearchRepository implements ISearchRepository {
  constructor(
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    private prismaRepository: PrismaRepository,
  ) {
    this.logger.setContext(SearchRepository.name);
  }

  async init(modelName: string): Promise<void> {
    const { dimSize } = getCLIPModelInfo(modelName);
    const curDimSize = await this.getDimSize();
    this.logger.verbose(`Current database CLIP dimension size is ${curDimSize}`);

    if (dimSize != curDimSize) {
      this.logger.log(`Dimension size of model ${modelName} is ${dimSize}, but database expects ${curDimSize}.`);
      await this.updateDimSize(dimSize);
    }
  }

  @GenerateSql({
    params: [
      { page: 1, size: 100 },
      {
        takenAfter: DummyValue.DATE,
        lensModel: DummyValue.STRING,
        ownerId: DummyValue.UUID,
        withStacked: true,
        isFavorite: true,
        ownerIds: [DummyValue.UUID],
      },
    ],
  })
  async searchMetadata(pagination: SearchPaginationOptions, options: AssetSearchOptions): Paginated<AssetEntity> {
    const orderDirection = (options.orderDirection?.toLowerCase() || 'desc') as OrderByDirectionExpression;
    const builder = this.searchAssetBuilder(options)
      .orderBy('assets.fileCreatedAt', orderDirection)
      .limit(pagination.size + 1)
      .offset((pagination.page - 1) * pagination.size);

    const items = (await builder.execute()) as any as AssetEntity[];
    const hasNextPage = items.length > pagination.size;
    items.splice(pagination.size);
    return { items, hasNextPage };
  }

  @GenerateSql({
    params: [
      { page: 1, size: 100 },
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

    let items: AssetEntity[] = [];
    await this.prismaRepository.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SET LOCAL vectors.hnsw_ef_search = ${pagination.size + 1}`);
      const builder = this.searchAssetBuilder(options, tx.$kysely)
        .innerJoin('smart_search', 'assets.id', 'smart_search.assetId')
        .orderBy(sql`smart_search.embedding <=> ${asVector(options.embedding)}::vector`)
        .limit(pagination.size + 1)
        .offset((pagination.page - 1) * pagination.size);

      items = (await builder.execute()) as any as AssetEntity[];
    });

    const hasNextPage = items.length > pagination.size;
    items.splice(pagination.size);
    return { items, hasNextPage };
  }

  @GenerateSql({
    params: [
      {
        embedding: Array.from({ length: 512 }, Math.random),
        maxDistance: 0.6,
        userIds: [DummyValue.UUID],
      },
    ],
  })
  searchDuplicates({
    assetId,
    embedding,
    maxDistance,
    type,
    userIds,
  }: AssetDuplicateSearch): Promise<AssetDuplicateResult[]> {
    const vector = asVector(embedding);
    return this.prismaRepository.$kysely
      .with('cte', (qb) =>
        qb
          .selectFrom('assets')
          .select([
            'assets.id as assetId',
            'assets.duplicateId',
            sql<number>`smart_search.embedding <=> ${vector}::vector`.as('distance'),
          ])
          .innerJoin('smart_search', 'assets.id', 'smart_search.assetId')
          .where('assets.ownerId', '=', sql<string>`ANY(ARRAY[${userIds}]::uuid[])`)
          .where('assets.isVisible', '=', true)
          .where('assets.type', '=', type)
          .where('assets.id', '!=', assetId)
          .orderBy(sql`smart_search.embedding <=> ${vector}::vector`)
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
        numResults: 100,
        maxDistance: 0.6,
      },
    ],
  })
  searchFaces({
    userIds,
    embedding,
    numResults,
    maxDistance,
    hasPerson,
  }: FaceEmbeddingSearch): Promise<FaceSearchResult[]> {
    if (!isValidInteger(numResults, { min: 1, max: 1000 })) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    // setting this too low messes with prefilter recall
    numResults = Math.max(numResults, 64);
    const vector = asVector(embedding);
    return this.prismaRepository.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SET LOCAL vectors.hnsw_ef_search = ${numResults}`);
      return tx.$kysely
        .with('cte', (qb) =>
          qb
            .selectFrom('asset_faces')
            .select([
              (eb) => eb.fn.toJson(sql`asset_faces.*`).as('face'),
              sql<number>`asset_faces.embedding <=> ${vector}::vector`.as('distance'),
            ])
            .innerJoin('assets', 'assets.id', 'asset_faces.assetId')
            .where('assets.ownerId', '=', sql<string>`ANY(ARRAY[${userIds}]::uuid[])`)
            .$if(!!hasPerson, (qb) => qb.where('asset_faces.personId', 'is not', null))
            .orderBy(sql`asset_faces.embedding <=> ${vector}::vector`)
            .limit(numResults),
        )
        .selectFrom('cte')
        .selectAll()
        .where('cte.distance', '<=', maxDistance)
        .execute() as any as Array<{ face: AssetFaceEntity; distance: number }>;
    });
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  searchPlaces(placeName: string): Promise<GeodataPlacesEntity[]> {
    const contains = '%>>' as any as 'ilike';
    return this.prismaRepository.$kysely
      .selectFrom('geodata_places')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb(eb.fn('f_unaccent', ['name']), contains, eb.fn('f_unaccent', [eb.val(placeName)])),
          eb(eb.fn('f_unaccent', ['admin2Name']), contains, eb.fn('f_unaccent', [eb.val(placeName)])),
          eb(eb.fn('f_unaccent', ['admin1Name']), contains, eb.fn('f_unaccent', [eb.val(placeName)])),
          eb(eb.fn('f_unaccent', ['alternateNames']), contains, eb.fn('f_unaccent', [eb.val(placeName)])),
        ]),
      )
      .orderBy(
        sql`
          COALESCE(f_unaccent(name) <->>> f_unaccent(${placeName}), 0.1) +
          COALESCE(f_unaccent("admin2Name") <->>> f_unaccent(${placeName}), 0.1) +
          COALESCE(f_unaccent("admin1Name") <->>> f_unaccent(${placeName}), 0.1) +
          COALESCE(f_unaccent("alternateNames") <->>> f_unaccent(${placeName}), 0.1)
        `,
      )
      .limit(20)
      .execute() as Promise<GeodataPlacesEntity[]>;
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  getAssetsByCity(userIds: string[]): Promise<AssetEntity[]> {
    // the performance difference between this and the normal way is too huge to ignore, e.g. 3s vs 4ms
    return this.prismaRepository.$queryRaw`WITH RECURSIVE cte AS (
        (
          SELECT city, "assetId"
          FROM exif
          INNER JOIN assets ON exif."assetId" = assets.id
          WHERE "ownerId" = ANY(ARRAY[${userIds}]::uuid[]) AND "isVisible" = true AND "isArchived" = false AND type = 'IMAGE'
          ORDER BY city
          LIMIT 1
        )

        UNION ALL

        SELECT l.city, l."assetId"
        FROM cte c
          , LATERAL (
          SELECT city, "assetId"
          FROM exif
          INNER JOIN assets ON exif."assetId" = assets.id
          WHERE city > c.city AND "ownerId" = ANY(ARRAY[${userIds}]::uuid[]) AND "isVisible" = true AND "isArchived" = false AND type = 'IMAGE'
          ORDER BY city
          LIMIT 1
          ) l
      )
      select "assets".*, json_strip_nulls(to_json(exif.*)) as "exifInfo"
      from "assets"
      inner join "exif" on "assets"."id" = "exif"."assetId"
      inner join "cte" on "assets"."id" = "cte"."assetId"`;
  }

  async upsert(assetId: string, embedding: number[]): Promise<void> {
    await this.prismaRepository.$kysely
      .insertInto('smart_search')
      .values({ assetId, embedding: asVector(embedding, true) } as any)
      .onConflict((oc) => oc.column('assetId').doUpdateSet({ embedding: asVector(embedding, true) } as any))
      .execute();
  }

  private async updateDimSize(dimSize: number): Promise<void> {
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Invalid CLIP dimension size: ${dimSize}`);
    }

    const curDimSize = await this.getDimSize();
    if (curDimSize === dimSize) {
      return;
    }

    this.logger.log(`Updating database CLIP dimension size to ${dimSize}.`);

    await this.prismaRepository.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`TRUNCATE smart_search`);
      await tx.$queryRawUnsafe(`ALTER TABLE smart_search ALTER COLUMN embedding SET DATA TYPE vector(${dimSize})`);
      await tx.$queryRawUnsafe(`REINDEX INDEX clip_index`);
    });

    this.logger.log(`Successfully updated database CLIP dimension size from ${curDimSize} to ${dimSize}.`);
  }

  deleteAllSearchEmbeddings(): Promise<void> {
    return this.prismaRepository.$queryRawUnsafe(`TRUNCATE smart_search`);
  }

  private async getDimSize(): Promise<number> {
    const res = await this.prismaRepository.$queryRaw<[{ dimsize: number }]>`
      SELECT atttypmod as dimsize
      FROM pg_attribute f
        JOIN pg_class c ON c.oid = f.attrelid
      WHERE c.relkind = 'r'::char
        AND f.attnum > 0
        AND c.relname = 'smart_search'
        AND f.attname = 'embedding'`;

    const dimSize = res[0]['dimsize'];
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Could not retrieve CLIP dimension size`);
    }
    return dimSize;
  }

  private searchAssetBuilder(options: AssetSearchBuilderOptions, kysely: Kysely<DB> = this.prismaRepository.$kysely) {
    options.isArchived ??= options.withArchived ? undefined : false;
    options.withDeleted ??= !!(options.trashedAfter || options.trashedBefore);
    const query = kysely
      .selectFrom('assets')
      .selectAll('assets')
      .$if(!!options.createdBefore, (qb) => qb.where('assets.createdAt', '<=', options.createdBefore as Date))
      .$if(!!options.createdAfter, (qb) => qb.where('assets.createdAt', '>=', options.createdAfter as Date))
      .$if(!!options.updatedBefore, (qb) => qb.where('assets.updatedAt', '<=', options.updatedBefore as Date))
      .$if(!!options.updatedAfter, (qb) => qb.where('assets.updatedAt', '>=', options.updatedAfter as Date))
      .$if(!!options.trashedBefore, (qb) => qb.where('assets.deletedAt', '<=', options.trashedBefore as Date))
      .$if(!!options.trashedAfter, (qb) => qb.where('assets.deletedAt', '>=', options.trashedAfter as Date))
      .$if(!!options.takenBefore, (qb) => qb.where('assets.fileCreatedAt', '<=', options.takenBefore as Date))
      .$if(!!options.takenAfter, (qb) => qb.where('assets.fileCreatedAt', '>=', options.takenAfter as Date))
      .$if(!!options.city, (qb) =>
        qb.leftJoin('exif', 'exif.assetId', 'assets.id').where('exif.city', '=', options.city as string),
      )
      .$if(!!options.country, (qb) =>
        qb.leftJoin('exif', 'exif.assetId', 'assets.id').where('exif.country', '=', options.country as string),
      )
      .$if(!!options.lensModel, (qb) =>
        qb.leftJoin('exif', 'exif.assetId', 'assets.id').where('exif.lensModel', '=', options.lensModel as string),
      )
      .$if(!!options.make, (qb) =>
        qb.leftJoin('exif', 'exif.assetId', 'assets.id').where('exif.make', '=', options.make as string),
      )
      .$if(!!options.model, (qb) =>
        qb.leftJoin('exif', 'exif.assetId', 'assets.id').where('exif.model', '=', options.model as string),
      )
      .$if(!!options.state, (qb) =>
        qb.leftJoin('exif', 'exif.assetId', 'assets.id').where('exif.state', '=', options.state as string),
      )
      .$if(!!options.checksum, (qb) => qb.where('assets.checksum', '=', options.checksum as Buffer))
      .$if(!!options.deviceAssetId, (qb) => qb.where('assets.deviceAssetId', '=', options.deviceAssetId as string))
      .$if(!!options.deviceId, (qb) => qb.where('assets.deviceId', '=', options.deviceId as string))
      .$if(!!options.id, (qb) => qb.where('assets.id', '=', options.id as string))
      .$if(!!options.libraryId, (qb) => qb.where('assets.libraryId', '=', options.libraryId as string))
      .$if(!!options.userIds, (qb) =>
        qb.where('assets.ownerId', '=', sql<string>`ANY(ARRAY[${options.userIds}]::uuid[])`),
      )
      .$if(!!options.encodedVideoPath, (qb) =>
        qb.where('assets.encodedVideoPath', '=', options.encodedVideoPath as string),
      )
      .$if(!!options.originalPath, (qb) => qb.where('assets.originalPath', '=', options.originalPath as string))
      .$if(!!options.previewPath, (qb) => qb.where('assets.previewPath', '=', options.previewPath as string))
      .$if(!!options.thumbnailPath, (qb) => qb.where('assets.thumbnailPath', '=', options.thumbnailPath as string))
      .$if(!!options.originalFileName, (qb) =>
        qb.where(sql`f_unaccent(assets.originalFileName)`, 'ilike', sql`f_unaccent(${options.originalFileName})`),
      )
      .$if(!!options.isFavorite, (qb) => qb.where('assets.isFavorite', '=', options.isFavorite as boolean))
      .$if(!!options.isOffline, (qb) => qb.where('assets.isOffline', '=', options.isOffline as boolean))
      .$if(!!options.isVisible, (qb) => qb.where('assets.isVisible', '=', options.isVisible as boolean))
      .$if(!!options.type, (qb) => qb.where('assets.type', '=', options.type as AssetType))
      .$if(!!options.isArchived, (qb) => qb.where('assets.isArchived', '=', options.isArchived as boolean))
      .$if(!!options.isEncoded, (qb) => qb.where('assets.encodedVideoPath', 'is not', null))
      .$if(!!options.isMotion, (qb) => qb.where('assets.livePhotoVideoId', 'is not', null))
      .$if(!!options.isNotInAlbum, (qb) =>
        qb
          .leftJoin('albums_assets_assets', 'albums_assets_assets.assetsId', 'assets.id')
          .where('albums_assets_assets.assetsId', 'is', null),
      )
      .$if(!!options.withExif, (qb) => qb.select((eb) => withExif(eb)))
      .$if(!!options.withSmartInfo, (qb) => qb.select((eb) => withSmartInfo(eb)))
      .$if(!(!options.withFaces || options.withPeople), (qb) =>
        qb.select((eb) => withFaces(eb)).$if(!!options.withPeople, (qb) => qb.select((eb) => withPeople(eb) as any)),
      )
      .$if(!!options.personIds && options.personIds.length > 0, (qb) =>
        qb.innerJoin(
          (eb: any) =>
            eb
              .selectFrom('asset_faces')
              .select('asset_faces.assetId')
              .where('asset_faces.personId', '=', sql`ANY(ARRAY[${options.personIds}]::uuid[])`)
              .groupBy('asset_faces.assetId')
              .having(
                (eb: any) => eb.fn.count('asset_faces.personId').distinct(),
                '=',
                (options.personIds as string[]).length,
              )
              .as('personAssetIds'),
          (join) => join.onRef('personAssetIds.assetId' as any, '=', 'assets.id' as any),
        ),
      )
      .$if(!options.withDeleted, (qb) => qb.where('assets.deletedAt', 'is', null));
    return query;
  }
}
