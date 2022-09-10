import { AssetEntity } from '@app/database/entities/asset.entity';
import { generateChecksumQueueName } from '@app/job';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { FindOptionsWhere, IsNull, MoreThan, Repository } from 'typeorm';

// TODO: just temporary task to generate previous uploaded assets.
@Processor(generateChecksumQueueName)
export class GenerateChecksumProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) { }

  @Process()
  async generateChecksum() {
    const pageSize = 200;
    let hasNext = true;
    let lastDuplicateAssetId: string | undefined = undefined;

    while (hasNext) {
      const whereStat: FindOptionsWhere<AssetEntity> = {
        checksum: IsNull(),
      };

      if (lastDuplicateAssetId) {
        whereStat.id = MoreThan(lastDuplicateAssetId);
      }

      const assets = await this.assetRepository.find({
        where: whereStat,
        take: pageSize,
        order: { id: 'ASC' }
      });

      if (!assets?.length) {
        hasNext = false; // avoid using break
      } else {
        for (const asset of assets) {
          try {
            await this.generateAssetChecksum(asset);
          } catch (err: any) {
            lastDuplicateAssetId = asset.id;
            Logger.error(`Error generate checksum ${err}`);
          }
        }

        // break when reach to the last page
        if (assets.length < pageSize) {
          hasNext = false;
        }
      }
    }
  }

  private async generateAssetChecksum(asset: AssetEntity) {
    if (!asset.originalPath) return;
    if (!fs.existsSync(asset.originalPath)) return;

    const fileReadStream = fs.createReadStream(asset.originalPath);
    const sha1Hash = createHash('sha1');
    const deferred = new Promise<Buffer>((resolve, reject) => {
      sha1Hash.once('error', (err) => reject(err));
      sha1Hash.once('finish', () => resolve(sha1Hash.read()));
    });

    fileReadStream.pipe(sha1Hash);
    const checksum = await deferred;

    await this.assetRepository.update(asset.id, { checksum });
  }
}
