import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DefaultReadTaskOptions, ExifTool, Tags } from 'exiftool-vendored';
import geotz from 'geo-tz';
import { DummyValue, GenerateSql } from 'src/decorators';
import { ExifEntity } from 'src/entities/exif.entity';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IMetadataRepository, ImmichTags } from 'src/interfaces/metadata.interface';
import { Instrumentation } from 'src/utils/instrumentation';
import { Repository } from 'typeorm';

@Instrumentation()
@Injectable()
export class MetadataRepository implements IMetadataRepository {
  private exiftool = new ExifTool({
    defaultVideosToUTC: true,
    backfillTimezones: true,
    inferTimezoneFromDatestamps: true,
    useMWG: true,
    numericTags: [...DefaultReadTaskOptions.numericTags, 'FocalLength'],
    /* eslint unicorn/no-array-callback-reference: off, unicorn/no-array-method-this-argument: off */
    geoTz: (lat, lon) => geotz.find(lat, lon)[0],
    // Enable exiftool LFS to parse metadata for files larger than 2GB.
    readArgs: ['-api', 'largefilesupport=1'],
    writeArgs: ['-api', 'largefilesupport=1', '-overwrite_original'],
  });

  constructor(
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(MetadataRepository.name);
  }

  async teardown() {
    await this.exiftool.end();
  }

  readTags(path: string): Promise<ImmichTags | null> {
    return this.exiftool.read(path).catch((error) => {
      this.logger.warn(`Error reading exif data (${path}): ${error}`, error?.stack);
      return null;
    }) as Promise<ImmichTags | null>;
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

  @GenerateSql({ params: [DummyValue.UUID] })
  async getCountries(userIds: string[]): Promise<string[]> {
    const results = await this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId IN (:...userIds )', { userIds })
      .select('exif.country', 'country')
      .distinctOn(['exif.country'])
      .getRawMany<{ country: string }>();

    return results.map(({ country }) => country).filter((item) => item !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getStates(userIds: string[], country: string | undefined): Promise<string[]> {
    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId IN (:...userIds )', { userIds })
      .select('exif.state', 'state')
      .distinctOn(['exif.state']);

    if (country) {
      query.andWhere('exif.country = :country', { country });
    }

    const result = await query.getRawMany<{ state: string }>();

    return result.map(({ state }) => state).filter((item) => item !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING, DummyValue.STRING] })
  async getCities(userIds: string[], country: string | undefined, state: string | undefined): Promise<string[]> {
    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId IN (:...userIds )', { userIds })
      .select('exif.city', 'city')
      .distinctOn(['exif.city']);

    if (country) {
      query.andWhere('exif.country = :country', { country });
    }

    if (state) {
      query.andWhere('exif.state = :state', { state });
    }

    const results = await query.getRawMany<{ city: string }>();

    return results.map(({ city }) => city).filter((item) => item !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getCameraMakes(userIds: string[], model: string | undefined): Promise<string[]> {
    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId IN (:...userIds )', { userIds })
      .select('exif.make', 'make')
      .distinctOn(['exif.make']);

    if (model) {
      query.andWhere('exif.model = :model', { model });
    }

    const results = await query.getRawMany<{ make: string }>();
    return results.map(({ make }) => make).filter((item) => item !== '');
  }

  @GenerateSql({ params: [DummyValue.UUID, DummyValue.STRING] })
  async getCameraModels(userIds: string[], make: string | undefined): Promise<string[]> {
    const query = this.exifRepository
      .createQueryBuilder('exif')
      .leftJoin('exif.asset', 'asset')
      .where('asset.ownerId IN (:...userIds )', { userIds })
      .select('exif.model', 'model')
      .distinctOn(['exif.model']);

    if (make) {
      query.andWhere('exif.make = :make', { make });
    }

    const results = await query.getRawMany<{ model: string }>();
    return results.map(({ model }) => model).filter((item) => item !== '');
  }
}
