import { Embedding, EmbeddingSearch, ISmartInfoRepository } from '@app/domain';
import { getCLIPModelInfo } from '@app/domain/smart-info/smart-info.constant';
import { DatabaseLock, RequireLock, asyncLock } from '@app/infra';
import { AssetEntity, AssetFaceEntity, SmartInfoEntity, SmartSearchEntity } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DummyValue, GenerateSql } from '../infra.util';
import { asVector, isValidInteger } from '../infra.utils';

@Injectable()
export class SmartInfoRepository implements ISmartInfoRepository {
  private logger = new ImmichLogger(SmartInfoRepository.name);
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
    if (dimSize == null) {
      throw new Error(`Invalid CLIP model name: ${modelName}`);
    }

    const curDimSize = await this.getDimSize();
    this.logger.verbose(`Current database CLIP dimension size is ${curDimSize}`);

    if (dimSize != curDimSize) {
      this.logger.log(`Dimension size of model ${modelName} is ${dimSize}, but database expects ${curDimSize}.`);
      await this.updateDimSize(dimSize);
    }
  }

  @GenerateSql({
    params: [{ ownerId: DummyValue.UUID, embedding: Array.from({ length: 512 }, Math.random), numResults: 100 }],
  })
  async searchCLIP({ ownerId, embedding, numResults }: EmbeddingSearch): Promise<AssetEntity[]> {
    if (!isValidInteger(numResults, { min: 1 })) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    let results: AssetEntity[] = [];
    await this.assetRepository.manager.transaction(async (manager) => {
      await manager.query(`SET LOCAL vectors.k = '${numResults}'`);
      results = await manager
        .createQueryBuilder(AssetEntity, 'a')
        .innerJoin('a.smartSearch', 's')
        .where('a.ownerId = :ownerId')
        .leftJoinAndSelect('a.exifInfo', 'e')
        .orderBy('s.embedding <=> :embedding')
        .setParameters({ ownerId, embedding: asVector(embedding) })
        .limit(numResults)
        .getMany();
    });

    return results;
  }

  @GenerateSql({
    params: [
      {
        ownerId: DummyValue.UUID,
        embedding: Array.from({ length: 512 }, Math.random),
        numResults: 100,
        maxDistance: 0.6,
      },
    ],
  })
  async searchFaces({ ownerId, embedding, numResults, maxDistance }: EmbeddingSearch): Promise<AssetFaceEntity[]> {
    if (!isValidInteger(numResults, { min: 1 })) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    let results: AssetFaceEntity[] = [];
    await this.assetRepository.manager.transaction(async (manager) => {
      await manager.query(`SET LOCAL vectors.k = '${numResults}'`);
      const cte = manager
        .createQueryBuilder(AssetFaceEntity, 'faces')
        .select('1 + (faces.embedding <=> :embedding)', 'distance')
        .innerJoin('faces.asset', 'asset')
        .where('asset.ownerId = :ownerId')
        .orderBy('1 + (faces.embedding <=> :embedding)')
        .setParameters({ ownerId, embedding: asVector(embedding) })
        .limit(numResults);

      this.faceColumns.forEach((col) => cte.addSelect(`faces.${col}`, col));

      results = await manager
        .createQueryBuilder()
        .select('res.*')
        .addCommonTableExpression(cte, 'cte')
        .from('cte', 'res')
        .where('res.distance <= :maxDistance', { maxDistance })
        .getRawMany();
    });

    return this.assetFaceRepository.create(results);
  }

  async upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void> {
    await this.repository.upsert(smartInfo, { conflictPaths: ['assetId'] });
    if (!smartInfo.assetId || !embedding) {
      return;
    }

    await this.upsertEmbedding(smartInfo.assetId, embedding);
  }

  private async upsertEmbedding(assetId: string, embedding: number[]): Promise<void> {
    if (asyncLock.isBusy(DatabaseLock[DatabaseLock.CLIPDimSize])) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await asyncLock.acquire(DatabaseLock[DatabaseLock.CLIPDimSize], () => {});
    }

    await this.smartSearchRepository.upsert(
      { assetId, embedding: () => asVector(embedding, true) },
      { conflictPaths: ['assetId'] },
    );
  }

  @RequireLock(DatabaseLock.CLIPDimSize)
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
          USING vectors (embedding cosine_ops) WITH (options = $$
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
}
