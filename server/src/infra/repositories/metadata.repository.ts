import { GeoPoint, IMetadataRepository, ImmichTags, ReverseGeocodeResult } from '@app/domain';
import { REVERSE_GEOCODING_DUMP_DIRECTORY } from '@app/infra';
import { Injectable, Logger } from '@nestjs/common';
import { ExifDateTime, ReadTaskOptions, exiftool } from 'exiftool-vendored';
import { firstDateTime } from 'exiftool-vendored/dist/FirstDateTime';
import { readdir, rm } from 'fs/promises';
import * as geotz from 'geo-tz';
import { getName } from 'i18n-iso-countries';
import geocoder, { AddressObject, InitOptions } from 'local-reverse-geocoder';
import { Duration } from 'luxon';
import path from 'path';
import { promisify } from 'util';
import { AssetEntity, AssetType, ExifEntity } from '../entities';

export interface AdminCode {
  name: string;
  asciiName: string;
  geoNameId: string;
}

export type GeoData = AddressObject & {
  admin1Code?: AdminCode | string;
  admin2Code?: AdminCode | string;
};

const exifDate = (dt: ExifDateTime | string | undefined) => (dt instanceof ExifDateTime ? dt?.toDate() : null);
// exiftool returns strings when it fails to parse non-string values, so this is used where a string is not expected
const validate = <T>(value: T): T | null => (typeof value === 'string' ? null : value ?? null);
const lookup = promisify<GeoPoint[], number, AddressObject[][]>(geocoder.lookUp).bind(geocoder);

@Injectable()
export class MetadataRepository implements IMetadataRepository {
  private logger = new Logger(MetadataRepository.name);

  async init(options: Partial<InitOptions>): Promise<void> {
    return new Promise<void>((resolve) => {
      geocoder.init(
        {
          load: {
            admin1: true,
            admin2: true,
            admin3And4: false,
            alternateNames: false,
          },
          countries: [],
          dumpDirectory: REVERSE_GEOCODING_DUMP_DIRECTORY,
          ...options,
        },
        resolve,
      );
    });
  }

  async deleteCache() {
    const dumpDirectory = REVERSE_GEOCODING_DUMP_DIRECTORY;
    if (dumpDirectory) {
      // delete contents
      const items = await readdir(dumpDirectory, { withFileTypes: true });
      const folders = items.filter((item) => item.isDirectory());
      for (const { name } of folders) {
        await rm(path.join(dumpDirectory, name), { recursive: true, force: true });
      }
    }
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult> {
    this.logger.debug(`Request: ${point.latitude},${point.longitude}`);

    const [address] = await lookup([point], 1);
    this.logger.verbose(`Raw: ${JSON.stringify(address, null, 2)}`);

    const { countryCode, name: city, admin1Code, admin2Code } = address[0] as GeoData;
    const country = getName(countryCode, 'en');
    const stateParts = [(admin2Code as AdminCode)?.name, (admin1Code as AdminCode)?.name].filter((name) => !!name);
    const state = stateParts.length > 0 ? stateParts.join(', ') : null;
    this.logger.debug(`Normalized: ${JSON.stringify({ country, state, city })}`);

    return { country, state, city };
  }

  getDuration(seconds?: number): string {
    return Duration.fromObject({ seconds }).toFormat('hh:mm:ss.SSS');
  }

  getTimezone(lat: number, lon: number): string {
    return geotz.find(lat, lon)[0];
  }

  getExifTags(path: string, options?: Partial<ReadTaskOptions>): Promise<ImmichTags | null> {
    return exiftool.read<ImmichTags>(path, undefined, options);
  }

  mapExifEntity(asset: AssetEntity, tags: ImmichTags, fileSize: number): ExifEntity {
    return <ExifEntity>{
      // altitude: tags.GPSAltitude ?? null,
      assetId: asset.id,
      bitsPerSample: this.getBitsPerSample(tags),
      colorspace: tags.ColorSpace ?? null,
      dateTimeOriginal: exifDate(firstDateTime(tags)) ?? asset.fileCreatedAt,
      exifImageHeight: validate(tags.ImageHeight),
      exifImageWidth: validate(tags.ImageWidth),
      exposureTime: tags.ExposureTime ?? null,
      fileSizeInByte: fileSize,
      fNumber: validate(tags.FNumber),
      focalLength: validate(tags.FocalLength),
      fps: validate(tags.VideoFrameRate),
      iso: validate(tags.ISO),
      latitude: validate(tags.GPSLatitude),
      lensModel: tags.LensModel ?? null,
      livePhotoCID: (asset.type === AssetType.VIDEO ? tags.ContentIdentifier : tags.MediaGroupUUID) ?? null,
      longitude: validate(tags.GPSLongitude),
      make: tags.Make ?? null,
      model: tags.Model ?? null,
      modifyDate: exifDate(tags.ModifyDate) ?? asset.fileModifiedAt,
      orientation: validate(tags.Orientation)?.toString() ?? null,
      profileDescription: tags.ProfileDescription || tags.ProfileName || null,
      projectionType: tags.ProjectionType ? String(tags.ProjectionType).toUpperCase() : null,
      timeZone: tags.tz,
    };
  }

  private getBitsPerSample(tags: ImmichTags): number | null {
    const bitDepthTags = [
      tags.BitsPerSample,
      tags.ComponentBitDepth,
      tags.ImagePixelDepth,
      tags.BitDepth,
      tags.ColorBitDepth,
      // `numericTags` doesn't parse values like '12 12 12'
    ].map((tag) => (typeof tag === 'string' ? Number.parseInt(tag) : tag));

    let bitsPerSample = bitDepthTags.find((tag) => typeof tag === 'number' && !Number.isNaN(tag)) ?? null;
    if (bitsPerSample && bitsPerSample >= 24 && bitsPerSample % 3 === 0) {
      bitsPerSample /= 3; // converts per-pixel bit depth to per-channel
    }

    return bitsPerSample;
  }
}
