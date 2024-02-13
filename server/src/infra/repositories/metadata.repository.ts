import {
  citiesFile,
  geodataAdmin1Path,
  geodataAdmin2Path,
  geodataCitites500Path,
  geodataDatePath,
  GeoPoint,
  IMetadataRepository,
  ImmichTags,
  ISystemMetadataRepository,
  ReverseGeocodeResult,
} from '@app/domain';
import {
  ExifEntity,
  GeodataAdmin1Entity,
  GeodataAdmin2Entity,
  GeodataPlacesEntity,
  SystemMetadataKey,
} from '@app/infra/entities';
import { ImmichLogger } from '@app/infra/logger';
import { Inject } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DefaultReadTaskOptions, exiftool, Tags } from 'exiftool-vendored';
import * as geotz from 'geo-tz';
import { getName } from 'i18n-iso-countries';
import { createReadStream, existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import * as readLine from 'node:readline';
import { DataSource, DeepPartial, QueryRunner, Repository } from 'typeorm';
import { DummyValue, GenerateSql } from '../infra.util';

type GeoEntity = GeodataPlacesEntity | GeodataAdmin1Entity | GeodataAdmin2Entity;
type GeoEntityClass = typeof GeodataPlacesEntity | typeof GeodataAdmin1Entity | typeof GeodataAdmin2Entity;

export class MetadataRepository implements IMetadataRepository {
  constructor(
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,
    @InjectRepository(GeodataPlacesEntity) private readonly geodataPlacesRepository: Repository<GeodataPlacesEntity>,
    @InjectRepository(GeodataAdmin1Entity) private readonly geodataAdmin1Repository: Repository<GeodataAdmin1Entity>,
    @InjectRepository(GeodataAdmin2Entity) private readonly geodataAdmin2Repository: Repository<GeodataAdmin2Entity>,
    @Inject(ISystemMetadataRepository) private readonly systemMetadataRepository: ISystemMetadataRepository,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  private logger = new ImmichLogger(MetadataRepository.name);

  async init(): Promise<void> {
    this.logger.log('Initializing metadata repository');
    const geodataDate = await readFile(geodataDatePath, 'utf8');

    const geocodingMetadata = await this.systemMetadataRepository.get(SystemMetadataKey.REVERSE_GEOCODING_STATE);

    if (geocodingMetadata?.lastUpdate === geodataDate) {
      return;
    }

    this.logger.log('Importing geodata to database from file');
    await this.importGeodata();

    await this.systemMetadataRepository.set(SystemMetadataKey.REVERSE_GEOCODING_STATE, {
      lastUpdate: geodataDate,
      lastImportFileName: citiesFile,
    });

    this.logger.log('Geodata import completed');
  }

  private async importGeodata() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      await this.loadCities500(queryRunner);
      await this.loadAdmin1(queryRunner);
      await this.loadAdmin2(queryRunner);

      await queryRunner.commitTransaction();
    } catch (error) {
      this.logger.fatal('Error importing geodata', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async loadGeodataToTableFromFile<T extends GeoEntity>(
    queryRunner: QueryRunner,
    lineToEntityMapper: (lineSplit: string[]) => T,
    filePath: string,
    entity: GeoEntityClass,
  ) {
    if (!existsSync(filePath)) {
      this.logger.error(`Geodata file ${filePath} not found`);
      throw new Error(`Geodata file ${filePath} not found`);
    }
    await queryRunner.manager.clear(entity);

    const input = createReadStream(filePath);
    let buffer: DeepPartial<T>[] = [];
    const lineReader = readLine.createInterface({ input: input });

    for await (const line of lineReader) {
      const lineSplit = line.split('\t');
      buffer.push(lineToEntityMapper(lineSplit));
      if (buffer.length > 1000) {
        await queryRunner.manager.save(buffer);
        buffer = [];
      }
    }
    await queryRunner.manager.save(buffer);
  }

  private async loadCities500(queryRunner: QueryRunner) {
    await this.loadGeodataToTableFromFile<GeodataPlacesEntity>(
      queryRunner,
      (lineSplit: string[]) =>
        this.geodataPlacesRepository.create({
          id: Number.parseInt(lineSplit[0]),
          name: lineSplit[1],
          latitude: Number.parseFloat(lineSplit[4]),
          longitude: Number.parseFloat(lineSplit[5]),
          countryCode: lineSplit[8],
          admin1Code: lineSplit[10],
          admin2Code: lineSplit[11],
          modificationDate: lineSplit[18],
        }),
      geodataCitites500Path,
      GeodataPlacesEntity,
    );
  }

  private async loadAdmin1(queryRunner: QueryRunner) {
    await this.loadGeodataToTableFromFile<GeodataAdmin1Entity>(
      queryRunner,
      (lineSplit: string[]) =>
        this.geodataAdmin1Repository.create({
          key: lineSplit[0],
          name: lineSplit[1],
        }),
      geodataAdmin1Path,
      GeodataAdmin1Entity,
    );
  }

  private async loadAdmin2(queryRunner: QueryRunner) {
    await this.loadGeodataToTableFromFile<GeodataAdmin2Entity>(
      queryRunner,
      (lineSplit: string[]) =>
        this.geodataAdmin2Repository.create({
          key: lineSplit[0],
          name: lineSplit[1],
        }),
      geodataAdmin2Path,
      GeodataAdmin2Entity,
    );
  }

  async teardown() {
    await exiftool.end();
  }

  async reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null> {
    this.logger.debug(`Request: ${point.latitude},${point.longitude}`);

    const response = await this.geodataPlacesRepository
      .createQueryBuilder('geoplaces')
      .leftJoinAndSelect('geoplaces.admin1', 'admin1')
      .leftJoinAndSelect('geoplaces.admin2', 'admin2')
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

    const { countryCode, name: city, admin1, admin2 } = response;
    const country = getName(countryCode, 'en') ?? null;
    const stateParts = [admin2?.name, admin1?.name].filter((name) => !!name);
    const state = stateParts.length > 0 ? stateParts.join(', ') : null;

    return { country, state, city };
  }

  readTags(path: string): Promise<ImmichTags | null> {
    return exiftool
      .read(path, undefined, {
        ...DefaultReadTaskOptions,

        defaultVideosToUTC: true,
        backfillTimezones: true,
        inferTimezoneFromDatestamps: true,
        useMWG: true,
        numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength'],
        /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
        geoTz: (lat, lon) => geotz.find(lat, lon)[0],
      })
      .catch((error) => {
        this.logger.warn(`Error reading exif data (${path}): ${error}`, error?.stack);
        return null;
      }) as Promise<ImmichTags | null>;
  }

  extractBinaryTag(path: string, tagName: string): Promise<Buffer> {
    return exiftool.extractBinaryTagToBuffer(tagName, path);
  }

  async writeTags(path: string, tags: Partial<Tags>): Promise<void> {
    try {
      await exiftool.write(path, tags, ['-overwrite_original']);
    } catch (error) {
      this.logger.warn(`Error writing exif data (${path}): ${error}`);
    }
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async getCountries(userId: string): Promise<string[]> {
    const entity = await this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId = :userId', { userId })
      .andWhere('exif.country IS NOT NULL')
      .select('exif.country')
      .distinctOn(['exif.country'])
      .getMany();

    return entity.map((e) => e.country ?? '').filter((c) => c !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getStates(userId: string, country: string | undefined): Promise<string[]> {
    let result: ExifEntity[] = [];

    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId = :userId', { userId })
      .andWhere('exif.state IS NOT NULL')
      .select('exif.state')
      .distinctOn(['exif.state']);

    if (country) {
      query.andWhere('exif.country = :country', { country });
    }

    result = await query.getMany();

    return result.map((entity) => entity.state ?? '').filter((s) => s !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, DummyValue.STRING] })
  async getCities(userId: string, country: string | undefined, state: string | undefined): Promise<string[]> {
    let result: ExifEntity[] = [];

    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId = :userId', { userId })
      .andWhere('exif.city IS NOT NULL')
      .select('exif.city')
      .distinctOn(['exif.city']);

    if (country) {
      query.andWhere('exif.country = :country', { country });
    }

    if (state) {
      query.andWhere('exif.state = :state', { state });
    }

    result = await query.getMany();

    return result.map((entity) => entity.city ?? '').filter((c) => c !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getCameraMakes(userId: string, model: string | undefined): Promise<string[]> {
    let result: ExifEntity[] = [];

    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId = :userId', { userId })
      .andWhere('exif.make IS NOT NULL')
      .select('exif.make')
      .distinctOn(['exif.make']);

    if (model) {
      query.andWhere('exif.model = :model', { model });
    }

    result = await query.getMany();

    return result.map((entity) => entity.make ?? '').filter((m) => m !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getCameraModels(userId: string, make: string | undefined): Promise<string[]> {
    let result: ExifEntity[] = [];

    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId = :userId', { userId })
      .andWhere('exif.model IS NOT NULL')
      .select('exif.model')
      .distinctOn(['exif.model']);

    if (make) {
      query.andWhere('exif.make = :make', { make });
    }

    result = await query.getMany();

    return result.map((entity) => entity.model ?? '').filter((m) => m !== '');
  }
}
