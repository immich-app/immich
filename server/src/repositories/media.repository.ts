import { Injectable } from '@nestjs/common';
import { ExifDateTime, exiftool, WriteTags } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
// TODO solve type problem, or find a better way to extract each image from heic container
// @ts-ignore
import * as libheif from 'libheif-js';
import { Duration } from 'luxon';
import fs from 'node:fs/promises';
import { Writable } from 'node:stream';
import sharp from 'sharp';
import { ORIENTATION_TO_SHARP_ROTATION } from 'src/constants';
import { Exif } from 'src/database';
import { Colorspace, ImageFormat, LogLevel, RawExtractedFormat } from 'src/enum';
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

interface HeifDecoder {
  decode(data: Uint8Array): HeifImage[];
}

interface HeifImage {
  get_width(): number;
  get_height(): number;
  display(options: HeifDisplayOptions, callback: (data: HeifDisplayData | null) => void): void;
}

interface HeifDisplayOptions {
  data: Uint8Array;
  width: number;
  height: number;
}

interface HeifDisplayData {
  data: Uint8Array;
  width: number;
  height: number;
}

interface HeifModule {
  HeifDecoder: new () => HeifDecoder;
}

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

export interface StereoscopicResult {
  leftEye: Buffer;
  rightEye: Buffer;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface StereoImageOptions {
  colorspace: Colorspace;
  format: ImageFormat;
  quality: number;
  size?: number;
}

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
      return { buffer, format: RawExtractedFormat.JPEG };
    } catch (error: any) {
      this.logger.debug('Could not extract JpgFromRaw2 buffer from image, trying JPEG from RAW next', error.message);
    }

    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('JpgFromRaw', input);
      return { buffer, format: RawExtractedFormat.JPEG };
    } catch (error: any) {
      this.logger.debug('Could not extract JPEG buffer from image, trying PreviewJXL next', error.message);
    }

    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('PreviewJXL', input);
      return { buffer, format: RawExtractedFormat.JXL };
    } catch (error: any) {
      this.logger.debug('Could not extract PreviewJXL buffer from image, trying PreviewImage next', error.message);
    }

    try {
      const buffer = await exiftool.extractBinaryTagToBuffer('PreviewImage', input);
      return { buffer, format: RawExtractedFormat.JPEG };
    } catch (error: any) {
      this.logger.debug('Could not extract preview buffer from image', error.message);
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

  decodeImage(input: string | Buffer, options: DecodeToBufferOptions) {
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

  async extractStereoscopicImage(
    input: string | Buffer,
    options: StereoImageOptions
  ): Promise<StereoscopicResult> {
    const { info, data } = await this.decodeImage(input, {
      colorspace: options.colorspace,
      processInvalidImages: false,
      size: options.size
    });

    if (info.width % 2 !== 0) {
      throw new Error('Invalid stereoscopic image: width must be even');
    }

    const halfWidth = info.width / 2;
    
    const leftEye = await sharp(data, { raw: info })
      .extract({ left: 0, top: 0, width: halfWidth, height: info.height })
      .toFormat(options.format, { quality: options.quality })
      .toBuffer();

    const rightEye = await sharp(data, { raw: info })  
      .extract({ left: halfWidth, top: 0, width: halfWidth, height: info.height })
      .toFormat(options.format, { quality: options.quality })
      .toBuffer();

    return {
      leftEye,
      rightEye,
      dimensions: {
        width: halfWidth,
        height: info.height
      }
    };
  }

  private async processHeicImage(data: Buffer): Promise<Buffer[]> {
    const heif = libheif;
    
    const decoder = new heif.HeifDecoder();
    this.logger.debug('Decoding HEIC image');
    this.logger.debug(`File size: ${data.length} bytes`);
    this.logger.debug(`First 100 bytes: ${data.slice(0, 100).toString('hex')}`);


    const images = decoder.decode(new Uint8Array(data));
    
    if (!images || !images.length) {
      throw new Error("No images found in HEIC file");
    }

    // Filter only valid images
    const validImages: HeifImage[] = images.filter((img: HeifImage) => {
      try {
        return img.get_width() > 0 && img.get_height() > 0;
      } catch (e) {
        return false;
      }
    });

    if (validImages.length === 0) {
      throw new Error("No valid images found in HEIC file");
    }

    // Process each valid image
    const processedImages = await Promise.all(validImages.map(async (img: HeifImage) => {
      const width = img.get_width();
      const height = img.get_height();

      // Create raw buffer for the image data
      const rawData = new Uint8Array(width * height * 4);
      
      // Setup RGBA data
      for (let i = 3; i < rawData.length; i += 4) {
        rawData[i] = 255; // Set alpha channel
      }

      // Use display method to get pixel data
      return new Promise<Buffer>((resolve, reject) => {
        img.display({ data: rawData, width, height }, async (displayData: HeifDisplayData | null) => {
          if (!displayData) {
            reject(new Error("Failed to process image"));
            return;
          }

          // Convert to sharp-compatible format
          try {
            // Log the data before passing to sharp
            this.logger.debug(`Processing image chunk: ${displayData.width}x${displayData.height}, channels: 4, data length: ${displayData.data.length}`);
            this.logger.debug(`First 16 bytes of displayData: ${Buffer.from(displayData.data.slice(0, 16)).toString('hex')}`);

            const sharpImage = sharp(Buffer.from(displayData.data), {
              raw: {
                width: displayData.width,
                height: displayData.height,
                channels: 4
              }
            });

            // Convert to JPEG buffer before resolving
            const buffer = await sharpImage.jpeg().toBuffer();
            resolve(buffer);
          } catch (err) {
            this.logger.error(`Sharp processing error in processHeicImage: ${err}`); // Add specific error logging
            reject(err);
          }
        });
      });
    }));

    return processedImages; // Return all processed images
  }

  async generateWebXrThumbnail(input: string | Buffer, outputPath: string, options: GenerateThumbnailOptions): Promise<void> {
    try {
      // Convert input to Buffer if it's a file path
      const inputBuffer = typeof input === 'string' ? await fs.readFile(input) : input;
      
      // Process HEIC image - expecting an array of buffers (views)
      const processedBuffers = await this.processHeicImage(inputBuffer);

      // Check if we got exactly two images (left and right eye)
      if (processedBuffers.length < 2) {
        throw new Error(`Expected at least 2 images for stereo thumbnail, but found ${processedBuffers.length}`);
      }

      // Assuming the order is [primary, left, right] or just [left, right] if no primary
      // Swap the assignment to correct the eye order
      const rightEyeBuffer = processedBuffers.length === 3 ? processedBuffers[1] : processedBuffers[0]; // This was left, now right
      const leftEyeBuffer = processedBuffers.length === 3 ? processedBuffers[2] : processedBuffers[1]; // This was right, now left
      const primaryBuffer = processedBuffers.length === 3 ? processedBuffers[0] : null; // Keep track if primary exists

      this.logger.debug(`Using Left eye buffer size: ${leftEyeBuffer.length}`); // Log remains the same variable name
      this.logger.debug(`Using Right eye buffer size: ${rightEyeBuffer.length}`); // Log remains the same variable name
      if (primaryBuffer) {
        this.logger.debug(`Primary buffer size: ${primaryBuffer.length}`);
      }


      // Get dimensions from the left eye image buffer (now expected to be JPEG)
      const imageInfo = await sharp(leftEyeBuffer).metadata();
      const width = imageInfo.width || 0; // Width of a single eye
      const height = imageInfo.height || 0; // Height of a single eye

      // Note: HEIC stereo images are usually full width per eye,
      // so the final composite width is width * 2.
      const compositeWidth = width * 2;

      // Create final composite image
      await sharp({
        create: {
          width: compositeWidth,
          height: height,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      })
      .composite([
        // Input buffers are now expected to be JPEG or similar
        // Swap the inputs in the composite array as well
        { input: leftEyeBuffer, left: 0, top: 0 },         // Left eye buffer goes first (position 0)
        { input: rightEyeBuffer, left: width, top: 0 }      // Right eye buffer goes second (position width)
      ])
      .toFormat(options.format, { // Output format as requested by options
        quality: options.quality,
        chromaSubsampling: options.quality >= 80 ? '4:4:4' : '4:2:0'
      })
      .toFile(outputPath);

    } catch (error) {
      this.logger.error('Error generating WebXR thumbnail:', error);
      throw error;
    }
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
      const { angle, flip, flop } = options.orientation ? ORIENTATION_TO_SHARP_ROTATION[options.orientation] : {};
      pipeline = pipeline.rotate(angle);
      if (flip) {
        pipeline = pipeline.flip();
      }

      if (flop) {
        pipeline = pipeline.flop();
      }
    }

    if (options.crop) {
      pipeline = pipeline.extract(options.crop);
    }

    if (options.size !== undefined) {
      pipeline = pipeline.resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true });
    }
    return pipeline;
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

  async getImageDimensions(input: string | Buffer): Promise<ImageDimensions> {
    const { width = 0, height = 0 } = await sharp(input).metadata();
    return { width, height };
  }

  async transcodeSpatialVideoToSBS(input: string, output: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.configureFfmpegCall(input, output, {
        inputOptions: [
          // Increase analysis time for proper spatial video processing
          '-analyzeduration', '10000000',
          '-probesize', '10000000'
        ],
        outputOptions: [
          // Extract both views from spatial video and combine them
          '-filter_complex', '[0:v:view:0][0:v:view:1]hstack',
          // Copy the main audio stream
          '-map', '0:a:0',
          '-c:v', 'libx264',
          '-preset', 'slower', // Higher quality encoding
          '-b:v', '20M', // Video bitrate 20 Mbps
          '-maxrate', '20M', // Maximum bitrate
          '-bufsize', '20M', // Buffer size
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart'
        ],
        progress: {
          frameCount: 0,
          percentInterval: 10
        },
        twoPass: false
      })
      .on('error', reject)
      .on('end', () => resolve())
      .run();
    });
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
