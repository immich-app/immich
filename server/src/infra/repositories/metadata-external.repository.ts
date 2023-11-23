import { GeoPoint, IMetadataRepository, ImmichTags, MetadataInitOptions, ReverseGeocodeResult } from '@app/domain';
import { Injectable, Logger } from '@nestjs/common';
import { DefaultReadTaskOptions, exiftool } from 'exiftool-vendored';
import * as geotz from 'geo-tz';

@Injectable()
export class MetadataExternalRepository implements IMetadataRepository {
  private logger = new Logger(MetadataExternalRepository.name);
  private endpoint?: string;

  async init(options: MetadataInitOptions): Promise<void> {
    const { customEndpoint } = options;
    if (!customEndpoint) {
      throw new Error('Server endpoint for reverse geocode must be defined');
    }

    this.endpoint = customEndpoint;
  }

  async teardown(): Promise<void> {}

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult> {
    const params = new URLSearchParams({
      lat: point.latitude.toString(),
      lon: point.longitude.toString(),
    });
    const url = this.endpoint!;
    this.logger.debug(`Request using ${url}: ${point.latitude},${point.longitude}`);

    const res = await fetch(`${url}/reverse-geocode?${params}`, { method: 'GET' });
    if (res.status >= 400) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    return res.json();
  }

  async deleteCache(): Promise<void> {}

  getExifTags(path: string): Promise<ImmichTags | null> {
    return exiftool
      .read(path, undefined, {
        ...DefaultReadTaskOptions,

        defaultVideosToUTC: true,
        backfillTimezones: true,
        inferTimezoneFromDatestamps: true,
        useMWG: true,
        numericTags: DefaultReadTaskOptions.numericTags.concat(['FocalLength']),
        geoTz: (lat, lon) => geotz.find(lat, lon)[0],
      })
      .catch((error) => {
        this.logger.warn(`Error reading exif data (${path}): ${error}`, error?.stack);
        return null;
      }) as Promise<ImmichTags | null>;
  }
}
