import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { vectorExt } from 'src/database.config';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { SmartInfoEntity } from 'src/entities/smart-info.entity';
import { SmartSearchEntity } from 'src/entities/smart-search.entity';
import { DatabaseExtension } from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  AssetDuplicateResult,
  AssetDuplicateSearch,
  AssetSearchOptions,
  FaceEmbeddingSearch,
  FaceSearchResult,
  ISearchRepository,
  SearchPaginationOptions,
  SmartSearchOptions,
} from 'src/interfaces/search.interface';
import { asVector, searchAssetBuilder } from 'src/utils/database';
import { Instrumentation } from 'src/utils/instrumentation';
import { getCLIPModelInfo } from 'src/utils/misc';
import { Paginated, PaginationMode, PaginationResult, paginatedBuilder } from 'src/utils/pagination';
import { isValidInteger } from 'src/validation';
import { Repository, SelectQueryBuilder } from 'typeorm';

@Instrumentation()
@Injectable()
export class SearchRepository implements ISearchRepository {
  private faceColumns: string[];
  private assetsByCityQuery: string;

  constructor(
    @InjectRepository(SmartInfoEntity) private repository: Repository<SmartInfoEntity>,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(SmartSearchEntity) private smartSearchRepository: Repository<SmartSearchEntity>,
    @InjectRepository(GeodataPlacesEntity) private geodataPlacesRepository: Repository<GeodataPlacesEntity>,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(SearchRepository.name);
    this.faceColumns = this.assetFaceRepository.manager.connection
      .getMetadata(AssetFaceEntity)
      .ownColumns.map((column) => column.propertyName)
      .filter((propertyName) => propertyName !== 'embedding');
    this.assetsByCityQuery =
      assetsByCityCte +
      this.assetRepository
        .createQueryBuilder('asset')
        .innerJoinAndSelect('asset.exifInfo', 'exif')
        .withDeleted()
        .getQuery() +
      ' INNER JOIN cte ON asset.id = cte."assetId"';
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
    let builder = this.assetRepository.createQueryBuilder('asset');
    builder = searchAssetBuilder(builder, options);

    builder.orderBy('asset.fileCreatedAt', options.orderDirection ?? 'DESC');
    return paginatedBuilder<AssetEntity>(builder, {
      mode: PaginationMode.SKIP_TAKE,
      skip: (pagination.page - 1) * pagination.size,
      take: pagination.size,
    });
  }

