import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { getName } from 'i18n-iso-countries';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import readLine from 'node:readline';
import { citiesFile, resourcePaths } from 'src/constants';
import { AssetEntity } from 'src/entities/asset.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
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
import { Instrumentation } from 'src/utils/instrumentation';
import { DataSource, In, IsNull, Not, QueryRunner, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

@Instrumentation()
@Injectable()
export class MapRepository implements IMapRepository {
  constructor(
    @InjectRepository(AssetEntity) private assetRepository: Repository<AssetEntity>,
    @InjectRepository(GeodataPlacesEntity) private geodataPlacesRepository: Repository<GeodataPlacesEntity>,
    @InjectDataSource() private dataSource: DataSource,
    @Inject(ISystemMetadataRepository) private metadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(MapRepository.name);
  }

  async init(): Promise<void> {
    this.logger.log('Initializing metadata repository');
    const geodataDate = await readFile(resourcePaths.geodata.dateFile, 'utf8');

    // TODO move to service init
    const geocodingMetadata = await this.metadataRepository.get(SystemMetadataKey.REVERSE_GEOCODING_STATE);
    if (geocodingMetadata?.lastUpdate === geodataDate) {
      return;
    }

    await this.importGeodata();

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

  async fetchStyle(url: string) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch data from ${url} with status ${response.status}: ${await response.text()}`);
      }

      return response.json();
    } catch (error) {
      throw new Error(`Failed to fetch data from ${url}: ${error}`);
    }
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null> {
    this.logger.debug(`Request: ${point.latitude},${point.longitude}`);

    const response = await this.geodataPlacesRepository
      .createQueryBuilder('geoplaces')
      .where('earth_box(ll_to_earth(:latitude, :longitude), 25000) @> "earthCoord"', point)
      .orderBy('earth_distance(ll_to_earth(:latitude, :longitude), "earthCoord")')
      .limit(1)
      .getOne();

    if (!response) {
      this.logger.warn(
        `Response from database for reverse geocoding latitude: ${point.latitude}, longitude: ${point.longitude} was null`,
      );
      return null;
    }

    this.logger.verbose(`Raw: ${JSON.stringify(response, null, 2)}`);

    const { countryCode, name: city, admin1Name } = response;
    const country = getName(countryCode, 'en') ?? null;
    const state = admin1Name;

    return { country, state, city };
  }

  private async importGeodata() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const admin1 = await this.loadAdmin(resourcePaths.geodata.admin1);
    const admin2 = await this.loadAdmin(resourcePaths.geodata.admin2);

    try {
      await queryRunner.startTransaction();

      await queryRunner.manager.clear(GeodataPlacesEntity);
      await this.loadCities500(queryRunner, admin1, admin2);

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.fatal('Error importing geodata', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async loadGeodataToTableFromFile(
    queryRunner: QueryRunner,
    lineToEntityMapper: (lineSplit: string[]) => GeodataPlacesEntity,
    filePath: string,
    options?: { entityFilter?: (linesplit: string[]) => boolean },
  ) {
    const _entityFilter = options?.entityFilter ?? (() => true);
    if (!existsSync(filePath)) {
      this.logger.error(`Geodata file ${filePath} not found`);
      throw new Error(`Geodata file ${filePath} not found`);
    }

    const input = createReadStream(filePath);
    let bufferGeodata: QueryDeepPartialEntity<GeodataPlacesEntity>[] = [];
    const lineReader = readLine.createInterface({ input });

    for await (const line of lineReader) {
      const lineSplit = line.split('\t');
      if (!_entityFilter(lineSplit)) {
        continue;
      }
      const geoData = lineToEntityMapper(lineSplit);
      bufferGeodata.push(geoData);
      if (bufferGeodata.length > 1000) {
        await queryRunner.manager.upsert(GeodataPlacesEntity, bufferGeodata, ['id']);
        bufferGeodata = [];
      }
    }
    await queryRunner.manager.upsert(GeodataPlacesEntity, bufferGeodata, ['id']);
  }

  private async loadCities500(
    queryRunner: QueryRunner,
    admin1Map: Map<string, string>,
    admin2Map: Map<string, string>,
  ) {
    await this.loadGeodataToTableFromFile(
      queryRunner,
      (lineSplit: string[]) =>
        this.geodataPlacesRepository.create({
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
        }),
      resourcePaths.geodata.cities500,
      { entityFilter: (lineSplit) => lineSplit[7] != 'PPLX' },
    );
  }

  private async loadAdmin(filePath: string) {
    if (!existsSync(filePath)) {
      this.logger.error(`Geodata file ${filePath} not found`);
      throw new Error(`Geodata file ${filePath} not found`);
    }

    const input = createReadStream(filePath);
    const lineReader = readLine.createInterface({ input: input });

    const adminMap = new Map<string, string>();
    for await (const line of lineReader) {
      const lineSplit = line.split('\t');
      adminMap.set(lineSplit[0], lineSplit[1]);
    }

    return adminMap;
  }
}
