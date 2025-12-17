import { Injectable } from '@nestjs/common';
import { getName } from 'i18n-iso-countries';
import { Expression, Insertable, Kysely, NotNull, sql, SqlBool } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import readLine from 'node:readline';
import { citiesFile, reverseGeocodeMaxDistance } from 'src/constants';
import { DummyValue, GenerateSql } from 'src/decorators';
import { AssetVisibility, SystemMetadataKey } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { DB } from 'src/schema';
import { GeodataPlacesTable } from 'src/schema/tables/geodata-places.table';
import { NaturalEarthCountriesTable } from 'src/schema/tables/natural-earth-countries.table';

interface GeodataApiReverseGeocodeResponse {
  country: string | null;
  state: string | null;
  city: string | null;
}

export interface MapMarkerSearchOptions {
  isArchived?: boolean;
  isFavorite?: boolean;
  fileCreatedBefore?: Date;
  fileCreatedAfter?: Date;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  country: string | null;
  state: string | null;
  city: string | null;
}

export interface MapMarker extends ReverseGeocodeResult {
  id: string;
  lat: number;
  lon: number;
}

interface MapDB extends DB {
  geodata_places_tmp: GeodataPlacesTable;
  naturalearth_countries_tmp: NaturalEarthCountriesTable;
}

@Injectable()
export class MapRepository {
  constructor(
    private configRepository: ConfigRepository,
    private metadataRepository: SystemMetadataRepository,
    private logger: LoggingRepository,
    @InjectKysely() private db: Kysely<MapDB>,
  ) {
    this.logger.setContext(MapRepository.name);
  }

  async init(): Promise<void> {
    const { geodataApiUrl, resourcePaths } = this.configRepository.getEnv();

    // Skip geodata import when using external API
    if (geodataApiUrl) {
      this.logger.log('Using external geodata API, skipping local geodata import');
      return;
    }

    this.logger.log('Initializing metadata repository');
    const geodataDate = await readFile(resourcePaths.geodata.dateFile, 'utf8');

    // TODO move to service init
    const geocodingMetadata = await this.metadataRepository.get(SystemMetadataKey.ReverseGeocodingState);
    if (geocodingMetadata?.lastUpdate === geodataDate) {
      return;
    }

    await Promise.all([this.importGeodata(), this.importNaturalEarthCountries()]);

    await this.metadataRepository.set(SystemMetadataKey.ReverseGeocodingState, {
      lastUpdate: geodataDate,
      lastImportFileName: citiesFile,
    });

    this.logger.log('Geodata import completed');
  }