  private createPersonFilter(builder: SelectQueryBuilder<AssetFaceEntity>, personIds: string[]) {
    return builder
      .select(`${builder.alias}."assetId"`)
      .where(`${builder.alias}."personId" IN (:...personIds)`, { personIds })
      .groupBy(`${builder.alias}."assetId"`)
      .having(`COUNT(DISTINCT ${builder.alias}."personId") = :personCount`, { personCount: personIds.length });
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
  async searchSmart(
    pagination: SearchPaginationOptions,
    { embedding, userIds, personIds, ...options }: SmartSearchOptions,
  ): Paginated<AssetEntity> {
    let results: PaginationResult<AssetEntity> = { items: [], hasNextPage: false };

    await this.assetRepository.manager.transaction(async (manager) => {
      let builder = manager.createQueryBuilder(AssetEntity, 'asset');

      if (personIds?.length) {
        const assetFaceBuilder = manager.createQueryBuilder(AssetFaceEntity, 'asset_face');
        const cte = this.createPersonFilter(assetFaceBuilder, personIds);
        builder
          .addCommonTableExpression(cte, 'asset_face_ids')
          .innerJoin('asset_face_ids', 'a', 'a."assetId" = asset.id');
      }

      builder = searchAssetBuilder(builder, options);
      builder
        .innerJoin('asset.smartSearch', 'search')
        .andWhere('asset.ownerId IN (:...userIds )')
        .orderBy('search.embedding <=> :embedding')
        .setParameters({ userIds, embedding: asVector(embedding) });

      await manager.query(this.getRuntimeConfig(pagination.size));
      results = await paginatedBuilder<AssetEntity>(builder, {
        mode: PaginationMode.LIMIT_OFFSET,
        skip: (pagination.page - 1) * pagination.size,
        take: pagination.size,
      });
    });

    return results;
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
    userIds,
  }: AssetDuplicateSearch): Promise<AssetDuplicateResult[]> {
    const cte = this.assetRepository.createQueryBuilder('asset');
    cte
      .select('search.assetId', 'assetId')
      .addSelect('asset.duplicateId', 'duplicateId')
      .addSelect(`search.embedding <=> :embedding`, 'distance')
      .innerJoin('asset.smartSearch', 'search')
      .where('asset.ownerId IN (:...userIds )')
      .andWhere('asset.id != :assetId')
      .andWhere('asset.isVisible = :isVisible')
      .orderBy('search.embedding <=> :embedding')
      .limit(64)
      .setParameters({ assetId, embedding: asVector(embedding), isVisible: true, userIds });

    const builder = this.assetRepository.manager
      .createQueryBuilder()
      .addCommonTableExpression(cte, 'cte')
      .from('cte', 'res')
      .select('res.*')
      .where('res.distance <= :maxDistance', { maxDistance });

    return builder.getRawMany() as any as Promise<AssetDuplicateResult[]>;
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
  async searchFaces({
    userIds,
    embedding,
    numResults,
    maxDistance,
    hasPerson,
  }: FaceEmbeddingSearch): Promise<FaceSearchResult[]> {
    if (!isValidInteger(numResults, { min: 1 })) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    // setting this too low messes with prefilter recall
    numResults = Math.max(numResults, 64);

    let results: Array<AssetFaceEntity & { distance: number }> = [];
    await this.assetRepository.manager.transaction(async (manager) => {
      const cte = manager
        .createQueryBuilder(AssetFaceEntity, 'faces')
        .select('faces.embedding <=> :embedding', 'distance')
        .innerJoin('faces.asset', 'asset')
        .where('asset.ownerId IN (:...userIds )')
        .orderBy('faces.embedding <=> :embedding')
        .setParameters({ userIds, embedding: asVector(embedding) });

      cte.limit(numResults);

      if (hasPerson) {
        cte.andWhere('faces."personId" IS NOT NULL');
      }

      for (const col of this.faceColumns) {
        cte.addSelect(`faces.${col}`, col);
      }

      await manager.query(this.getRuntimeConfig(numResults));
      results = await manager
        .createQueryBuilder()
        .select('res.*')
        .addCommonTableExpression(cte, 'cte')
        .from('cte', 'res')
        .where('res.distance <= :maxDistance', { maxDistance })
        .orderBy('res.distance')
        .getRawMany();
    });
    return results.map((row) => ({
      face: this.assetFaceRepository.create(row),
      distance: row.distance,
    }));
  }

  @GenerateSql({ params: [DummyValue.STRING] })
  async searchPlaces(placeName: string): Promise<GeodataPlacesEntity[]> {
    return await this.geodataPlacesRepository
      .createQueryBuilder('geoplaces')
      .where(`f_unaccent(name) %>> f_unaccent(:placeName)`)
      .orWhere(`f_unaccent("admin2Name") %>> f_unaccent(:placeName)`)
      .orWhere(`f_unaccent("admin1Name") %>> f_unaccent(:placeName)`)
      .orWhere(`f_unaccent("alternateNames") %>> f_unaccent(:placeName)`)
      .orderBy(
        `
        COALESCE(f_unaccent(name) <->>> f_unaccent(:placeName), 0.1) +
        COALESCE(f_unaccent("admin2Name") <->>> f_unaccent(:placeName), 0.1) +
        COALESCE(f_unaccent("admin1Name") <->>> f_unaccent(:placeName), 0.1) +
        COALESCE(f_unaccent("alternateNames") <->>> f_unaccent(:placeName), 0.1)
        `,
      )
      .setParameters({ placeName })
      .limit(20)
      .getMany();
  }

  @GenerateSql({ params: [[DummyValue.UUID]] })
  async getAssetsByCity(userIds: string[]): Promise<AssetEntity[]> {
    const parameters = [userIds, true, false, AssetType.IMAGE];
    const rawRes = await this.repository.query(this.assetsByCityQuery, parameters);

    const items: AssetEntity[] = [];
    for (const res of rawRes) {
      const item = { exifInfo: {} as Record<string, any> } as Record<string, any>;
      for (const [key, value] of Object.entries(res)) {
        if (key.startsWith('exif_')) {
          item.exifInfo[key.replace('exif_', '')] = value;
        } else {
          item[key.replace('asset_', '')] = value;
        }
      }
      items.push(item as AssetEntity);
    }

    return items;
  }

  async upsert(assetId: string, embedding: number[]): Promise<void> {
    await this.smartSearchRepository.upsert(
      { assetId, embedding: () => asVector(embedding, true) },
      { conflictPaths: ['assetId'] },
    );
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

    await this.smartSearchRepository.manager.transaction(async (manager) => {
      await manager.clear(SmartSearchEntity);
      await manager.query(`ALTER TABLE smart_search ALTER COLUMN embedding SET DATA TYPE vector(${dimSize})`);
    });

    this.logger.log(`Successfully updated database CLIP dimension size from ${curDimSize} to ${dimSize}.`);
  }

  deleteAllSearchEmbeddings(): Promise<void> {
    return this.smartSearchRepository.clear();
  }

  private async getDimSize(): Promise<number> {
    const res = await this.smartSearchRepository.manager.query(`
      SELECT atttypmod as dimsize
      FROM pg_attribute f
        JOIN pg_class c ON c.oid = f.attrelid
      WHERE c.relkind = 'r'::char
        AND f.attnum > 0
        AND c.relname = 'smart_search'
        AND f.attname = 'embedding'`);

    const dimSize = res[0]['dimsize'];
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Could not retrieve CLIP dimension size`);
    }
    return dimSize;
  }

  private getRuntimeConfig(numResults?: number): string {
    if (vectorExt === DatabaseExtension.VECTOR) {
      return 'SET LOCAL hnsw.ef_search = 1000;'; // mitigate post-filter recall
    }

    let runtimeConfig = 'SET LOCAL vectors.enable_prefilter=on; SET LOCAL vectors.search_mode=vbase;';
    if (numResults) {
      runtimeConfig += ` SET LOCAL vectors.hnsw_ef_search = ${numResults};`;
    }

    return runtimeConfig;
  }
}

// the performance difference between this and the normal way is too huge to ignore, e.g. 3s vs 4ms
const assetsByCityCte = `
WITH RECURSIVE cte AS (
  (
    SELECT city, "assetId"
    FROM exif
    INNER JOIN assets ON exif."assetId" = assets.id
    WHERE "ownerId" = ANY($1::uuid[]) AND "isVisible" = $2 AND "isArchived" = $3 AND type = $4
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
    WHERE city > c.city AND "ownerId" = ANY($1::uuid[]) AND "isVisible" = $2 AND "isArchived" = $3 AND type = $4
    ORDER BY city
    LIMIT 1
    ) l
)
`;
