import { Embedding, EmbeddingSearch, ISmartInfoRepository } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import { Repository } from 'typeorm';
import { AssetEntity, SmartInfoEntity, SmartSearchEntity } from '../entities';
import { asVector } from '../infra.utils';

@Injectable()
export class SmartInfoRepository implements ISmartInfoRepository {
  private logger = new Logger(SmartInfoRepository.name);
  private lock: AsyncLock;
  private curDimSize: number | undefined;

  constructor(
      @InjectRepository(SmartInfoEntity) private repository: Repository<SmartInfoEntity>,
      @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
        @InjectRepository(SmartSearchEntity) private smartSearchRepository: Repository<SmartSearchEntity>) {
    this.lock = new AsyncLock();
  }

  async searchByEmbedding({ ownerId, embedding, numResults }: EmbeddingSearch): Promise<AssetEntity[]> {
    let results: AssetEntity[] = await this.assetRepository.createQueryBuilder('a')
    .innerJoin('a.smartSearch', 's')
    .where('a.ownerId = :ownerId')
    .leftJoinAndSelect('a.exifInfo', 'e')
    .orderBy('s.embedding <=> :embedding')
    .setParameters({ embedding: asVector(embedding), ownerId })
    .limit(numResults)
    .getMany();

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
    await this.smartSearchRepository.manager.query(
      `INSERT INTO smart_search ($1, $2) ON CONFLICT ("assetId") SET embedding = $2`,
      [assetId, asVector(embedding)],
    );
  }

  /*
   * note: never use this with user input
   * this does not parameterize the query because it is not possible to parameterize the column type
   */
  private async updateDimSize(dimSize: number): Promise<void> {
    await this.lock.acquire('updateDimSizeLock', async () => {
      if (this.curDimSize === dimSize) return;

      this.logger.log(`Updating CLIP dimension size to ${dimSize}`);

      await this.smartSearchRepository.manager.query(`
        BEGIN;

        ALTER TABLE smart_search
        DROP COLUMN embedding,
        ADD COLUMN embedding vector(${dimSize});

        CREATE INDEX clip_index ON smart_search
        USING vectors (embedding dot_ops) WITH (options = $$
        capacity = 2097152
        [indexing.hnsw]
        m = 16
        ef_construction = 300
        $$);

        COMMIT;
      `);

      this.curDimSize = dimSize;
      this.logger.log(`Successfully updated CLIP dimension size to ${dimSize}`);
    });
  }
}
