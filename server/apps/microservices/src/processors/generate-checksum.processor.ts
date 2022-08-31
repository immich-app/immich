import { AssetEntity } from '@app/database/entities/asset.entity';
import { generateChecksumQueueName } from '@app/job';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { IsNull, Repository } from 'typeorm';

// TODO: just temporary task to generate previous uploaded assets.
@Processor(generateChecksumQueueName)
export class GenerateChecksumProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  @Process()
  async generateChecksum() {
    let hasNext = true;
    let pageSize = 200;
    let offset = 0;

    while (hasNext) {
      const assets = await this.assetRepository.find({
        where: {
          checksum: IsNull()
        },
        skip: offset,
        take: pageSize,
      });

      if (!assets?.length) {
        hasNext = false; // avoid using break
      } else {
        for (const asset of assets) {
          try {
            await this.generateAssetChecksum(asset);
          } catch (err: any) {
            Logger.error(`Error generate checksum ${err}`);
          }
        }

        if (assets.length < pageSize) {
          hasNext = false;
        } else {
          offset += pageSize;
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
