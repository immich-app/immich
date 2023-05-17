import { CropOptions, IMediaRepository, ResizeOptions, VideoInfo } from '@app/domain';
import { exiftool } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import sharp from 'sharp';
import { promisify } from 'util';

const probe = promisify<string, FfprobeData>(ffmpeg.ffprobe);

export class MediaRepository implements IMediaRepository {
  crop(input: string, options: CropOptions): Promise<Buffer> {
    return sharp(input, { failOnError: false })
      .extract({
        left: options.left,
        top: options.top,
        width: options.width,
        height: options.height,
      })
      .toBuffer();
  }

  extractThumbnailFromExif(input: string, output: string): Promise<void> {
    return exiftool.extractThumbnail(input, output);
  }

  async resize(input: string | Buffer, output: string, options: ResizeOptions): Promise<void> {
    switch (options.format) {
      case 'webp':
        await sharp(input, { failOnError: false })
          .resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true })
          .webp()
          .rotate()
          .toFile(output);
        return;

      case 'jpeg':
        await sharp(input, { failOnError: false })
          .resize(options.size, options.size, { fit: 'outside', withoutEnlargement: true })
          .jpeg()
          .rotate()
          .toFile(output);
        return;
    }
  }

  extractVideoThumbnail(input: string, output: string, size: number) {
    return new Promise<void>((resolve, reject) => {
      ffmpeg(input)
        .outputOptions([
          '-ss 00:00:00.000',
          '-frames:v 1',
          `-vf scale='min(${size},iw)':'min(${size},ih)':force_original_aspect_ratio=increase`,
        ])
        .output(output)
        .on('error', reject)
        .on('end', resolve)
        .run();
    });
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
          height: stream.height || 0,
          width: stream.width || 0,
          codecName: stream.codec_name,
          codecType: stream.codec_type,
          frameCount: Number.parseInt(stream.nb_frames ?? '0'),
          rotation: Number.parseInt(`${stream.rotation ?? 0}`),
        })),
      audioStreams: results.streams
        .filter((stream) => stream.codec_type === 'audio')
        .map((stream) => ({
          codecType: stream.codec_type,
          codecName: stream.codec_name,
        })),
    };
  }

  transcode(input: string, output: string, options: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(input, { niceness: 10 })
        //
        .outputOptions(options)
        .output(output)
        .on('error', reject)
        .on('end', resolve)
        .run();
    });
  }
}
