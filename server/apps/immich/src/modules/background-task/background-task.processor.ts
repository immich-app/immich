import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import fs from 'fs';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';
import { Job } from 'bull';

@Processor('background-task')
export class BackgroundTaskProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  // TODO: Should probably use constants / Interfaces for Queue names / data
  @Process('delete-file-on-disk')
  async deleteFileOnDisk(job: Job<{ assets: AssetEntity[] }>) {
    const { assets } = job.data;

    for (const asset of assets) {
      fs.unlink(asset.originalPath, (err) => {
        if (err) {
          console.log('error deleting ', asset.originalPath);
        }
      });

      // TODO: what if there is no asset.resizePath. Should fail the Job?
      if (asset.resizePath) {
        fs.unlink(asset.resizePath, (err) => {
          if (err) {
            console.log('error deleting ', asset.originalPath);
          }
        });
      }
    }
  }
}
