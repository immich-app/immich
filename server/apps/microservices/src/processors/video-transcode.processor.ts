import { APP_UPLOAD_LOCATION } from '@app/common/constants';
import { AssetEntity } from '@app/infra';
import { IVideoConversionProcessor, JobName, QueueName, SystemConfigService } from '@app/domain';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { existsSync, mkdirSync } from 'fs';
import { Repository } from 'typeorm';

@Processor(QueueName.VIDEO_CONVERSION)
export class VideoTranscodeProcessor {
  readonly logger = new Logger(VideoTranscodeProcessor.name);
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,
    private systemConfigService: SystemConfigService,
  ) {}

  @Process({ name: JobName.VIDEO_CONVERSION, concurrency: 2 })
  async videoConversion(job: Job<IVideoConversionProcessor>) {
    const { asset } = job.data;
    const basePath = APP_UPLOAD_LOCATION;
    const encodedVideoPath = `${basePath}/${asset.ownerId}/encoded-video`;

    if (!existsSync(encodedVideoPath)) {
      mkdirSync(encodedVideoPath, { recursive: true });
    }

    const savedEncodedPath = `${encodedVideoPath}/${asset.id}.mp4`;

    await this.runVideoEncode(asset, savedEncodedPath);
  }

  async runFFProbePipeline(asset: AssetEntity): Promise<FfprobeData> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(asset.originalPath, (err, data) => {
        if (err || !data) {
          this.logger.error(`Cannot probe video ${err}`, 'runFFProbePipeline');
          reject(err);
        }

        resolve(data);
      });
    });
  }

  async runVideoEncode(asset: AssetEntity, savedEncodedPath: string): Promise<void> {
    const config = await this.systemConfigService.getConfig();

    if (config.ffmpeg.transcodeAll) {
      return this.runFFMPEGPipeLine(asset, savedEncodedPath);
    }

    const videoInfo = await this.runFFProbePipeline(asset);

    const videoStreams = videoInfo.streams.filter((stream) => {
      return stream.codec_type === 'video';
    });

    const longestVideoStream = videoStreams.sort((stream1, stream2) => {
      const stream1Frames = Number.parseInt(stream1.nb_frames ?? '0');
      const stream2Frames = Number.parseInt(stream2.nb_frames ?? '0');
      return stream2Frames - stream1Frames;
    })[0];

    //TODO: If video or audio are already the correct format, don't re-encode, copy the stream
    if (longestVideoStream.codec_name !== config.ffmpeg.targetVideoCodec) {
      return this.runFFMPEGPipeLine(asset, savedEncodedPath);
    }
  }

  async runFFMPEGPipeLine(asset: AssetEntity, savedEncodedPath: string): Promise<void> {
    const config = await this.systemConfigService.getConfig();

    return new Promise((resolve, reject) => {
      ffmpeg(asset.originalPath)
        .outputOptions([
          `-crf ${config.ffmpeg.crf}`,
          `-preset ${config.ffmpeg.preset}`,
          `-vcodec ${config.ffmpeg.targetVideoCodec}`,
          `-acodec ${config.ffmpeg.targetAudioCodec}`,
          `-vf scale=${config.ffmpeg.targetScaling}`,
        ])
        .output(savedEncodedPath)
        .on('start', () => {
          this.logger.log('Start Converting Video');
        })
        .on('error', (error) => {
          this.logger.error(`Cannot Convert Video ${error}`);
          reject();
        })
        .on('end', async () => {
          this.logger.log(`Converting Success ${asset.id}`);
          await this.assetRepository.update({ id: asset.id }, { encodedVideoPath: savedEncodedPath });
          resolve();
        })
        .run();
    });
  }
}
