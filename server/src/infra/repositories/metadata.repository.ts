import { GeoPoint, IMetadataRepository, ImmichTags, ReverseGeocodeResult } from '@app/domain';
import { REVERSE_GEOCODING_DUMP_DIRECTORY } from '@app/infra';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import mapboxGeocoding, { GeocodeService } from '@mapbox/mapbox-sdk/services/geocoding';
import { Injectable, Logger } from '@nestjs/common';
import { DefaultReadTaskOptions, exiftool } from 'exiftool-vendored';
import { readdir, rm } from 'fs/promises';
import * as geotz from 'geo-tz';
import { getName } from 'i18n-iso-countries';
import geocoder, { AddressObject, InitOptions } from 'local-reverse-geocoder';
import path from 'path';
import { promisify } from 'util';

export interface AdminCode {
  name: string;
  asciiName: string;
  geoNameId: string;
}

export type GeoData = AddressObject & {
  admin1Code?: AdminCode | string;
  admin2Code?: AdminCode | string;
};

const lookup = promisify<GeoPoint[], number, AddressObject[][]>(geocoder.lookUp).bind(geocoder);

@Injectable()
export class MetadataRepository implements IMetadataRepository {
  private logger = new Logger(MetadataRepository.name);
  private mapboxClient?: GeocodeService;

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

  async teardown() {
    await exiftool.end();
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

  async reverseGeocode(point: GeoPoint, useMapbox: boolean = false): Promise<ReverseGeocodeResult> {
    console.log(point);
    this.logger.debug(`Request: ${point.latitude},${point.longitude}`);

    const [address] = await lookup([point], 1);
    this.logger.verbose(`Raw: ${JSON.stringify(address, null, 2)}`);

    const { countryCode, name: city, admin1Code, admin2Code } = address[0] as GeoData;
    const country = getName(countryCode, 'en') ?? null;
    const stateParts = [(admin2Code as AdminCode)?.name, (admin1Code as AdminCode)?.name].filter((name) => !!name);
    const state = stateParts.length > 0 ? stateParts.join(', ') : null;
    this.logger.debug(`Normalized: ${JSON.stringify({ country, state, city })}`);

    // Mapbox
    this.mapboxClient = mapboxGeocoding({
      accessToken: 'pk.eyJ1IjoiYWx0cmFuMTUwMiIsImEiOiJjbDBoaXQyZGkwOTEyM2tvMzd2dzJqcXZwIn0.-Lrg7SfQVnhAwWSNV5HoSQ',
    });

    const geoCodeInfo: MapiResponse = await this.mapboxClient
      .reverseGeocode({
        query: [point.longitude, point.latitude],
        types: ['country', 'region', 'place'],
      })
      .send();
    console.log(geoCodeInfo.body);
    const res: [] = geoCodeInfo.body['features'];

    let mbCity = '';
    let mbState = '';
    let mbCountry = '';

    if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]) {
      mbCity = res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]['text'];
    }

    if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]) {
      mbState = res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]['text'];
    }

    if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]) {
      mbCountry = res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]['text'];
    }

    console.log('Mapbox: ', mbCity, mbState, mbCountry);

    return { country, state, city };
  }

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
