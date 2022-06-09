import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import sharp from 'sharp';

@Processor('thumbnail-generator-queue')
export class ThumbnailGeneratorProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) {}

  @Process('generate-jpeg-thumbnail')
  async generateJPEGThumbnail(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    console.log(asset);
  }

  @Process({ name: 'generate-webp-thumbnail', concurrency: 2 })
  async generateWepbThumbnail(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    const webpPath = asset.resizePath.replace('jpeg', 'webp');

    sharp(asset.resizePath)
      .resize(250)
      .webp()
      .toFile(webpPath, (err, info) => {
        if (!err) {
          this.assetRepository.update({ id: asset.id }, { webpPath: webpPath });
        }
      });
  }
}
