import { Embedding, EmbeddingSearch, ISmartInfoRepository } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import { Repository } from 'typeorm';
import { AssetEntity, SmartInfoEntity, SmartSearchEntity } from '../entities';
import { asVector, isValidInteger } from '../infra.utils';

@Injectable()
export class SmartInfoRepository implements ISmartInfoRepository {
  private logger = new Logger(SmartInfoRepository.name);
  private lock: AsyncLock;
  private curDimSize: number | undefined;

  constructor(
    @InjectRepository(SmartInfoEntity) private repository: Repository<SmartInfoEntity>,
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(SmartSearchEntity) private smartSearchRepository: Repository<SmartSearchEntity>,
  ) {
    this.lock = new AsyncLock();
  }

  async searchByEmbedding({ ownerId, embedding, numResults }: EmbeddingSearch): Promise<AssetEntity[]> {
    if (!isValidInteger(numResults, { min: 1 })) {
      throw new Error(`Invalid value for 'numResults': ${numResults}`);
    }

    let results: AssetEntity[] = [];
    this.assetRepository.manager.transaction(async (manager) => {
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

  async upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void> {
    await this.repository.upsert(smartInfo, { conflictPaths: ['assetId'] });
    if (!smartInfo.assetId || !embedding) return;

    try {
      await this.upsertEmbedding(smartInfo.assetId, embedding);
    } catch (e) {
      await this.updateDimSize(embedding.length);
      await this.upsertEmbedding(smartInfo.assetId, embedding);
    }
  }

  private async upsertEmbedding(assetId: string, embedding: number[]): Promise<void> {
    if (this.lock.isBusy('updateDimSizeLock')) {
      this.logger.log('Waiting for CLIP dimension size update to finish');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return this.upsertEmbedding(assetId, embedding);
    }

    await this.smartSearchRepository.upsert(
      { assetId, embedding: () => asVector(embedding, true) },
      { conflictPaths: ['assetId'] },
    );
  }

  /*
   * note: never use this with user input
   * this does not parameterize the query because it is not possible to parameterize the column type
   */
  private async updateDimSize(dimSize: number): Promise<void> {
    if (!isValidInteger(dimSize, { min: 1, max: 2 ** 16 })) {
      throw new Error(`Invalid CLIP dimension size: ${dimSize}`);
    }

    await this.lock.acquire('updateDimSizeLock', async () => {
      if (this.curDimSize === dimSize) return;

      this.logger.log(`Updating CLIP dimension size to ${dimSize}`);

      try {
        await this.smartSearchRepository.manager.query(`
        BEGIN;

        ALTER TABLE smart_search
        DROP COLUMN embedding,
        ADD COLUMN embedding vector(${dimSize});

        CREATE INDEX clip_index ON smart_search
        USING vectors (embedding cosine_ops) WITH (options = $$
        [indexing.hnsw]
        m = 16
        ef_construction = 300
        $$);

        COMMIT;
      `);
      } catch (err) {
        this.logger.error(`Failed to update CLIP dimension size to ${dimSize}: ${err}`);
        this.smartSearchRepository.manager.query('ROLLBACK');
      }

      this.curDimSize = dimSize;
      this.logger.log(`Successfully updated CLIP dimension size to ${dimSize}`);
    });
  }
}
