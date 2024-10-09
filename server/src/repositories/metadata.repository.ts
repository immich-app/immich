import { Inject, Injectable } from '@nestjs/common';
import { DefaultReadTaskOptions, ExifTool, Tags } from 'exiftool-vendored';
import geotz from 'geo-tz';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMetadataRepository, ImmichTags } from 'src/interfaces/metadata.interface';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@Injectable()
export class MetadataRepository implements IMetadataRepository {
  private exiftool = new ExifTool({
    defaultVideosToUTC: true,
    backfillTimezones: true,
    inferTimezoneFromDatestamps: true,
    inferTimezoneFromTimeStamp: true,
    useMWG: true,
    numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength'],
    /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
    geoTz: (lat, lon) => geotz.find(lat, lon)[0],
    // Enable exiftool LFS to parse metadata for files larger than 2GB.
    readArgs: ['-api', 'largefilesupport=1'],
    writeArgs: ['-api', 'largefilesupport=1', '-overwrite_original'],
  });

  constructor(@Inject(ILoggerRepository) private logger: ILoggerRepository) {
    this.logger.setContext(MetadataRepository.name);
  }

  async teardown() {
    await this.exiftool.end();
  }

  readTags(path: string): Promise<ImmichTags> {
    return this.exiftool.read(path).catch((error) => {
      this.logger.warn(`Error reading exif data (${path}): ${error}`, error?.stack);
      return {};
    }) as Promise<ImmichTags>;
  }

  extractBinaryTag(path: string, tagName: string): Promise<Buffer> {
    return this.exiftool.extractBinaryTagToBuffer(tagName, path);
  }

  async writeTags(path: string, tags: Partial<Tags>): Promise<void> {
    try {
      await this.exiftool.write(path, tags);
    } catch (error) {
      this.logger.warn(`Error writing exif data (${path}): ${error}`);
    }
  }
}
