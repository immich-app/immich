import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import sharp from 'sharp';

@Injectable()
export class ImageConversionService {

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>
  ) { }

  @Cron(CronExpression.EVERY_5_MINUTES
    , {
      name: 'webp-conversion'
    })
  async webpConversion() {
    Logger.log('Starting Webp Conversion Tasks', 'ImageConversionService')

    const assets = await this.assetRepository.find({
      where: {
        webpPath: ''
      },
      take: 500
    });


    if (assets.length == 0) {
      Logger.log('All assets has webp file - aborting task', 'ImageConversionService')
      return;
    }


    for (const asset of assets) {
      const resizePath = asset.resizePath;
      if (resizePath != '') {
        const webpPath = resizePath.replace('jpeg', 'webp')

        sharp(resizePath).resize(250).webp().toFile(webpPath, (err, info) => {

          if (!err) {
            this.assetRepository.update({ id: asset.id }, { webpPath: webpPath })
          }

        });
      }
    }
  }
}
