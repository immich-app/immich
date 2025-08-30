import { Injectable } from '@nestjs/common';
import { BinaryField, DefaultReadTaskOptions, ExifTool, Tags } from 'exiftool-vendored';
import geotz from 'geo-tz';
import fs from 'node:fs/promises';
import path from 'node:path';
import { LoggingRepository } from 'src/repositories/logging.repository';

interface ExifDuration {
  Value: number;
  Scale?: number;
}

type StringOrNumber = string | number;

type TagsWithWrongTypes =
  | 'FocalLength'
  | 'Duration'
  | 'Description'
  | 'ImageDescription'
  | 'RegionInfo'
  | 'TagsList'
  | 'Keywords'
  | 'HierarchicalSubject'
  | 'ISO';

export interface ImmichTags extends Omit<Tags, TagsWithWrongTypes> {
  ContentIdentifier?: string;
  MotionPhoto?: number;
  MotionPhotoVersion?: number;
  MotionPhotoPresentationTimestampUs?: number;
  MediaGroupUUID?: string;
  ImagePixelDepth?: string;
  FocalLength?: number;
  Duration?: number | string | ExifDuration;
  EmbeddedVideoType?: string;
  EmbeddedVideoFile?: BinaryField;
  MotionPhotoVideo?: BinaryField;
  TagsList?: StringOrNumber[];
  HierarchicalSubject?: StringOrNumber[];
  Keywords?: StringOrNumber | StringOrNumber[];
  ISO?: number | number[];

  // Type is wrong, can also be number.
  Description?: StringOrNumber;
  ImageDescription?: StringOrNumber;

  // Extended properties for image regions, such as faces
  RegionInfo?: {
    AppliedToDimensions: {
      W: number;
      H: number;
      Unit: string;
    };
    RegionList: {
      Area: {
        // (X,Y) // center of the rectangle
        X: number;
        Y: number;
        W: number;
        H: number;
        Unit: string;
      };
      Rotation?: number;
      Type?: string;
      Name?: string;
    }[];
  };

  Device?: {
    Manufacturer?: string;
    ModelName?: string;
  };

  AndroidMake?: string;
  AndroidModel?: string;

  MIMEEncoding?: string;
}

@Injectable()
export class MetadataRepository {
  private exiftool = new ExifTool({
    defaultVideosToUTC: true,
    backfillTimezones: true,
    inferTimezoneFromDatestamps: true,
    inferTimezoneFromTimeStamp: true,
    useMWG: true,
    numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength', 'FileSize'],
    /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
    geoTz: (lat, lon) => geotz.find(lat, lon)[0],
    geolocation: true,
    // Enable exiftool LFS to parse metadata for files larger than 2GB.
    readArgs: ['-api', 'largefilesupport=1'],
    writeArgs: ['-api', 'largefilesupport=1', '-overwrite_original'],
  });

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MetadataRepository.name);
  }

  setMaxConcurrency(concurrency: number) {
    this.exiftool.batchCluster.setMaxProcs(concurrency);
  }

  async teardown() {
    await this.exiftool.end();
  }

  async readTags(filePath: string): Promise<ImmichTags> {
    try {
      const tags = (await this.exiftool.read(filePath)) as ImmichTags;

      // exiftool 13.25+ may skip XMP payload parsing for UTF-16LE XMP
      // (https://github.com/exiftool/exiftool/issues/348)
      const needsUtf8Normalization = tags.FileType === 'XMP' && tags.MIMEEncoding === 'utf-16le';

      if (!needsUtf8Normalization) {
        return tags;
      }

      try {
        // Create a temporary UTF-8 copy
        const xmpContent = await fs.readFile(filePath, 'utf-16le');
        const tmpDir = await fs.mkdtemp('immich-metadata-');
        const tmpFile = path.join(tmpDir, path.basename(filePath));
        await fs.writeFile(tmpFile, xmpContent, 'utf8');

        // Try parsing the converted XMP file using exiftool
        try {
          return (await this.exiftool.read(tmpFile)) as ImmichTags;
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
        }
      } catch (fallbackError) {
        this.logger.warn(`UTF-8 normalization failed (${filePath}): ${fallbackError}`);
        return tags;
      }
    } catch (error) {
      this.logger.warn(`Error reading exif data (${filePath}): ${error}`, (error as Error).stack);
      return {};
    }
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
