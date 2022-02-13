import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { randomUUID } from 'node:crypto';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';

@Injectable()
export class BackgroundTaskService {
  constructor(
    @InjectQueue('background-task')
    private backgroundTaskQueue: Queue,
  ) {}

  async extractExif(savedAsset: AssetEntity, fileName: string, fileSize: number) {
    await this.backgroundTaskQueue.add(
      'extract-exif',
      {
        savedAsset,
        fileName,
        fileSize,
      },
      { jobId: randomUUID() },
    );
  }

  async deleteFileOnDisk(assets: AssetEntity[]) {
    await this.backgroundTaskQueue.add(
      'delete-file-on-disk',
      {
        assets,
      },
      { jobId: randomUUID() },
    );
  }
}
