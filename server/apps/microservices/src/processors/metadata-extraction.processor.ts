import {
  AssetCore,
  getFileNameWithoutExtension,
  IAssetRepository,
  IAssetUploadedJob,
  IBaseJob,
  IJobRepository,
  IReverseGeocodingJob,
  JobName,
  QueueName,
  WithoutProperty,
} from '@app/domain';
import { AssetType, ExifEntity } from '@app/infra/entities';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bull';
import { ExifDateTime, exiftool, Tags } from 'exiftool-vendored';
import tz_lookup from '@photostructure/tz-lookup';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { getName } from 'i18n-iso-countries';
import geocoder, { InitOptions } from 'local-reverse-geocoder';
import { Duration } from 'luxon';
import fs from 'node:fs';
import path from 'path';
import sharp from 'sharp';
import { Repository } from 'typeorm/repository/Repository';
import { promisify } from 'util';

const ffprobe = promisify<string, FfprobeData>(ffmpeg.ffprobe);

interface ImmichTags extends Tags {
  ContentIdentifier?: string;
}

function geocoderInit(init: InitOptions) {
  return new Promise<void>(function (resolve) {
    geocoder.init(init, () => {
      resolve();
    });
  });
}

function geocoderLookup(points: { latitude: number; longitude: number }[]) {
  return new Promise<GeoData>(function (resolve) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    geocoder.lookUp(points, 1, (err, addresses) => {
      resolve(addresses[0][0] as GeoData);
    });
  });
}

const geocodingPrecisionLevels = ['cities15000', 'cities5000', 'cities1000', 'cities500'];

export type AdminCode = {
  name: string;
  asciiName: string;
  geoNameId: string;
};

export type GeoData = {
  geoNameId: string;
  name: string;
  asciiName: string;
  alternateNames: string;
  latitude: string;
  longitude: string;
  featureClass: string;
  featureCode: string;
  countryCode: string;
  cc2?: any;
  admin1Code?: AdminCode | string;
  admin2Code?: AdminCode | string;
  admin3Code?: any;
  admin4Code?: any;
  population: string;
  elevation: string;
  dem: string;
  timezone: string;
  modificationDate: string;
  distance: number;
};

