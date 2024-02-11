import { CropOptions, IMediaRepository, ResizeOptions, TranscodeOptions, VideoInfo } from '@app/domain';
import { Colorspace } from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import fs from 'node:fs/promises';
import { Writable } from 'node:stream';
import { promisify } from 'node:util';
import sharp from 'sharp';

const probe = promisify<string, FfprobeData>(ffmpeg.ffprobe);
sharp.concurrency(0);
sharp.cache({ files: 0 });

export class MediaRepository implements IMediaRepository {
  private logger = new ImmichLogger(MediaRepository.name);

  crop(input: string | Buffer, options: CropOptions): Promise<Buffer> {
    return sharp(input, { failOn: 'none' })
      .pipelineColorspace('rgb16')
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
      .pipelineColorspace(options.colorspace === Colorspace.SRGB ? 'srgb' : 'rgb16')
      .resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true })
      .rotate()
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
        const oldLdLibraryPath = process.env.LD_LIBRARY_PATH;
        if (options.ldLibraryPath) {
          // fluent ffmpeg does not allow to set environment variables, so we do it manually
          process.env.LD_LIBRARY_PATH = this.chainPath(oldLdLibraryPath || '', options.ldLibraryPath);
        }
        try {
          this.configureFfmpegCall(input, output, options).on('error', reject).on('end', resolve).run();
        } finally {
          if (options.ldLibraryPath) {
            process.env.LD_LIBRARY_PATH = oldLdLibraryPath;
          }
        }
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
            .on('end', () => fs.unlink(`${output}-0.log`))
            .on('end', () => fs.rm(`${output}-0.log.mbtree`, { force: true }))
            .on('end', resolve)
            .run();
        })
        .run();
    });
  }

  configureFfmpegCall(input: string, output: string | Writable, options: TranscodeOptions) {
    return ffmpeg(input, { niceness: 10 })
      .setFfmpegPath(options.ffmpegPath || 'ffmpeg')
      .inputOptions(options.inputOptions)
      .outputOptions(options.outputOptions)
      .output(output)
      .on('error', (error, stdout, stderr) => this.logger.error(stderr || error));
  }

  chainPath(existing: string, path: string) {
    const separator = existing.endsWith(':') ? '' : ':';
    return `${existing}${separator}${path}`;
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
