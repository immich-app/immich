import { Inject, Injectable } from '@nestjs/common';
import { exiftool } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Duration } from 'luxon';
import fs from 'node:fs/promises';
import { Writable } from 'node:stream';
import sharp from 'sharp';
import { Colorspace, LogLevel } from 'src/enum';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  DecodeToBufferOptions,
  GenerateThumbhashOptions,
  GenerateThumbnailOptions,
  IMediaRepository,
  ImageDimensions,
  ProbeOptions,
  TranscodeCommand,
  VideoInfo,
} from 'src/interfaces/media.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { handlePromiseError } from 'src/utils/misc';

const probe = (input: string, options: string[]): Promise<FfprobeData> =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(input, options, (error, data) => (error ? reject(error) : resolve(data))),
  );
sharp.concurrency(0);
sharp.cache({ files: 0 });

type ProgressEvent = {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number;
};

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

  decodeImage(input: string, options: DecodeToBufferOptions) {
    return this.getImageDecodingPipeline(input, options).raw().toBuffer({ resolveWithObject: true });
  }

  async generateThumbnail(input: string | Buffer, options: GenerateThumbnailOptions, output: string): Promise<void> {
    await this.getImageDecodingPipeline(input, options)
      .toFormat(options.format, {
        quality: options.quality,
        // this is default in libvips (except the threshold is 90), but we need to set it manually in sharp
        chromaSubsampling: options.quality >= 80 ? '4:4:4' : '4:2:0',
      })
      .toFile(output);
  }

  private getImageDecodingPipeline(input: string | Buffer, options: DecodeToBufferOptions) {
    let pipeline = sharp(input, {
      // some invalid images can still be processed by sharp, but we want to fail on them by default to avoid crashes
      failOn: options.processInvalidImages ? 'none' : 'error',
      limitInputPixels: false,
      raw: options.raw,
    })
      .pipelineColorspace(options.colorspace === Colorspace.SRGB ? 'srgb' : 'rgb16')
      .withIccProfile(options.colorspace);

    if (!options.raw) {
      pipeline = pipeline.rotate();
    }

    if (options.crop) {
      pipeline = pipeline.extract(options.crop);
    }

    return pipeline.resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true });
  }

  async generateThumbhash(input: string | Buffer, options: GenerateThumbhashOptions): Promise<Buffer> {
    const [{ rgbaToThumbHash }, { data, info }] = await Promise.all([
      import('thumbhash'),
      sharp(input, options)
        .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
        .raw()
        .ensureAlpha()
        .toBuffer({ resolveWithObject: true }),
    ]);
    return Buffer.from(rgbaToThumbHash(info.width, info.height, data));
  }

  async probe(input: string, options?: ProbeOptions): Promise<VideoInfo> {
    const results = await probe(input, options?.countFrames ? ['-count_packets'] : []); // gets frame count quickly: https://stackoverflow.com/a/28376817
    return {
      format: {
        formatName: results.format.format_name,
        formatLongName: results.format.format_long_name,
        duration: results.format.duration || 0,
        bitrate: results.format.bit_rate ?? 0,
      },
      videoStreams: results.streams
        .filter((stream) => stream.codec_type === 'video')
        .filter((stream) => !stream.disposition?.attached_pic)
        .map((stream) => ({
          index: stream.index,
          height: stream.height || 0,
          width: stream.width || 0,
          codecName: stream.codec_name === 'h265' ? 'hevc' : stream.codec_name,
          codecType: stream.codec_type,
          frameCount: this.parseInt(options?.countFrames ? stream.nb_read_packets : stream.nb_frames),
          rotation: this.parseInt(stream.rotation),
          isHDR: stream.color_transfer === 'smpte2084' || stream.color_transfer === 'arib-std-b67',
          bitrate: this.parseInt(stream.bit_rate),
        })),
      audioStreams: results.streams
        .filter((stream) => stream.codec_type === 'audio')
        .map((stream) => ({
          index: stream.index,
          codecType: stream.codec_type,
          codecName: stream.codec_name,
          frameCount: this.parseInt(options?.countFrames ? stream.nb_read_packets : stream.nb_frames),
        })),
    };
  }

  transcode(input: string, output: string | Writable, options: TranscodeCommand): Promise<void> {
    if (!options.twoPass) {
      return new Promise((resolve, reject) => {
        this.configureFfmpegCall(input, output, options)
          .on('error', reject)
          .on('end', () => resolve())
          .run();
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
            .on('end', () => resolve())
            .run();
        })
        .run();
    });
  }

  async getImageDimensions(input: string): Promise<ImageDimensions> {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    return { width, height };
  }

  private configureFfmpegCall(input: string, output: string | Writable, options: TranscodeCommand) {
    const ffmpegCall = ffmpeg(input, { niceness: 10 })
      .inputOptions(options.inputOptions)
      .outputOptions(options.outputOptions)
      .output(output)
      .on('start', (command: string) => this.logger.debug(command))
      .on('error', (error, _, stderr) => this.logger.error(stderr || error));

    const { frameCount, percentInterval } = options.progress;
    const frameInterval = Math.ceil(frameCount / (100 / percentInterval));
    if (this.logger.isLevelEnabled(LogLevel.DEBUG) && frameCount && frameInterval) {
      let lastProgressFrame: number = 0;
      ffmpegCall.on('progress', (progress: ProgressEvent) => {
        if (progress.frames - lastProgressFrame < frameInterval) {
          return;
        }

        lastProgressFrame = progress.frames;
        const percent = ((progress.frames / frameCount) * 100).toFixed(2);
        const ms = Math.floor((frameCount - progress.frames) / progress.currentFps) * 1000;
        const duration = ms ? Duration.fromMillis(ms).rescale().toHuman({ unitDisplay: 'narrow' }) : '';
        const outputText = output instanceof Writable ? 'stream' : output.split('/').pop();
        this.logger.debug(
          `Transcoding ${percent}% done${duration ? `, estimated ${duration} remaining` : ''} for output ${outputText}`,
        );
      });
    }

    return ffmpegCall;
  }

  private parseInt(value: string | number | undefined): number {
    return Number.parseInt(value as string) || 0;
  }
}
