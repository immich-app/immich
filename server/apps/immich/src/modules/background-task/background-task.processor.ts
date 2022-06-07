import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '@app/database/entities/asset.entity';
import fs from 'fs';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';

@Processor('background-task')
export class BackgroundTaskProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {}

  @Process('delete-file-on-disk')
  async deleteFileOnDisk(job) {
    const { assets }: { assets: AssetEntity[] } = job.data;

    for (const asset of assets) {
      fs.unlink(asset.originalPath, (err) => {
        if (err) {
          console.log('error deleting ', asset.originalPath);
        }
      });

      fs.unlink(asset.resizePath, (err) => {
        if (err) {
          console.log('error deleting ', asset.originalPath);
        }
      });
    }
  }
}
