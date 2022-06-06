import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { APP_UPLOAD_LOCATION } from '../../constants/upload_location.constant';
import { existsSync, mkdirSync } from 'fs';
import { InjectQueue } from '@nestjs/bull/dist/decorators';
import { Queue } from 'bull';
import { randomUUID } from 'crypto';

@Injectable()
export class VideoConversionService {


  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectQueue('video-conversion')
    private videoEncodingQueue: Queue
  ) { }


  @Cron(CronExpression.EVERY_MINUTE
    , {
      name: 'video-encoding'
    })
  async mp4Conversion() {
    const assets = await this.assetRepository.find({
      where: {
        type: 'VIDEO',
        mimeType: 'video/quicktime',
        encodedVideoPath: ''
      },
      order: {
        createdAt: 'DESC'
      },
      take: 1
    });

    if (assets.length > 0) {
      const asset = assets[0];
      await this.videoEncodingQueue.add('to-mp4', { asset }, { jobId: asset.id },)
    }
  }
}