  @GenerateSql({ params: [[DummyValue.UUID], [DummyValue.UUID]] })
  getMapMarkers(
    ownerIds: string[],
    albumIds: string[],
    { isArchived, isFavorite, fileCreatedAfter, fileCreatedBefore }: MapMarkerSearchOptions = {},
  ) {
    return this.db
      .selectFrom('asset')
      .innerJoin('asset_exif', (builder) =>
        builder
          .onRef('asset.id', '=', 'asset_exif.assetId')
          .on('asset_exif.latitude', 'is not', null)
          .on('asset_exif.longitude', 'is not', null),
      )
      .select([
        'id',
        'asset_exif.latitude as lat',
        'asset_exif.longitude as lon',
        'asset_exif.city',
        'asset_exif.state',
        'asset_exif.country',
      ])
      .$narrowType<{ lat: NotNull; lon: NotNull }>()
      .$if(isArchived === true, (qb) =>
        qb.where((eb) =>
          eb.or([
            eb('asset.visibility', '=', AssetVisibility.Timeline),
            eb('asset.visibility', '=', AssetVisibility.Archive),
          ]),
        ),
      )
      .$if(isArchived === false || isArchived === undefined, (qb) =>
        qb.where('asset.visibility', '=', AssetVisibility.Timeline),
      )
      .$if(isFavorite !== undefined, (q) => q.where('isFavorite', '=', isFavorite!))
      .$if(fileCreatedAfter !== undefined, (q) => q.where('fileCreatedAt', '>=', fileCreatedAfter!))
      .$if(fileCreatedBefore !== undefined, (q) => q.where('fileCreatedAt', '<=', fileCreatedBefore!))
      .where('deletedAt', 'is', null)
      .where((eb) => {
        const expression: Expression<SqlBool>[] = [];

        if (ownerIds.length > 0) {
          expression.push(eb('ownerId', 'in', ownerIds));
        }

        if (albumIds.length > 0) {
          expression.push(
            eb.exists((eb) =>
              eb
                .selectFrom('album_asset')
                .whereRef('asset.id', '=', 'album_asset.assetId')
                .where('album_asset.albumId', 'in', albumIds),
            ),
          );
        }

        return eb.or(expression);
      })
      .orderBy('fileCreatedAt', 'desc')
      .execute();
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult> {
    this.logger.debug(`Request: ${point.latitude},${point.longitude}`);

    const { geodataApiUrl } = this.configRepository.getEnv();

    // Use external API if configured
    if (geodataApiUrl) {
      return this.reverseGeocodeViaApi(point, geodataApiUrl);
    }

    // Fall back to local database query
    return this.reverseGeocodeViaDatabase(point);
  }

  private async reverseGeocodeViaApi(point: GeoPoint, apiUrl: string): Promise<ReverseGeocodeResult> {
    try {
      const url = `${apiUrl}/reverse-geocode?lat=${point.latitude}&lon=${point.longitude}`;
      this.logger.debug(`Reverse geocoding API URL: ${url}`);
      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error(`Geodata API error: ${response.status} ${response.statusText}`);
        return { country: null, state: null, city: null };
      }

      const data: GeodataApiReverseGeocodeResponse = await response.json();
      this.logger.verboseFn(() => `API response: ${JSON.stringify(data, null, 2)}`);

      return {
        country: data.country ?? null,
        state: data.state ?? null,
        city: data.city ?? null,
      };
    } catch (error) {
      this.logger.error(`Reverse geocoding API URL: ${apiUrl}`);
      this.logger.error(`Failed to call geodata API blabla: ${error}`);
      return { country: null, state: null, city: null };
    }
  }