@Processor(QueueName.METADATA_EXTRACTION)
export class MetadataExtractionProcessor {
  private logger = new Logger(MetadataExtractionProcessor.name);
  private isGeocodeInitialized = false;
  private assetCore: AssetCore;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    configService: ConfigService,
  ) {
    this.assetCore = new AssetCore(assetRepository, jobRepository);

    if (!configService.get('DISABLE_REVERSE_GEOCODING')) {
      this.logger.log('Initializing Reverse Geocoding');
      geocoderInit({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        citiesFileOverride: geocodingPrecisionLevels[configService.get('REVERSE_GEOCODING_PRECISION')],
        load: {
          admin1: true,
          admin2: true,
          admin3And4: false,
          alternateNames: false,
        },
        countries: [],
        dumpDirectory:
          configService.get('REVERSE_GEOCODING_DUMP_DIRECTORY') || process.cwd() + '/.reverse-geocoding-dump/',
      }).then(() => {
        this.isGeocodeInitialized = true;
        this.logger.log('Reverse Geocoding Initialised');
      });
    }
  }

  private async reverseGeocodeExif(
    latitude: number,
    longitude: number,
  ): Promise<{ country: string; state: string; city: string }> {
    const geoCodeInfo = await geocoderLookup([{ latitude, longitude }]);

    const country = getName(geoCodeInfo.countryCode, 'en');
    const city = geoCodeInfo.name;

    let state = '';

    if (geoCodeInfo.admin2Code) {
      const adminCode2 = geoCodeInfo.admin2Code as AdminCode;
      state += adminCode2.name;
    }

    if (geoCodeInfo.admin1Code) {
      const adminCode1 = geoCodeInfo.admin1Code as AdminCode;

      if (geoCodeInfo.admin2Code) {
        const adminCode2 = geoCodeInfo.admin2Code as AdminCode;
        if (adminCode2.name) {
          state += ', ';
        }
      }
      state += adminCode1.name;
    }

    return { country, state, city };
  }

  @Process(JobName.QUEUE_METADATA_EXTRACTION)
  async handleQueueMetadataExtraction(job: Job<IBaseJob>) {
    try {
      const { force } = job.data;
      const assets = force
        ? await this.assetRepository.getAll()
        : await this.assetRepository.getWithout(WithoutProperty.EXIF);

      for (const asset of assets) {
        const fileName = asset.exifInfo?.imageName ?? getFileNameWithoutExtension(asset.originalPath);
        const name = asset.type === AssetType.VIDEO ? JobName.EXTRACT_VIDEO_METADATA : JobName.EXIF_EXTRACTION;
        await this.jobRepository.queue({ name, data: { asset, fileName } });
      }
    } catch (error: any) {
      this.logger.error(`Unable to queue metadata extraction`, error?.stack);
    }
  }

  @Process(JobName.EXIF_EXTRACTION)
  async extractExifInfo(job: Job<IAssetUploadedJob>) {
    try {
      let asset = job.data.asset;
      const fileName = job.data.fileName;
      const exifData = await exiftool.read<ImmichTags>(asset.originalPath).catch((e) => {
        this.logger.warn(`The exifData parsing failed due to: ${e} on file ${asset.originalPath}`);
        return null;
      });

      const exifToDate = (exifDate: string | ExifDateTime | undefined) => {
        if (!exifDate) return null;

        if (typeof exifDate === 'string') {
          return new Date(exifDate);
        }

        return exifDate.toDate();
      };

      const exifTimeZone = (exifDate: string | ExifDateTime | undefined) => {
        if (!exifDate) return null;

        if (typeof exifDate === 'string') {
          return null;
        }

        return exifDate.zone ?? null;
      };

      const timeZone = exifTimeZone(exifData?.DateTimeOriginal ?? exifData?.CreateDate ?? asset.fileCreatedAt);
      const fileCreatedAt = exifToDate(exifData?.DateTimeOriginal ?? exifData?.CreateDate ?? asset.fileCreatedAt);
      const fileModifiedAt = exifToDate(exifData?.ModifyDate ?? asset.fileModifiedAt);
      const fileStats = fs.statSync(asset.originalPath);
      const fileSizeInBytes = fileStats.size;

      const newExif = new ExifEntity();
      newExif.assetId = asset.id;
      newExif.imageName = path.parse(fileName).name;
      newExif.fileSizeInByte = fileSizeInBytes;
      newExif.make = exifData?.Make || null;
      newExif.model = exifData?.Model || null;
      newExif.exifImageHeight = exifData?.ExifImageHeight || exifData?.ImageHeight || null;
      newExif.exifImageWidth = exifData?.ExifImageWidth || exifData?.ImageWidth || null;
      newExif.exposureTime = exifData?.ExposureTime || null;
      newExif.orientation = exifData?.Orientation?.toString() || null;
      newExif.dateTimeOriginal = fileCreatedAt;
      newExif.modifyDate = fileModifiedAt;
      newExif.timeZone = timeZone;
      newExif.lensModel = exifData?.LensModel || null;
      newExif.fNumber = exifData?.FNumber || null;
      newExif.focalLength = exifData?.FocalLength ? parseFloat(exifData.FocalLength) : null;
      newExif.iso = exifData?.ISO || null;
      newExif.latitude = exifData?.GPSLatitude || null;
      newExif.longitude = exifData?.GPSLongitude || null;
      newExif.livePhotoCID = exifData?.MediaGroupUUID || null;

      if (newExif.livePhotoCID && !asset.livePhotoVideoId) {
        const motionAsset = await this.assetCore.findLivePhotoMatch(newExif.livePhotoCID, asset.id, AssetType.VIDEO);
        if (motionAsset) {
          await this.assetCore.save({ id: asset.id, livePhotoVideoId: motionAsset.id });
          await this.assetCore.save({ id: motionAsset.id, isVisible: false });
        }
      }

      /**
       * Reverse Geocoding
       *
       * Get the city, state or region name of the asset
       * based on lat/lon GPS coordinates.
       */
      if (this.isGeocodeInitialized && newExif.latitude && newExif.longitude) {
        const { country, state, city } = await this.reverseGeocodeExif(newExif.latitude, newExif.longitude);
        newExif.country = country;
        newExif.state = state;
        newExif.city = city;
      }

      /**
       * IF the EXIF doesn't contain the width and height of the image,
       * We will use Sharpjs to get the information.
       */
      if (!newExif.exifImageHeight || !newExif.exifImageWidth || !newExif.orientation) {
        const metadata = await sharp(asset.originalPath).metadata();

        if (newExif.exifImageHeight === null) {
          newExif.exifImageHeight = metadata.height || null;
        }

        if (newExif.exifImageWidth === null) {
          newExif.exifImageWidth = metadata.width || null;
        }

        if (newExif.orientation === null) {
          newExif.orientation = metadata.orientation !== undefined ? `${metadata.orientation}` : null;
        }
      }

      await this.exifRepository.upsert(newExif, { conflictPaths: ['assetId'] });
      asset = await this.assetCore.save({ id: asset.id, fileCreatedAt: fileCreatedAt?.toISOString() });
      await this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: { asset } });
    } catch (error: any) {
      this.logger.error(`Error extracting EXIF ${error}`, error?.stack);
    }
  }

  @Process({ name: JobName.REVERSE_GEOCODING })
  async reverseGeocoding(job: Job<IReverseGeocodingJob>) {
    if (this.isGeocodeInitialized) {
      const { latitude, longitude } = job.data;
      const { country, state, city } = await this.reverseGeocodeExif(latitude, longitude);
      await this.exifRepository.update({ assetId: job.data.assetId }, { city, state, country });
    }
  }

  @Process({ name: JobName.EXTRACT_VIDEO_METADATA, concurrency: 2 })
  async extractVideoMetadata(job: Job<IAssetUploadedJob>) {
    let asset = job.data.asset;
    const fileName = job.data.fileName;

    if (!asset.isVisible) {
      return;
    }

    try {
      const data = await ffprobe(asset.originalPath);
      const durationString = this.extractDuration(data.format.duration || asset.duration);
      let fileCreatedAt = asset.fileCreatedAt;

      const videoTags = data.format.tags;
      if (videoTags) {
        if (videoTags['com.apple.quicktime.creationdate']) {
          fileCreatedAt = String(videoTags['com.apple.quicktime.creationdate']);
        } else if (videoTags['creation_time']) {
          fileCreatedAt = String(videoTags['creation_time']);
        }
      }

      const exifData = await exiftool.read<ImmichTags>(asset.originalPath).catch((e) => {
        this.logger.warn(`The exifData parsing failed due to: ${e} on file ${asset.originalPath}`);
        return null;
      });

      const newExif = new ExifEntity();
      newExif.assetId = asset.id;
      newExif.description = '';
      newExif.imageName = path.parse(fileName).name || null;
      newExif.fileSizeInByte = data.format.size || null;
      newExif.dateTimeOriginal = fileCreatedAt ? new Date(fileCreatedAt) : null;
      newExif.modifyDate = null;
      newExif.timeZone = null;
      newExif.latitude = null;
      newExif.longitude = null;
      newExif.city = null;
      newExif.state = null;
      newExif.country = null;
      newExif.fps = null;
      newExif.livePhotoCID = exifData?.ContentIdentifier || null;

      if (newExif.livePhotoCID) {
        const photoAsset = await this.assetCore.findLivePhotoMatch(newExif.livePhotoCID, asset.id, AssetType.IMAGE);
        if (photoAsset) {
          await this.assetCore.save({ id: photoAsset.id, livePhotoVideoId: asset.id });
          await this.assetCore.save({ id: asset.id, isVisible: false });
          newExif.imageName = (photoAsset.exifInfo as ExifEntity).imageName;
        }
      }

      if (videoTags && videoTags['location']) {
        const location = videoTags['location'] as string;
        const locationRegex = /([+-][0-9]+\.[0-9]+)([+-][0-9]+\.[0-9]+)\/$/;
        const match = location.match(locationRegex);

        if (match?.length === 3) {
          newExif.latitude = parseFloat(match[1]);
          newExif.longitude = parseFloat(match[2]);
        }
      } else if (videoTags && videoTags['com.apple.quicktime.location.ISO6709']) {
        const location = videoTags['com.apple.quicktime.location.ISO6709'] as string;
        const locationRegex = /([+-][0-9]+\.[0-9]+)([+-][0-9]+\.[0-9]+)([+-][0-9]+\.[0-9]+)\/$/;
        const match = location.match(locationRegex);

        if (match?.length === 4) {
          newExif.latitude = parseFloat(match[1]);
          newExif.longitude = parseFloat(match[2]);
        }
      }

      if (newExif.longitude && newExif.latitude) {
        try {
          newExif.timeZone = tz_lookup(newExif.latitude, newExif.longitude);
        } catch (error: any) {
          this.logger.warn(`Error while calculating timezone from gps coordinates: ${error}`, error?.stack);
        }
      }

      // Reverse GeoCoding
      if (this.isGeocodeInitialized && newExif.longitude && newExif.latitude) {
        const { country, state, city } = await this.reverseGeocodeExif(newExif.latitude, newExif.longitude);
        newExif.country = country;
        newExif.state = state;
        newExif.city = city;
      }

      for (const stream of data.streams) {
        if (stream.codec_type === 'video') {
          newExif.exifImageWidth = stream.width || null;
          newExif.exifImageHeight = stream.height || null;

          if (typeof stream.rotation === 'string') {
            newExif.orientation = stream.rotation;
          } else if (typeof stream.rotation === 'number') {
            newExif.orientation = `${stream.rotation}`;
          } else {
            newExif.orientation = null;
          }

          if (stream.r_frame_rate) {
            const fpsParts = stream.r_frame_rate.split('/');

            if (fpsParts.length === 2) {
              newExif.fps = Math.round(parseInt(fpsParts[0]) / parseInt(fpsParts[1]));
            }
          }
        }
      }

      await this.exifRepository.upsert(newExif, { conflictPaths: ['assetId'] });
      asset = await this.assetCore.save({ id: asset.id, duration: durationString, fileCreatedAt });
      await this.jobRepository.queue({ name: JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE, data: { asset } });
    } catch (err) {
      ``;
      // do nothing
      console.log('Error in video metadata extraction', err);
    }
  }

  private extractDuration(duration: number | string | null) {
    const videoDurationInSecond = Number(duration);
    if (!videoDurationInSecond) {
      return null;
    }

    return Duration.fromObject({ seconds: videoDurationInSecond }).toFormat('hh:mm:ss.SSS');
  }
}
