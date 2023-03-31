import { IMediaRepository, ResizeOptions } from '@app/domain';
import { exiftool } from 'exiftool-vendored';
import ffmpeg from 'fluent-ffmpeg';
import sharp from 'sharp';

export class MediaRepository implements IMediaRepository {
  extractThumbnailFromExif(input: string, output: string): Promise<void> {
    return exiftool.extractThumbnail(input, output);
  }

  async resize(input: string, output: string, options: ResizeOptions): Promise<void> {
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
}
