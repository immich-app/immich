import { GeoPoint, IGeocodingRepository, ReverseGeocodeResult } from '@app/domain';
import { localGeocodingConfig } from '@app/infra';
import { Injectable, Logger } from '@nestjs/common';
import { readdir, rm } from 'fs/promises';
import { getName } from 'i18n-iso-countries';
import geocoder, { AddressObject } from 'local-reverse-geocoder';
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

const init = (): Promise<void> => new Promise<void>((resolve) => geocoder.init(localGeocodingConfig, resolve));
const lookup = promisify<GeoPoint[], number, AddressObject[][]>(geocoder.lookUp).bind(geocoder);

@Injectable()
export class GeocodingRepository implements IGeocodingRepository {
  private logger = new Logger(GeocodingRepository.name);

  async init(): Promise<void> {
    await init();
  }

  async deleteCache() {
    const dumpDirectory = localGeocodingConfig.dumpDirectory;
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
}
