import {
  AssetSearchOptions,
  DatabaseExtension,
  Embedding,
  FaceEmbeddingSearch,
  FaceSearchResult,
  ISearchRepository,
  Paginated,
  PaginationMode,
  PaginationResult,
  SearchPaginationOptions,
  SmartSearchOptions,
} from '@app/domain';
import { getCLIPModelInfo } from '@app/domain/smart-info/smart-info.constant';
import { AssetEntity, AssetFaceEntity, SmartInfoEntity, SmartSearchEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { vectorExt } from '../database.config';
import { DummyValue, GenerateSql } from '../infra.util';
import { asVector, isValidInteger, paginatedBuilder, searchAssetBuilder } from '../infra.utils';

@Injectable()
export class SearchRepository implements ISearchRepository {
  private logger = new ImmichLogger(SearchRepository.name);
  private faceColumns: string[];

  constructor(
    @InjectRepository(SmartInfoEntity) private repository: Repository<SmartInfoEntity>,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(AssetFaceEntity) private assetFaceRepository: Repository<AssetFaceEntity>,
    @InjectRepository(SmartSearchEntity) private smartSearchRepository: Repository<SmartSearchEntity>,
  ) {
    this.faceColumns = this.assetFaceRepository.manager.connection
      .getMetadata(AssetFaceEntity)
      .ownColumns.map((column) => column.propertyName)
      .filter((propertyName) => propertyName !== 'embedding');
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
    { embedding, userIds, ...options }: SmartSearchOptions,
  ): Paginated<AssetEntity> {
    let results: PaginationResult<AssetEntity> = { items: [], hasNextPage: false };

    await this.assetRepository.manager.transaction(async (manager) => {
      let builder = manager.createQueryBuilder(AssetEntity, 'asset');
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
        .getRawMany();
    });
    return results.map((row) => ({
      face: this.assetFaceRepository.create(row),
      distance: row.distance,
    }));
  }

  async upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void> {
    await this.repository.upsert(smartInfo, { conflictPaths: ['assetId'] });
    if (!smartInfo.assetId || !embedding) {
      return;
    }

    await this.upsertEmbedding(smartInfo.assetId, embedding);
  }

  private async upsertEmbedding(assetId: string, embedding: number[]): Promise<void> {
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
      await manager.query(`DROP TABLE smart_search`);

      await manager.query(`
        CREATE TABLE smart_search (
          "assetId"  uuid PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
          embedding  vector(${dimSize}) NOT NULL )`);

      await manager.query(`
        CREATE INDEX clip_index ON smart_search
          USING vectors (embedding vector_cos_ops) WITH (options = $$
          [indexing.hnsw]
          m = 16
          ef_construction = 300
          $$)`);
    });

    this.logger.log(`Successfully updated database CLIP dimension size from ${curDimSize} to ${dimSize}.`);
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
