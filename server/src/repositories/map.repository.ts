import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { getName } from 'i18n-iso-countries';
import { randomUUID } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import readLine from 'node:readline';
import { citiesFile } from 'src/constants';
import { AssetEntity } from 'src/entities/asset.entity';
import { GeodataPlacesEntity, GeodataPlacesTempEntity } from 'src/entities/geodata-places.entity';
import {
  NaturalEarthCountriesEntity,
  NaturalEarthCountriesTempEntity,
} from 'src/entities/natural-earth-countries.entity';
import { LogLevel, SystemMetadataKey } from 'src/enum';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import {
  GeoPoint,
  IMapRepository,
  MapMarker,
  MapMarkerSearchOptions,
  ReverseGeocodeResult,
} from 'src/interfaces/map.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { OptionalBetween } from 'src/utils/database';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

@Injectable()
export class MapRepository implements IMapRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(GeodataPlacesEntity) private geodataPlacesRepository: Repository<GeodataPlacesEntity>,
    @InjectRepository(NaturalEarthCountriesEntity)
    private naturalEarthCountriesRepository: Repository<NaturalEarthCountriesEntity>,
    @InjectDataSource() private dataSource: DataSource,
    @Inject(IConfigRepository) private configRepository: IConfigRepository,
    @Inject(ISystemMetadataRepository) private metadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(MapRepository.name);
  }

  async init(): Promise<void> {
    this.logger.log('Initializing metadata repository');
    const { resourcePaths } = this.configRepository.getEnv();
    const geodataDate = await readFile(resourcePaths.geodata.dateFile, 'utf8');

    // TODO move to service init
    const geocodingMetadata = await this.metadataRepository.get(SystemMetadataKey.REVERSE_GEOCODING_STATE);
    if (geocodingMetadata?.lastUpdate === geodataDate) {
      return;
    }

    await Promise.all([this.importGeodata(), this.importNaturalEarthCountries()]);

    await this.metadataRepository.set(SystemMetadataKey.REVERSE_GEOCODING_STATE, {
      lastUpdate: geodataDate,
      lastImportFileName: citiesFile,
    });

    this.logger.log('Geodata import completed');
  }

  async getMapMarkers(
    ownerIds: string[],
    albumIds: string[],
    options: MapMarkerSearchOptions = {},
  ): Promise<MapMarker[]> {
    const { isArchived, isFavorite, fileCreatedAfter, fileCreatedBefore } = options;

    const where = {
      isVisible: true,
      isArchived,
      exifInfo: {
        latitude: Not(IsNull()),
        longitude: Not(IsNull()),
      },
      isFavorite,
      fileCreatedAt: OptionalBetween(fileCreatedAfter, fileCreatedBefore),
    };

    const assets = await this.assetRepository.find({
      select: {
        id: true,
        exifInfo: {
          city: true,
          state: true,
          country: true,
          latitude: true,
          longitude: true,
        },
      },
      where: [
        { ...where, ownerId: In([...ownerIds]) },
        { ...where, albums: { id: In([...albumIds]) } },
      ],
      relations: {
        exifInfo: true,
      },
      order: {
        fileCreatedAt: 'DESC',
      },
    });

    return assets.map((asset) => ({
      id: asset.id,
      lat: asset.exifInfo!.latitude!,
      lon: asset.exifInfo!.longitude!,
      city: asset.exifInfo!.city,
      state: asset.exifInfo!.state,
      country: asset.exifInfo!.country,
    }));
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult> {
    this.logger.debug(`Request: ${point.latitude},${point.longitude}`);

    const response = await this.geodataPlacesRepository
      .createQueryBuilder('geoplaces')
      .where(
        'earth_box(ll_to_earth_public(:latitude, :longitude), 25000) @> ll_to_earth_public(latitude, longitude)',
        point,
      )
      .orderBy('earth_distance(ll_to_earth_public(:latitude, :longitude), ll_to_earth_public(latitude, longitude))')
      .limit(1)
      .getOne();

    if (response) {
      if (this.logger.isLevelEnabled(LogLevel.VERBOSE)) {
        this.logger.verbose(`Raw: ${JSON.stringify(response, null, 2)}`);
      }

      const { countryCode, name: city, admin1Name } = response;
      const country = getName(countryCode, 'en') ?? null;
      const state = admin1Name;

      return { country, state, city };
    }

    this.logger.warn(
      `Response from database for reverse geocoding latitude: ${point.latitude}, longitude: ${point.longitude} was null`,
    );

    const ne_response = await this.naturalEarthCountriesRepository
      .createQueryBuilder('naturalearth_countries')
      .where('coordinates @> point (:longitude, :latitude)', point)
      .limit(1)
      .getOne();

    if (!ne_response) {
      this.logger.warn(
        `Response from database for natural earth reverse geocoding latitude: ${point.latitude}, longitude: ${point.longitude} was null`,
      );

      return { country: null, state: null, city: null };
    }

    if (this.logger.isLevelEnabled(LogLevel.VERBOSE)) {
      this.logger.verbose(`Raw: ${JSON.stringify(ne_response, ['id', 'admin', 'admin_a3', 'type'], 2)}`);
    }
    const { admin_a3 } = ne_response;
    const country = getName(admin_a3, 'en') ?? null;
    const state = null;
    const city = null;

    return { country, state, city };
  }

  private async importNaturalEarthCountries() {
    const { resourcePaths } = this.configRepository.getEnv();
    const geoJSONData = JSON.parse(await readFile(resourcePaths.geodata.naturalEarthCountriesPath, 'utf8'));
    if (geoJSONData.type !== 'FeatureCollection' || !Array.isArray(geoJSONData.features)) {
      this.logger.fatal('Invalid GeoJSON FeatureCollection');
      return;
    }

    await this.dataSource.query('DROP TABLE IF EXISTS naturalearth_countries_tmp');
    await this.dataSource.query(
      'CREATE UNLOGGED TABLE naturalearth_countries_tmp (LIKE naturalearth_countries INCLUDING ALL EXCLUDING INDEXES)',
    );
    const entities: Omit<NaturalEarthCountriesTempEntity, 'id'>[] = [];
    for (const feature of geoJSONData.features) {
      for (const entry of feature.geometry.coordinates) {
        const coordinates: number[][][] = feature.geometry.type === 'MultiPolygon' ? entry[0] : entry;
        const featureRecord: Omit<NaturalEarthCountriesTempEntity, 'id'> = {
          admin: feature.properties.ADMIN,
          admin_a3: feature.properties.ADM0_A3,
          type: feature.properties.TYPE,
          coordinates: `(${coordinates.map((point) => `(${point[0]},${point[1]})`).join(', ')})`,
        };
        entities.push(featureRecord);
        if (feature.geometry.type === 'Polygon') {
          break;
        }
      }
    }
    await this.dataSource.manager.insert(NaturalEarthCountriesTempEntity, entities);

    await this.dataSource.query(`ALTER TABLE naturalearth_countries_tmp ADD PRIMARY KEY (id) WITH (FILLFACTOR = 100)`);

    await this.dataSource.transaction(async (manager) => {
      await manager.query('ALTER TABLE naturalearth_countries RENAME TO naturalearth_countries_old');
      await manager.query('ALTER TABLE naturalearth_countries_tmp RENAME TO naturalearth_countries');
      await manager.query('DROP TABLE naturalearth_countries_old');
    });
  }

  private async importGeodata() {
    const { resourcePaths } = this.configRepository.getEnv();
    const [admin1, admin2] = await Promise.all([
      this.loadAdmin(resourcePaths.geodata.admin1),
      this.loadAdmin(resourcePaths.geodata.admin2),
    ]);

    await this.dataSource.query('DROP TABLE IF EXISTS geodata_places_tmp');
    await this.dataSource.query(
      'CREATE UNLOGGED TABLE geodata_places_tmp (LIKE geodata_places INCLUDING ALL EXCLUDING INDEXES)',
    );
    await this.loadCities500(admin1, admin2);
    await this.createGeodataIndices();

    await this.dataSource.transaction(async (manager) => {
      await manager.query('ALTER TABLE geodata_places RENAME TO geodata_places_old');
      await manager.query('ALTER TABLE geodata_places_tmp RENAME TO geodata_places');
      await manager.query('DROP TABLE geodata_places_old');
    });
  }

  private async loadCities500(admin1Map: Map<string, string>, admin2Map: Map<string, string>) {
    const { resourcePaths } = this.configRepository.getEnv();
    const cities500 = resourcePaths.geodata.cities500;
    if (!existsSync(cities500)) {
      throw new Error(`Geodata file ${cities500} not found`);
    }

    const input = createReadStream(cities500, { highWaterMark: 512 * 1024 * 1024 });
    let bufferGeodata: QueryDeepPartialEntity<GeodataPlacesTempEntity>[] = [];
    const lineReader = readLine.createInterface({ input });
    let count = 0;

    let futures = [];
    for await (const line of lineReader) {
      const lineSplit = line.split('\t');
      if (lineSplit[7] === 'PPLX' && lineSplit[8] !== 'AU') {
        continue;
      }

      const geoData = {
        id: Number.parseInt(lineSplit[0]),
        name: lineSplit[1],
        alternateNames: lineSplit[3],
        latitude: Number.parseFloat(lineSplit[4]),
        longitude: Number.parseFloat(lineSplit[5]),
        countryCode: lineSplit[8],
        admin1Code: lineSplit[10],
        admin2Code: lineSplit[11],
        modificationDate: lineSplit[18],
        admin1Name: admin1Map.get(`${lineSplit[8]}.${lineSplit[10]}`),
        admin2Name: admin2Map.get(`${lineSplit[8]}.${lineSplit[10]}.${lineSplit[11]}`),
      };
      bufferGeodata.push(geoData);
      if (bufferGeodata.length >= 5000) {
        const curLength = bufferGeodata.length;
        futures.push(
          this.dataSource.manager.insert(GeodataPlacesTempEntity, bufferGeodata).then(() => {
            count += curLength;
            if (count % 10_000 === 0) {
              this.logger.log(`${count} geodata records imported`);
            }
          }),
        );
        bufferGeodata = [];
        // leave spare connection for other queries
        if (futures.length >= 9) {
          await Promise.all(futures);
          futures = [];
        }
      }
    }

    await this.dataSource.manager.insert(GeodataPlacesTempEntity, bufferGeodata);
  }

  private async loadAdmin(filePath: string) {
    if (!existsSync(filePath)) {
      this.logger.error(`Geodata file ${filePath} not found`);
      throw new Error(`Geodata file ${filePath} not found`);
    }

    const input = createReadStream(filePath, { highWaterMark: 512 * 1024 * 1024 });
    const lineReader = readLine.createInterface({ input });

    const adminMap = new Map<string, string>();
    for await (const line of lineReader) {
      const lineSplit = line.split('\t');
      adminMap.set(lineSplit[0], lineSplit[1]);
    }

    return adminMap;
  }

  private createGeodataIndices() {
    return Promise.all([
      this.dataSource.query(`ALTER TABLE geodata_places_tmp ADD PRIMARY KEY (id) WITH (FILLFACTOR = 100)`),
      this.dataSource.query(`
        CREATE INDEX IDX_geodata_gist_earthcoord_${randomUUID().replaceAll('-', '_')}
          ON geodata_places_tmp
          USING gist (ll_to_earth_public(latitude, longitude))
          WITH (fillfactor = 100)`),
      this.dataSource.query(`
        CREATE INDEX idx_geodata_places_name_${randomUUID().replaceAll('-', '_')}
          ON geodata_places_tmp
          USING gin (f_unaccent(name) gin_trgm_ops)`),
      this.dataSource.query(`
        CREATE INDEX idx_geodata_places_admin1_name_${randomUUID().replaceAll('-', '_')}
          ON geodata_places_tmp
          USING gin (f_unaccent("admin1Name") gin_trgm_ops)`),
      this.dataSource.query(`
        CREATE INDEX idx_geodata_places_admin2_name_${randomUUID().replaceAll('-', '_')}
          ON geodata_places_tmp
          USING gin (f_unaccent("admin2Name") gin_trgm_ops)`),
    ]);
  }
}
