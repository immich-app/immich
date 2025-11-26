import { Injectable } from '@nestjs/common';
import { ExifDateTime, exiftool, WriteTags } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Duration } from 'luxon';
import fs from 'node:fs/promises';
import { Writable } from 'node:stream';
import sharp from 'sharp';
import { ORIENTATION_TO_SHARP_ROTATION } from 'src/constants';
import { Exif } from 'src/database';
import { EditActionItem } from 'src/dtos/editing.dto';
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

export type ExtractResult = {
  buffer: Buffer;
  format: RawExtractedFormat;
};

@Injectable()
export class MediaRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MediaRepository.name);
  }

  /**
   *
   * @param input file path to the input image
   * @returns ExtractResult if succeeded, or null if failed
   */
  async extract(input: string): Promise<ExtractResult | null> {
    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('JpgFromRaw2', input);
      return { buffer, format: RawExtractedFormat.Jpeg };
    } catch (error: any) {
      this.logger.debug(`Could not extract JpgFromRaw2 buffer from image, trying JPEG from RAW next: ${error}`);
    }

    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('JpgFromRaw', input);
      return { buffer, format: RawExtractedFormat.Jpeg };
    } catch (error: any) {
      this.logger.debug(`Could not extract JPEG buffer from image, trying PreviewJXL next: ${error}`);
    }

    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('PreviewJXL', input);
      return { buffer, format: RawExtractedFormat.Jxl };
    } catch (error: any) {
      this.logger.debug(`Could not extract PreviewJXL buffer from image, trying PreviewImage next: ${error}`);
    }

    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('PreviewImage', input);
      return { buffer, format: RawExtractedFormat.Jpeg };
    } catch (error: any) {
      this.logger.debug(`Could not extract preview buffer from image: ${error}`);
      return null;
    }
  }

  async writeExif(tags: Partial<Exif>, output: string): Promise<boolean> {
    try {
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
        // specially convert Orientation to numeric Orientation# for exiftool
        'Orientation#': tags.orientation ? Number(tags.orientation) : undefined,
      };

      await exiftool.write(output, tagsToWrite, {
        ignoreMinorErrors: true,
        writeArgs: ['-overwrite_original'],
      });
      return true;
    } catch (error: any) {
      this.logger.warn(`Could not write exif data to image: ${error.message}`);
      return false;
    }
  }

  async copyTagGroup(tagGroup: string, source: string, target: string): Promise<boolean> {
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
    } catch (error: any) {
      this.logger.warn(`Could not copy tag data to image: ${error.message}`);
      return false;
    }
  }

  async decodeImage(input: string | Buffer, options: DecodeToBufferOptions) {
    return (await this.getImageDecodingPipeline(input, options)).raw().toBuffer({ resolveWithObject: true });
  }

  private cropLRTBtoTLWH(
    dimensions: ImageDimensions,
    crop: { left: number; top: number; right: number; bottom: number },
  ): { left: number; top: number; width: number; height: number } {
    const leftPx = Math.round(crop.left * dimensions.width);
    const topPx = Math.round(crop.top * dimensions.height);
    const rightPx = Math.round(crop.right * dimensions.width);
    const bottomPx = Math.round(crop.bottom * dimensions.height);

    const width = dimensions.width - rightPx - leftPx;
    const height = dimensions.height - bottomPx - topPx;

    return { left: leftPx, top: topPx, width, height };
  }

  private applyEdit(input: sharp.Sharp, edit: EditActionItem, dimensions: ImageDimensions): sharp.Sharp {
    switch (edit.action) {
      case 'crop': {
        // Convert from relative LRTB to top left, width height
        const { left, top, width, height } = this.cropLRTBtoTLWH(dimensions, edit.parameters);
        return input.extract({ left, top, width, height });
      }
      case 'rotate': {
        const { angle } = edit.parameters;
        return input.rotate(angle);
      }
      case 'mirror': {
        const { axis } = edit.parameters;
        if (axis === 'horizontal') {
          return input.flop();
        } else {
          return input.flip();
        }
      }
      default:
        return input;
    }
  }

  private async applyEdits(pipeline: sharp.Sharp, edits: EditActionItem[]): Promise<sharp.Sharp> {
    let currentDimensions: ImageDimensions = await pipeline.metadata();

    for (const edit of edits) {
      pipeline = this.applyEdit(pipeline, edit, currentDimensions);

      // Each edit requires a new sharp context.
      // There is a bunch of weird behavior in sharp if
      // we try to chain edits in a single context
      // see: https://github.com/lovell/sharp/issues/241
      const currentBuffer = await pipeline.png().toBuffer({ resolveWithObject: true });
      pipeline = sharp(currentBuffer.data);

      currentDimensions = currentBuffer.info;
    }

    return pipeline;
  }

  async generateThumbnail(input: string | Buffer, options: GenerateThumbnailOptions, output: string): Promise<void> {
    const decoded = (await this.getImageDecodingPipeline(input, options)).toFormat(options.format, {
      quality: options.quality,
      // this is default in libvips (except the threshold is 90), but we need to set it manually in sharp
      chromaSubsampling: options.quality >= 80 ? '4:4:4' : '4:2:0',
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

    // TODO: convert these to edits or autoOrient option in sharp?
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

  async generateThumbhash(input: string | Buffer, options: GenerateThumbhashOptions): Promise<Buffer> {
    const [{ rgbaToThumbHash }, pipeline] = await Promise.all([
      import('thumbhash'),
      (
        await this.getImageDecodingPipeline(input, {
          colorspace: options.colorspace,
          processInvalidImages: options.processInvalidImages,
          raw: options.raw,
          edits: options.edits,
        })
      )
        .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
        .raw()
        .ensureAlpha(),
    ]);

    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

    return Buffer.from(rgbaToThumbHash(info.width, info.height, data));
  }

  async probe(input: string, options?: ProbeOptions): Promise<VideoInfo> {
    const results = await probe(input, options?.countFrames ? ['-count_packets'] : []); // gets frame count quickly: https://stackoverflow.com/a/28376817
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

  async getImageDimensions(input: string | Buffer): Promise<ImageDimensions> {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    return { width, height };
  }

  async getEditedImageDimensions(input: string | Buffer, edits: EditActionItem[]): Promise<ImageDimensions> {
    let dimensions: ImageDimensions = await (
      await this.getImageDecodingPipeline(input, {
        colorspace: Colorspace.Srgb,
        processInvalidImages: false,
        edits: edits,
      })
    ).metadata();

    return {
      width: dimensions.width,
      height: dimensions.height,
    };
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
