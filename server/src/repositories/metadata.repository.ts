import { Injectable } from '@nestjs/common';
import {
  BinaryField,
  DefaultReadTaskOptions,
  ExifDateTime,
  ExifTool,
  ExifToolOptions,
  ReadTaskOptions,
  Tags,
} from 'exiftool-vendored';
import geotz from 'geo-tz';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { mimeTypes } from 'src/utils/mime-types.js';

interface ExifDuration {
  Value: number;
  Scale?: number;
}

type StringOrNumber = string | number;

interface ImmichTagOverrides {
  ContentIdentifier?: string;
  MotionPhoto?: number;
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
  SourceImageCreateTime?: ExifDateTime | string;

  // Type is wrong, can also be number.
  Description?: StringOrNumber;
  ImageDescription?: StringOrNumber;

  // Apparently LensModel can also be a float: https://github.com/immich-app/immich/issues/30492
  LensModel?: StringOrNumber;

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
        X: number | string;
        Y: number | string;
        W: number | string;
        H: number | string;
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
  DeviceManufacturer?: string;
  DeviceModelName?: string;

  // Samsung specific tags
  Author?: string;
  SamsungModel?: string;
}

export const IMMICH_TAGS = [
  'AndroidMake',
  'AndroidModel',
  'Author',
  'BitDepth',
  'BitsPerSample',
  'BurstID',
  'BurstUUID',
  'CameraBurstID',
  'ColorBitDepth',
  'ColorSpace',
  'ComponentBitDepth',
  'ContainerDirectory',
  'ContentIdentifier',
  'CreateDate',
  'CreationDate',
  'DateTimeCreated',
  'DateTimeOriginal',
  'DateTimeUTC',
  'Description',
  'Device',
  'DeviceManufacturer',
  'DeviceModelName',
  'Duration',
  'EmbeddedVideoFile',
  'EmbeddedVideoType',
  'ExposureTime',
  'FNumber',
  'FocalLength',
  'GPSDateTime',
  'GPSLatitude',
  'GPSLongitude',
  'HierarchicalSubject',
  'ImageDescription',
  'ImageHeight',
  'ImagePixelDepth',
  'ImageSize',
  'ImageWidth',
  'ISO',
  'Keywords',
  'LensID',
  'LensModel',
  'LensSpec',
  'LensType',
  'Make',
  'MediaCreateDate',
  'MediaGroupUUID',
  'MediaUniqueID',
  'MicroVideo',
  'MicroVideoOffset',
  'Model',
  'MotionPhoto',
  'MotionPhotoVideo',
  'Orientation',
  'ProfileDescription',
  'ProjectionType',
  'Rating',
  'RecommendedExposureIndex',
  'RegionInfo',
  'Rotation',
  'SamsungModel',
  'SonyDateTime2',
  'SourceImageCreateTime',
  'StandardOutputSensitivity',
  'SubSecCreateDate',
  'SubSecDateTimeOriginal',
  'TagsList',
  'tz',
  'VideoFrameRate',
  'zone',
  'zoneSource',
] as const satisfies readonly (keyof Tags | keyof ImmichTagOverrides)[];

type ImmichTag = (typeof IMMICH_TAGS)[number];

export interface ImmichTags
  extends
    Omit<Pick<Tags, Extract<ImmichTag, keyof Tags>>, keyof ImmichTagOverrides>,
    Pick<ImmichTagOverrides, Extract<ImmichTag, keyof ImmichTagOverrides>> {}

export const exiftoolOptions: Partial<ExifToolOptions> = {
  defaultVideosToUTC: true,
  backfillTimezones: true,
  inferTimezoneFromDatestamps: true,
  inferTimezoneFromTimeStamp: true,
  useMWG: true,
  numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength', 'FileSize', 'Rotation'],
  /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
  // eslint-disable-next-line import-x/no-named-as-default-member
  geoTz: (lat, lon) => geotz.find(lat, lon)[0],
  geolocation: true,
  readArgs: [
    // Enable exiftool LFS to parse metadata for files larger than 2GB.
    '-api',
    'largefilesupport=1',
    '--ICC_Profile:DeviceManufacturer',
    '--ICC_Profile:DeviceModelName',
    // Ignore embedded thumbnail dimensions/orientation for the main asset.
    '--IFD1:Orientation',
    '--MWG:Orientation',
    '--IFD1:ImageWidth',
    '--IFD1:ImageHeight',
    '--Samsung:Rotation',
  ],
  writeArgs: ['-api', 'largefilesupport=1', '-overwrite_original'],
  taskTimeoutMillis: 2 * 60 * 1000,
};

@Injectable()
export class MetadataRepository {
  private exiftool = new ExifTool(exiftoolOptions);

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MetadataRepository.name);
  }

  setMaxConcurrency(concurrency: number) {
    this.exiftool.batchCluster.setMaxProcs(concurrency);
  }

  async teardown() {
    await this.exiftool.end();
  }

  readTags(path: string): Promise<ImmichTags> {
    const options: ReadTaskOptions | undefined = mimeTypes.isVideo(path) ? { readArgs: ['-ee'] } : undefined;

    return this.exiftool.read(path, options).catch((error) => {
      this.logger.warn(`Error reading exif data (${path}): ${error}\n${error?.stack}`);
      return {};
    }) as Promise<ImmichTags>;
  }

  extractBinaryTag(path: string, tagName: string): Promise<Buffer> {
    return this.exiftool.extractBinaryTagToBuffer(tagName, path);
  }

  async writeTags(path: string, tags: Partial<Tags>): Promise<void> {
    // If exiftool assigns a field with ^= instead of =, empty values will be written too.
    // Since exiftool-vendored doesn't support an option for this, we append the ^ to the name of the tag instead.
    // https://exiftool.org/exiftool_pod.html#:~:text=is%20used%20to%20write%20an%20empty%20string
    const tagsToWrite = Object.fromEntries(Object.entries(tags).map(([key, value]) => [`${key}^`, value]));
    try {
      await this.exiftool.write(path, tagsToWrite);
    } catch (error) {
      this.logger.warn(`Error writing exif data (${path}): ${error}`);
    }
  }
}
