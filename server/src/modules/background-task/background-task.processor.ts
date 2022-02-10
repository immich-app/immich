import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ConfigService } from '@nestjs/config';
import exifr from 'exifr';
import { readFile } from 'fs/promises';
import { Logger } from '@nestjs/common';

@Processor('background-task')
export class BackgroundTaskProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    private configService: ConfigService,
  ) {}

  @Process('extract-exif')
  async extractExif(job: Job) {
    const { savedAsset }: { savedAsset: AssetEntity } = job.data;

    const fileBuffer = await readFile(savedAsset.originalPath);

    const exifData = await exifr.parse(fileBuffer);

    console.log('=====================');
    console.log(exifData);

    try {
    } catch (e) {
      Logger.error(`Error extracting EXIF ${e.toString()}`, 'extractExif');
    }
  }
}