  private async reverseGeocodeViaDatabase(point: GeoPoint): Promise<ReverseGeocodeResult> {
    const response = await this.db
      .selectFrom('geodata_places')
      .selectAll()
      .where(
        sql`earth_box(ll_to_earth_public(${point.latitude}, ${point.longitude}), ${reverseGeocodeMaxDistance})`,
        '@>',
        sql`ll_to_earth_public(latitude, longitude)`,
      )
      .orderBy(
        sql`(earth_distance(ll_to_earth_public(${point.latitude}, ${point.longitude}), ll_to_earth_public(latitude, longitude)))`,
      )
      .limit(1)
      .executeTakeFirst();

    if (response) {
      this.logger.verboseFn(() => `Raw: ${JSON.stringify(response, null, 2)}`);

      const { countryCode, name: city, admin1Name } = response;
      const country = getName(countryCode, 'en') ?? null;
      const state = admin1Name;

      return { country, state, city };
    }

    this.logger.log(
      `Empty response from database for city reverse geocoding lat: ${point.latitude}, lon: ${point.longitude}. Likely cause: no nearby large populated place (500+ within ${reverseGeocodeMaxDistance / 1000}km). Falling back to country boundaries.`,
    );

    const ne_response = await this.db
      .selectFrom('naturalearth_countries')
      .selectAll()
      .where('coordinates', '@>', sql<string>`point(${point.longitude}, ${point.latitude})`)
      .limit(1)
      .executeTakeFirst();

    if (!ne_response) {
      this.logger.log(
        `Empty response from database for natural earth country reverse geocoding lat: ${point.latitude}, lon: ${point.longitude}`,
      );

      return { country: null, state: null, city: null };
    }

    this.logger.verboseFn(() => `Raw: ${JSON.stringify(ne_response, ['id', 'admin', 'admin_a3', 'type'], 2)}`);

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

    const entities: Insertable<NaturalEarthCountriesTable>[] = [];
    for (const feature of geoJSONData.features) {
      for (const entry of feature.geometry.coordinates) {
        const coordinates: number[][][] = feature.geometry.type === 'MultiPolygon' ? entry[0] : entry;
        const featureRecord: Insertable<NaturalEarthCountriesTable> = {
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

    await this.db.transaction().execute(async (manager) => {
      await sql`CREATE TABLE naturalearth_countries_tmp
                (
                  LIKE naturalearth_countries INCLUDING ALL EXCLUDING INDEXES
                )`.execute(manager);
      await manager.schema.dropTable('naturalearth_countries').execute();
      await manager.schema.alterTable('naturalearth_countries_tmp').renameTo('naturalearth_countries').execute();
    });

    await this.db.insertInto('naturalearth_countries').values(entities).execute();
    await sql`ALTER TABLE naturalearth_countries ADD PRIMARY KEY (id) WITH (FILLFACTOR = 100)`.execute(this.db);
  }

  private async importGeodata() {
    const { resourcePaths } = this.configRepository.getEnv();
    const [admin1, admin2] = await Promise.all([
      this.loadAdmin(resourcePaths.geodata.admin1),
      this.loadAdmin(resourcePaths.geodata.admin2),
    ]);

    await this.db.schema.dropTable('geodata_places_tmp').ifExists().execute();
    await this.db.transaction().execute(async (manager) => {
      await sql`CREATE TABLE geodata_places_tmp
                (
                  LIKE geodata_places INCLUDING ALL EXCLUDING INDEXES
                )`.execute(manager);
      await manager.schema.dropTable('geodata_places').execute();
      await manager.schema.alterTable('geodata_places_tmp').renameTo('geodata_places').execute();
    });
    await this.db.schema
      .createIndex('IDX_geodata_gist_earthcoord')
      .on('geodata_places')
      .using('gist')
      .expression(sql`ll_to_earth_public(latitude, longitude)`)
      .execute();
    await this.loadCities500(admin1, admin2);
    await this.createGeodataIndices();
  }

  private async loadCities500(admin1Map: Map<string, string>, admin2Map: Map<string, string>) {
    const { resourcePaths } = this.configRepository.getEnv();
    const cities500 = resourcePaths.geodata.cities500;
    if (!existsSync(cities500)) {
      throw new Error(`Geodata file ${cities500} not found`);
    }

    this.logger.log(`Starting geodata import`);
    const startTime = performance.now();

    const input = createReadStream(cities500, { highWaterMark: 512 * 1024 * 1024 });
    let bufferGeodata = [];
    const lineReader = readLine.createInterface({ input });
    let count = 0;

    let futures = [];
    for await (const line of lineReader) {
      const lineSplit = line.split('\t');
      if ((lineSplit[7] === 'PPLX' && lineSplit[8] !== 'AU') || lineSplit[7] === 'PPLH') {
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
        admin1Name: admin1Map.get(`${lineSplit[8]}.${lineSplit[10]}`) ?? null,
        admin2Name: admin2Map.get(`${lineSplit[8]}.${lineSplit[10]}.${lineSplit[11]}`) ?? null,
      };
      bufferGeodata.push(geoData);
      if (bufferGeodata.length >= 5000) {
        const curLength = bufferGeodata.length;
        futures.push(
          this.db
            .insertInto('geodata_places')
            .values(bufferGeodata)
            .execute()
            .then(() => {
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

    if (bufferGeodata.length > 0) {
      await this.db.insertInto('geodata_places').values(bufferGeodata).execute();
      count += bufferGeodata.length;
    }

    await Promise.all(futures);

    const duration = performance.now() - startTime;
    const seconds = duration / 1000;
    const recordsPerSecond = Math.round(count / seconds);

    this.logger.log(
      `Successfully imported ${count} geodata records in ${seconds.toFixed(2)}s (${recordsPerSecond} records/second)`,
    );
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
      sql`ALTER TABLE geodata_places ADD PRIMARY KEY (id) WITH (FILLFACTOR = 100)`.execute(this.db),
      this.db.schema
        .createIndex(`idx_geodata_places_alternate_names`)
        .on('geodata_places')
        .using('gin (f_unaccent("alternateNames") gin_trgm_ops)')
        .execute(),
      this.db.schema
        .createIndex(`idx_geodata_places_name`)
        .on('geodata_places')
        .using('gin (f_unaccent(name) gin_trgm_ops)')
        .execute(),
      this.db.schema
        .createIndex(`idx_geodata_places_admin1_name`)
        .on('geodata_places')
        .using('gin (f_unaccent("admin1Name") gin_trgm_ops)')
        .execute(),
      this.db.schema
        .createIndex(`idx_geodata_places_admin2_name`)
        .on('geodata_places')
        .using('gin (f_unaccent("admin2Name") gin_trgm_ops)')
        .execute(),
    ]);
  }
}
