import { Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { existsSync, mkdirSync } from 'fs';
import { APP_UPLOAD_LOCATION } from '../../constants/upload_location.constant';
import ffmpeg from 'fluent-ffmpeg';
import { Logger } from '@nestjs/common';

@Processor('video-conversion')
export class VideoConversionProcessor {

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
  ) { }

  @Process('to-mp4')
  async convertToMp4(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    const basePath = APP_UPLOAD_LOCATION;
    const encodedVideoPath = `${basePath}/${asset.userId}/encoded-video`;

    if (!existsSync(encodedVideoPath)) {
      mkdirSync(encodedVideoPath, { recursive: true });
    }

    const latestAssetInfo = await this.assetRepository.findOne({ id: asset.id });
    const savedEncodedPath = encodedVideoPath + "/" + latestAssetInfo.id + '.mp4'

    if (latestAssetInfo.encodedVideoPath == '') {
      ffmpeg(latestAssetInfo.originalPath)
        .outputOptions([
          '-crf 23',
          '-preset ultrafast',
          '-vcodec libx264',
          '-acodec mp3',
          '-vf scale=1280:-2'
        ])
        .output(savedEncodedPath)
        .on('start', () => Logger.log("Start Converting", 'VideoConversionMOV2MP4'))
        .on('error', (a, b, c) => {
          Logger.error('Cannot Convert Video', 'VideoConversionMOV2MP4')
          console.log(a, b, c)
        })
        .on('end', async () => {
          Logger.log(`Converting Success ${latestAssetInfo.id}`, 'VideoConversionMOV2MP4')
          await this.assetRepository.update({ id: latestAssetInfo.id }, { encodedVideoPath: savedEncodedPath });
        }).run();
    }

    return {}
  }
}
