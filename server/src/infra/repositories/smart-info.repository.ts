import { EmbeddingSearch, ISmartInfoRepository } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AsyncLock from 'async-lock';
import { Repository } from 'typeorm';
import { AssetEntity, SmartInfoEntity } from '../entities';
import { asVector } from '../infra.utils';

@Injectable()
export class SmartInfoRepository implements ISmartInfoRepository {
  private logger = new Logger(SmartInfoRepository.name);
  private lock: AsyncLock;
  private curDimSize: number | undefined;

  constructor(@InjectRepository(SmartInfoEntity) private repository: Repository<SmartInfoEntity>) {
    this.lock = new AsyncLock();
  }

  async searchByEmbedding({ ownerId, embedding, numResults }: EmbeddingSearch): Promise<AssetEntity[]> {
    const results = await this.repository
      .createQueryBuilder('smartInfo')
      .useTransaction(true)
      .leftJoinAndSelect('smartInfo.asset', 'asset')
      .where('asset.ownerId = :ownerId', { ownerId })
      .orderBy(`smartInfo.clipEmbedding <=> :embedding`)
      .setParameters({ embedding: asVector(embedding) })
      .limit(numResults)
      .getMany();

    return results.map((result) => result.asset).filter((asset): asset is AssetEntity => !!asset);
  }

  async upsert(info: Partial<SmartInfoEntity>): Promise<void> {
    const { clipEmbedding, ...withoutEmbedding } = info;
    await this.repository.upsert(withoutEmbedding, { conflictPaths: ['assetId'] });
    if (!clipEmbedding || !info.assetId) return;

    try {
      await this.updateEmbedding(clipEmbedding, info.assetId);
    } catch (e) {
      await this.updateDimSize(clipEmbedding.length);
      await this.updateEmbedding(clipEmbedding, info.assetId);
    }
  }

  private async updateEmbedding(embedding: number[], assetId: string): Promise<void> {
    await this.repository.manager.query(`UPDATE "smart_info" SET "clipEmbedding" = $1 WHERE "assetId" = $2`, [
      asVector(embedding),
      assetId,
    ]);
  }

  /*
   * note: never use this with user input
   * this does not parameterize the query because it is not possible to parameterize the column type
  */
  private async updateDimSize(dimSize: number): Promise<void> {
    await this.lock.acquire('updateDimSizeLock', async () => {
      if (this.curDimSize === dimSize) return;

      this.logger.log(`Updating CLIP dimension size to ${dimSize}`);

      await this.repository.manager.query(`
        BEGIN;

        ALTER TABLE smart_info
        DROP COLUMN "clipEmbedding",
        ADD COLUMN "clipEmbedding" vector(${dimSize});

        CREATE INDEX IF NOT EXISTS clip_index
        ON smart_info
        USING hnsw ("clipEmbedding" vector_ip_ops)
        WITH (m = 16, ef_construction = 128);

        SET hnsw.ef_search = 250;
        COMMIT;
      `
      );

      this.curDimSize = dimSize;
      this.logger.log(`Successfully updated CLIP dimension size to ${dimSize}`);
    });
  }
}
