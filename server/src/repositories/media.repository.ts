import { Injectable } from '@nestjs/common';
import { context, Span, SpanKind, SpanStatusCode, trace } from '@opentelemetry/api';
import { ExifDateTime, exiftool, WriteTags } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Duration } from 'luxon';
import fs from 'node:fs/promises';
import { Writable } from 'node:stream';
import sharp from 'sharp';
import { ORIENTATION_TO_SHARP_ROTATION } from 'src/constants';
import { Exif } from 'src/database';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { Colorspace, LogLevel, RawExtractedFormat } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import {
  DecodeToBufferOptions,
  GenerateThumbhashOptions,
  GenerateThumbnailOptions,
  ImageDimensions,
  ProbeOptions,
  TranscodeCommand,
  VideoInfo,
} from 'src/types';
import { Traced } from 'src/utils/instrumentation';
import { handlePromiseError } from 'src/utils/misc';
import { createAffineMatrix } from 'src/utils/transform';

const probe = (input: string, options: string[]): Promise<FfprobeData> =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(input, options, (error, data) => (error ? reject(error) : resolve(data))),
  );
const tracer = trace.getTracer('immich');
sharp.concurrency(0);
sharp.cache({ files: 0 });

const EXTRACTION_METHODS = [
  { tag: 'JpgFromRaw2', format: RawExtractedFormat.Jpeg },
  { tag: 'JpgFromRaw', format: RawExtractedFormat.Jpeg },
  { tag: 'PreviewJXL', format: RawExtractedFormat.Jxl },
  { tag: 'PreviewImage', format: RawExtractedFormat.Jpeg },
] as const;

type ProgressEvent = {
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
  percent?: number;
};

export type ExtractResult = {
  buffer: Buffer;
  format: RawExtractedFormat;
};

