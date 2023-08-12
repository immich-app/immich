import { CropOptions, IMediaRepository, ResizeOptions, ThumbnailOptions, TranscodeOptions, VideoInfo } from '@app/domain';
import { Logger } from '@nestjs/common';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import fs from 'fs/promises';
import sharp from 'sharp';
import { Writable } from 'typeorm/platform/PlatformTools.js';
import { promisify } from 'util';

const probe = promisify<string, FfprobeData>(ffmpeg.ffprobe);
sharp.concurrency(0);

export class MediaRepository implements IMediaRepository {
  private logger = new Logger(MediaRepository.name);

  crop(input: string | Buffer, options: CropOptions): Promise<Buffer> {
    return sharp(input, { failOn: 'none' })
      .extract({
        left: options.left,
        top: options.top,
        width: options.width,
        height: options.height,
      })
      .toBuffer();
  }

  async resize(input: string | Buffer, options: ResizeOptions): Promise<Buffer> {
    return sharp(input, { failOn: 'none' })
      .resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true })
      .rotate()
      .toBuffer();
  }

  async saveThumbnail(input: string | Buffer, output: string, options: ThumbnailOptions): Promise<void> {
    let colorspace;
    if (options.wideGamut) {
      try {
        const { space } = await sharp(input, { failOn: 'none' }).metadata()
        if ((space as string) === 'rgb16' || space == null) {
          colorspace = 'p3';
        } else {
          colorspace = 'srgb';
        }
      } catch (err) {
        // if we can't read the metadata, assume it's a raw image and use p3
        colorspace = "p3";
      }
    } else {
      // no need to check metadata if we're not using wide gamut
      colorspace = 'srgb';
    }
    const chromaSubsampling = options.quality >= 80 ? '4:4:4' : '4:2:0'; // this is default in libvips (except the threshold is 90), but we need to set it manually in sharp
    await sharp(input, { failOn: 'none' })
      .toColorspace(colorspace)
      .toFormat(options.format, { quality: options.quality, chromaSubsampling })
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

  transcode(input: string, output: string | Writable, options: TranscodeOptions): Promise<void> {
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

    if (typeof output !== 'string') {
      throw new Error('Two-pass transcoding does not support writing to a stream');
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
