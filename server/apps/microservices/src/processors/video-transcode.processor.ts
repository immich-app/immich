import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { SystemConfigEntity } from '@app/database/entities/system-config.entity';
import { mp4ConversionProcessorName } from '@app/job/constants/job-name.constant';
import { videoConversionQueueName } from '@app/job/constants/queue-name.constant';
import { IMp4ConversionProcessor } from '@app/job/interfaces/video-transcode.interface';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import ffmpeg from 'fluent-ffmpeg';
import { ffprobe } from 'fluent-ffmpeg';
import { existsSync, mkdirSync } from 'fs';
import { Repository } from 'typeorm';
import { SystemConfigClient } from './system-config';

@Processor(videoConversionQueueName)
export class VideoTranscodeProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    @InjectRepository(SystemConfigEntity)
    private systemConfigRepository: Repository<SystemConfigEntity>,
  ) {}

  @Process({ name: mp4ConversionProcessorName, concurrency: 1 })
  async mp4Conversion(job: Job<IMp4ConversionProcessor>) {
    const { asset } = job.data;

    if (asset.mimeType != 'video/mp4' || ! await this.isVideoWebCompatible(asset.originalPath)) {
      const basePath = APP_UPLOAD_LOCATION;
      const encodedVideoPath = `${basePath}/${asset.userId}/encoded-video`;

      if (!existsSync(encodedVideoPath)) {
        mkdirSync(encodedVideoPath, { recursive: true });
      }

      if (asset.encodedVideoPath == '' || !asset.encodedVideoPath) {
        // Put the processing into its own async function to prevent the job exist right away
        await this.runFFMPEGPipeLine(asset, encodedVideoPath);
      }
    }
  }

  async isVideoWebCompatible(file: string): Promise<boolean> {
    return new Promise((resolve, reject)=>{
      ffprobe(file, ["-select_streams", "v:0"], function (err:any, data: ffmpeg.FfprobeData) {
        if (err) {
          reject(err);
        } else {
          const videoOk = data.streams.length > 0 && data.streams[0].codec_name === "h264";
          Logger.log(`Video ${file} isWebCompatible=${videoOk}`, 'mp4Conversion');
          resolve(videoOk);
        }
      });
    });
  }

  async runFFMPEGPipeLine(asset: AssetEntity, encodedVideoFolder: string): Promise<void> {
    const { ffmpeg: config } = await new SystemConfigClient(this.systemConfigRepository).getConfig();
    const outputPath = encodedVideoFolder + '/' + asset.id + '.' + config.ffmpeg_container;
    const options = [
      `-crf ${config.ffmpeg_crf}`,
      `-preset ${config.ffmpeg_preset}`,
      `-vcodec ${config.ffmpeg_target_video_codec}`,
      `-acodec ${config.ffmpeg_target_audio_codec}`,
      `-q:a ${config.ffmpeg_target_audio_quality}`,
      `-vf scale=${config.ffmpeg_target_scaling}`,
    ];
    console.log(options);
    return new Promise((resolve, reject) => {
      ffmpeg(asset.originalPath)
        .outputOptions(options)
        .output(outputPath)
        .on('start', () => {
          Logger.log('Start Converting Video', 'mp4Conversion');
        })
        .on('error', (error: any) => {
          Logger.error(`Cannot Convert Video ${error}`, 'mp4Conversion');
          reject();
        })
        .on('end', async () => {
          Logger.log(`Converting Success ${asset.id}`, 'mp4Conversion');
          await this.assetRepository.update({ id: asset.id }, { encodedVideoPath: outputPath });
          resolve();
        })
        .run();
    });
  }
}