@Injectable()
export class MediaRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MediaRepository.name);
  }

  @Traced('media.exiftool.extract')
  async extract(input: string): Promise<ExtractResult | null> {
    for (const { tag, format } of EXTRACTION_METHODS) {
      try {
        const buffer = await exiftool.extractBinaryTagToBuffer(tag, input);
        trace.getActiveSpan()?.setAttribute('exiftool.extractedTag', tag);
        return { buffer, format };
      } catch {
        this.logger.debug(`Could not extract ${tag} from image, trying next method`);
      }
    }
    trace.getActiveSpan()?.setAttribute('exiftool.extractedTag', 'none');
    return null;
  }

  @Traced('media.exiftool.writeExif')
  async writeExif(tags: Partial<Exif>, output: string): Promise<boolean> {
    const tagsToWrite: WriteTags = {
      ExifImageWidth: tags.exifImageWidth,
      ExifImageHeight: tags.exifImageHeight,
      DateTimeOriginal: tags.dateTimeOriginal && ExifDateTime.fromMillis(tags.dateTimeOriginal.getTime()),
      ModifyDate: tags.modifyDate && ExifDateTime.fromMillis(tags.modifyDate.getTime()),
      TimeZone: tags.timeZone,
      GPSLatitude: tags.latitude,
      GPSLongitude: tags.longitude,
      ProjectionType: tags.projectionType,
      City: tags.city,
      Country: tags.country,
      Make: tags.make,
      Model: tags.model,
      LensModel: tags.lensModel,
      Fnumber: tags.fNumber?.toFixed(1),
      FocalLength: tags.focalLength?.toFixed(1),
      ISO: tags.iso,
      ExposureTime: tags.exposureTime,
      ProfileDescription: tags.profileDescription,
      ColorSpace: tags.colorspace,
      Rating: tags.rating,
      'Orientation#': tags.orientation ? Number(tags.orientation) : undefined,
    };

    try {
      await exiftool.write(output, tagsToWrite, {
        ignoreMinorErrors: true,
        writeArgs: ['-overwrite_original'],
      });
      return true;
    } catch (error: unknown) {
      const span = trace.getActiveSpan();
      span?.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span?.recordException(error as Error);
      this.logger.warn(`Could not write exif data to image: ${error}`);
      return false;
    }
  }

  @Traced('media.exiftool.copyTagGroup')
  async copyTagGroup(tagGroup: string, source: string, target: string): Promise<boolean> {
    trace.getActiveSpan()?.setAttribute('exiftool.tagGroup', tagGroup);

    try {
      await exiftool.write(
        target,
        {},
        {
          ignoreMinorErrors: true,
          writeArgs: ['-TagsFromFile', source, `-${tagGroup}:all>${tagGroup}:all`, '-overwrite_original'],
        },
      );
      return true;
    } catch (error: unknown) {
      const span = trace.getActiveSpan();
      span?.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span?.recordException(error as Error);
      this.logger.warn(`Could not copy tag data to image: ${error}`);
      return false;
    }
  }

  @Traced('media.decodeImage')
  async decodeImage(input: string | Buffer, options: DecodeToBufferOptions) {
    const span = trace.getActiveSpan();
    span?.setAttribute('media.colorspace', options.colorspace);
    if (options.size !== undefined) {
      span?.setAttribute('media.size', options.size);
    }

    const pipeline = await this.getImageDecodingPipeline(input, options);
    const result = await pipeline.raw().toBuffer({ resolveWithObject: true });
    span?.setAttribute('media.output.width', result.info.width);
    span?.setAttribute('media.output.height', result.info.height);
    return result;
  }

  private async applyEdits(pipeline: sharp.Sharp, edits: AssetEditActionItem[]): Promise<sharp.Sharp> {
    const affineEditOperations = edits.filter((edit) => edit.action !== 'crop');
    const matrix = createAffineMatrix(affineEditOperations);

    const crop = edits.find((edit) => edit.action === 'crop');
    const dimensions = await pipeline.metadata();

    if (crop) {
      pipeline = pipeline.extract({
        left: crop ? Math.round(crop.parameters.x) : 0,
        top: crop ? Math.round(crop.parameters.y) : 0,
        width: crop ? Math.round(crop.parameters.width) : dimensions.width || 0,
        height: crop ? Math.round(crop.parameters.height) : dimensions.height || 0,
      });
    }

    const { a, b, c, d } = matrix;
    pipeline = pipeline.affine([
      [a, b],
      [c, d],
    ]);

    return pipeline;
  }

  @Traced('media.generateThumbnail')
  async generateThumbnail(input: string | Buffer, options: GenerateThumbnailOptions, output: string): Promise<void> {
    const span = trace.getActiveSpan();
    span?.setAttribute('media.imageType', options.imageType ?? 'unknown');
    span?.setAttribute('media.format', options.format);
    span?.setAttribute('media.quality', options.quality);
    span?.setAttribute('media.size', options.size ?? 0);
    span?.setAttribute('media.colorspace', options.colorspace);
    if (options.progressive !== undefined) {
      span?.setAttribute('media.progressive', options.progressive);
    }

    const pipeline = await this.getImageDecodingPipeline(input, options);
    const decoded = pipeline.toFormat(options.format, {
      quality: options.quality,
      chromaSubsampling: options.quality >= 80 ? '4:4:4' : '4:2:0',
      progressive: options.progressive,
    });

    await decoded.toFile(output);
  }

  private async getImageDecodingPipeline(input: string | Buffer, options: DecodeToBufferOptions) {
    let pipeline = sharp(input, {
      // some invalid images can still be processed by sharp, but we want to fail on them by default to avoid crashes
      failOn: options.processInvalidImages ? 'none' : 'error',
      limitInputPixels: false,
      raw: options.raw,
      unlimited: true,
    })
      .pipelineColorspace(options.colorspace === Colorspace.Srgb ? 'srgb' : 'rgb16')
      .withIccProfile(options.colorspace);

    if (!options.raw) {
      const { angle, flip, flop } = options.orientation ? ORIENTATION_TO_SHARP_ROTATION[options.orientation] : {};
      pipeline = pipeline.rotate(angle);
      if (flip) {
        pipeline = pipeline.flip();
      }

      if (flop) {
        pipeline = pipeline.flop();
      }
    }

    if (options.edits && options.edits.length > 0) {
      pipeline = await this.applyEdits(pipeline, options.edits);
    }

    if (options.size !== undefined) {
      pipeline = pipeline.resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true });
    }
    return pipeline;
  }

  @Traced('media.generateThumbhash')
  async generateThumbhash(input: string | Buffer, options: GenerateThumbhashOptions): Promise<Buffer> {
    const span = trace.getActiveSpan();
    span?.setAttribute('media.colorspace', options.colorspace);

    const [{ rgbaToThumbHash }, decodingPipeline] = await Promise.all([
      import('thumbhash'),
      this.getImageDecodingPipeline(input, {
        colorspace: options.colorspace,
        processInvalidImages: options.processInvalidImages,
        raw: options.raw,
        edits: options.edits,
      }),
    ]);

    const pipeline = decodingPipeline.resize(100, 100, { fit: 'inside', withoutEnlargement: true }).raw().ensureAlpha();

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    span?.setAttribute('media.thumbhash.width', info.width);
    span?.setAttribute('media.thumbhash.height', info.height);

    return Buffer.from(rgbaToThumbHash(info.width, info.height, data));
  }

  @Traced('ffmpeg.probe')
  async probe(input: string, options?: ProbeOptions): Promise<VideoInfo> {
    const span = trace.getActiveSpan();
    span?.setAttribute('ffmpeg.countFrames', options?.countFrames ?? false);

    const results = await probe(input, options?.countFrames ? ['-count_packets'] : []); // gets frame count quickly: https://stackoverflow.com/a/28376817

    span?.setAttribute('ffmpeg.duration', this.parseFloat(results.format.duration));
    span?.setAttribute('ffmpeg.videoStreams', results.streams.filter((s) => s.codec_type === 'video').length);
    span?.setAttribute('ffmpeg.audioStreams', results.streams.filter((s) => s.codec_type === 'audio').length);

    return {
      format: {
        formatName: results.format.format_name,
        formatLongName: results.format.format_long_name,
        duration: this.parseFloat(results.format.duration),
        bitrate: this.parseInt(results.format.bit_rate),
      },
      videoStreams: results.streams
        .filter((stream) => stream.codec_type === 'video')
        .filter((stream) => !stream.disposition?.attached_pic)
        .map((stream) => ({
          index: stream.index,
          height: this.parseInt(stream.height),
          width: this.parseInt(stream.width),
          codecName: stream.codec_name === 'h265' ? 'hevc' : stream.codec_name,
          codecType: stream.codec_type,
          frameCount: this.parseInt(options?.countFrames ? stream.nb_read_packets : stream.nb_frames),
          rotation: this.parseInt(stream.rotation),
          isHDR: stream.color_transfer === 'smpte2084' || stream.color_transfer === 'arib-std-b67',
          bitrate: this.parseInt(stream.bit_rate),
          pixelFormat: stream.pix_fmt || 'yuv420p',
          colorPrimaries: stream.color_primaries,
          colorSpace: stream.color_space,
          colorTransfer: stream.color_transfer,
        })),
      audioStreams: results.streams
        .filter((stream) => stream.codec_type === 'audio')
        .map((stream) => ({
          index: stream.index,
          codecType: stream.codec_type,
          codecName: stream.codec_name,
          bitrate: this.parseInt(stream.bit_rate),
        })),
    };
  }

  transcode(input: string, output: string | Writable, options: TranscodeCommand): Promise<void> {
    const span = tracer.startSpan('ffmpeg.transcode', { kind: SpanKind.INTERNAL }, context.active());
    span.setAttribute('ffmpeg.twoPass', options.twoPass ?? false);
    span.setAttribute('ffmpeg.frameCount', options.progress.frameCount);

    const endSpan = (error?: Error) => {
      if (error) {
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        span.recordException(error);
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.end();
    };

    if (!options.twoPass) {
      return new Promise((resolve, reject) => {
        this.configureFfmpegCall(input, output, options)
          .on('error', (error) => {
            endSpan(error);
            reject(error);
          })
          .on('end', () => {
            endSpan();
            resolve();
          })
          .run();
      });
    }

    if (typeof output !== 'string') {
      const error = new TypeError('Two-pass transcoding does not support writing to a stream');
      endSpan(error);
      throw error;
    }

    // two-pass allows for precise control of bitrate at the cost of running twice
    // recommended for vp9 for better quality and compression
    return new Promise((resolve, reject) => {
      // first pass output is not saved as only the .log file is needed
      this.configureFfmpegCall(input, '/dev/null', options)
        .addOptions('-pass', '1')
        .addOptions('-passlogfile', output)
        .addOptions('-f null')
        .on('error', (error) => {
          endSpan(error);
          reject(error);
        })
        .on('end', () => {
          // second pass
          this.configureFfmpegCall(input, output, options)
            .addOptions('-pass', '2')
            .addOptions('-passlogfile', output)
            .on('error', (error) => {
              endSpan(error);
              reject(error);
            })
            .on('end', () => handlePromiseError(fs.unlink(`${output}-0.log`), this.logger))
            .on('end', () => handlePromiseError(fs.rm(`${output}-0.log.mbtree`, { force: true }), this.logger))
            .on('end', () => {
              endSpan();
              resolve();
            })
            .run();
        })
        .run();
    });
  }

  @Traced('media.getImageDimensions')
  async getImageDimensions(input: string | Buffer): Promise<ImageDimensions> {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    const span = trace.getActiveSpan();
    span?.setAttribute('media.width', width);
    span?.setAttribute('media.height', height);
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
    if (this.logger.isLevelEnabled(LogLevel.Debug) && frameCount && frameInterval) {
      let lastProgressFrame: number = 0;
      ffmpegCall.on('progress', (progress: ProgressEvent) => {
        if (progress.frames - lastProgressFrame < frameInterval) {
          return;
        }

        lastProgressFrame = progress.frames;
        const percent = ((progress.frames / frameCount) * 100).toFixed(2);
        const ms = progress.currentFps ? Math.floor((frameCount - progress.frames) / progress.currentFps) * 1000 : 0;
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

  private parseFloat(value: string | number | undefined): number {
    return Number.parseFloat(value as string) || 0;
  }
}
