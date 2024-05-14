import { Inject, Injectable } from '@nestjs/common';
import { exiftool } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import { Writable } from 'node:stream';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { Colorspace } from 'src/config';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  IMediaRepository,
  ImageDimensions,
  ThumbnailOptions,
  TranscodeOptions,
  VideoInfo,
} from 'src/interfaces/media.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { handlePromiseError } from 'src/utils/misc';

const probe = promisify<string, FfprobeData>(ffmpeg.ffprobe);
sharp.concurrency(0);
sharp.cache({ files: 0 });

@Instrumentation()
@Injectable()
export class MediaRepository implements IMediaRepository {
  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(MediaRepository.name);
  }

  async extract(input: string, output: string): Promise<boolean> {
    try {
      await exiftool.extractJpgFromRaw(input, output);
    } catch (error: any) {
      this.logger.debug('Could not extract JPEG from image, trying preview', error.message);
      try {
        await exiftool.extractPreview(input, output);
      } catch (error: any) {
        this.logger.debug('Could not extract preview from image', error.message);
        return false;
      }
    }

    return true;
  }

  async generateThumbnail(input: string | Buffer, output: string, options: ThumbnailOptions): Promise<void> {
    const pipeline = sharp(input, { failOn: 'none' })
      .pipelineColorspace(options.colorspace === Colorspace.SRGB ? 'srgb' : 'rgb16')
      .rotate();

    if (options.crop) {
      pipeline.extract(options.crop);
    }

    await pipeline
      .resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true })
      .withIccProfile(options.colorspace)
      .toFormat(options.format, {
        quality: options.quality,
        // this is default in libvips (except the threshold is 90), but we need to set it manually in sharp
        chromaSubsampling: options.quality >= 80 ? '4:4:4' : '4:2:0',
      })
      .toFile(output);
  }

  async probe(input: string): Promise<VideoInfo> {
    const results = await probe(input);
    return {
      format: {
        formatName: results.format.format_name,
        formatLongName: results.format.format_long_name,
        duration: results.format.duration || 0,
        bitrate: results.format.bit_rate ?? 0,
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
          bitrate: Number.parseInt(stream.bit_rate ?? '0'),
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
        this.configureFfmpegCall(input, output, options).on('error', reject).on('end', resolve).run();
      });
    }

    if (typeof output !== 'string') {
      throw new TypeError('Two-pass transcoding does not support writing to a stream');
    }

    // two-pass allows for precise control of bitrate at the cost of running twice
    // recommended for vp9 for better quality and compression
    return new Promise((resolve, reject) => {
      // first pass output is not saved as only the .log file is needed
      this.configureFfmpegCall(input, '/dev/null', options)
        .addOptions('-pass', '1')
        .addOptions('-passlogfile', output)
        .addOptions('-f null')
        .on('error', reject)
        .on('end', () => {
          // second pass
          this.configureFfmpegCall(input, output, options)
            .addOptions('-pass', '2')
            .addOptions('-passlogfile', output)
            .on('error', reject)
            .on('end', () => handlePromiseError(fs.unlink(`${output}-0.log`), this.logger))
            .on('end', () => handlePromiseError(fs.rm(`${output}-0.log.mbtree`, { force: true }), this.logger))
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

  async getImageDimensions(input: string): Promise<ImageDimensions> {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    return { width, height };
  }

  private configureFfmpegCall(input: string, output: string | Writable, options: TranscodeOptions) {
    return ffmpeg(input, { niceness: 10 })
      .inputOptions(options.inputOptions)
      .outputOptions(options.outputOptions)
      .output(output)
      .on('error', (error, stdout, stderr) => this.logger.error(stderr || error));
  }
}
