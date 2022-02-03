import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import sharp from 'sharp';
import fs, { existsSync, mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Processor('image')
export class ImageOptimizeProcessor {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectQueue('machine-learning') private machineLearningQueue: Queue,
    private configService: ConfigService,
  ) {}

  @Process('optimize')
  async handleOptimization(job: Job) {
    const { savedAsset }: { savedAsset: AssetEntity } = job.data;

    const basePath = this.configService.get('UPLOAD_LOCATION');
    const resizePath = savedAsset.originalPath.replace('/original/', '/thumb/');

    // Create folder for thumb image if not exist

    const resizeDir = `${basePath}/${savedAsset.userId}/thumb/${savedAsset.deviceId}`;

    if (!existsSync(resizeDir)) {
      mkdirSync(resizeDir, { recursive: true });
    }

    fs.readFile(savedAsset.originalPath, (err, data) => {
      if (err) {
        console.error('Error Reading File');
      }

      sharp(data)
        .resize(512, 512, { fit: 'outside' })
        .toFile(resizePath, async (err, info) => {
          if (err) {
            console.error('Error resizing file ', err);
          }

          await this.assetRepository.update(savedAsset, { resizePath: resizePath });

          const jobb = await this.machineLearningQueue.add(
            'object-detection',
            {
              resizePath,
            },
            { jobId: randomUUID() },
          );
        });
    });

    return 'ok';
  }
}
