import { CropOptions, IMediaRepository, ResizeOptions, TranscodeOptions, VideoInfo } from '@app/domain';
import { Logger } from '@nestjs/common';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import fs from 'fs/promises';
import sharp from 'sharp';
import { promisify } from 'util';

const probe = promisify<string, FfprobeData>(ffmpeg.ffprobe);
sharp.concurrency(0);

export class MediaRepository implements IMediaRepository {
  private logger = new Logger(MediaRepository.name);

  crop(input: string, options: CropOptions): Promise<Buffer> {
    return sharp(input, { failOn: 'none' })
      .extract({
        left: options.left,
        top: options.top,
        width: options.width,
        height: options.height,
      })
      .toBuffer();
  }

  async resize(input: string | Buffer, output: string, options: ResizeOptions): Promise<void> {
    await sharp(input, { failOn: 'none' })
      .resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true })
      .rotate()
      .toFormat(options.format)
      .toFile(output);
  }

  async probe(input: string): Promise<VideoInfo> {
    const results = await probe(input);
    return {
      format: {
        formatName: results.format.format_name,
        formatLongName: results.format.format_long_name,
        duration: results.format.duration || 0,
      },
      videoStreams: results.streams
        .filter((stream) => stream.codec_type === 'video')
        .map((stream) => ({
          index: stream.index,
          height: stream.height || 0,
          width: stream.width || 0,
          codecName: stream.codec_name === 'h265' ? 'hevc' : stream.codec_name,
          codecType: stream.codec_type,
          frameCount: Number.parseInt(stream.nb_frames ?? '0'),
          rotation: Number.parseInt(`${stream.rotation ?? 0}`),
          isHDR: stream.color_transfer === 'smpte2084' || stream.color_transfer === 'arib-std-b67',
        })),
      audioStreams: results.streams
        .filter((stream) => stream.codec_type === 'audio')
        .map((stream) => ({
          index: stream.index,
          codecType: stream.codec_type,
          codecName: stream.codec_name,
          frameCount: Number.parseInt(stream.nb_frames ?? '0'),
        })),
    };
  }

  transcode(input: string, output: string, options: TranscodeOptions): Promise<void> {
    if (!options.twoPass) {
      return new Promise((resolve, reject) => {
        ffmpeg(input, { niceness: 10 })
          .inputOptions(options.inputOptions)
          .outputOptions(options.outputOptions)
          .output(output)
          .on('error', (err, stdout, stderr) => {
            this.logger.error(stderr);
            reject(err);
          })
          .on('end', resolve)
          .run();
      });
    }

    // two-pass allows for precise control of bitrate at the cost of running twice
    // recommended for vp9 for better quality and compression
    return new Promise((resolve, reject) => {
      ffmpeg(input, { niceness: 10 })
        .inputOptions(options.inputOptions)
        .outputOptions(options.outputOptions)
        .addOptions('-pass', '1')
        .addOptions('-passlogfile', output)
        .addOptions('-f null')
        .output('/dev/null') // first pass output is not saved as only the .log file is needed
        .on('error', (err, stdout, stderr) => {
          this.logger.error(stderr);
          reject(err);
        })
        .on('end', () => {
          // second pass
          ffmpeg(input, { niceness: 10 })
            .inputOptions(options.inputOptions)
            .outputOptions(options.outputOptions)
            .addOptions('-pass', '2')
            .addOptions('-passlogfile', output)
            .output(output)
            .on('error', (err, stdout, stderr) => {
              this.logger.error(stderr);
              reject(err);
            })
            .on('end', () => fs.unlink(`${output}-0.log`))
            .on('end', () => fs.rm(`${output}-0.log.mbtree`, { force: true }))
            .on('end', resolve)
            .run();
        })
        .run();
    });
  }

  async generateThumbhash(imagePath: string): Promise<Buffer> {
    const maxSize = 100;

    const { data, info } = await sharp(imagePath)
      .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
      .raw()
      .ensureAlpha()
      .toBuffer({ resolveWithObject: true });

    const thumbhash = await import('thumbhash');
    return Buffer.from(thumbhash.rgbaToThumbHash(info.width, info.height, data));
  }
}
