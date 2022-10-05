import { ImmichLogLevel } from '@app/common/constants/log-level.constant';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { ExifEntity } from '@app/database/entities/exif.entity';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';
import {
  IExifExtractionProcessor,
  IVideoLengthExtractionProcessor,
  exifExtractionProcessorName,
  imageTaggingProcessorName,
  objectDetectionProcessorName,
  videoMetadataExtractionProcessorName,
  metadataExtractionQueueName,
  reverseGeocodingProcessorName,
  IReverseGeocodingProcessor,
} from '@app/job';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Job } from 'bull';
import exifr from 'exifr';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import sharp from 'sharp';
import { Repository } from 'typeorm/repository/Repository';
import geocoder, { InitOptions } from 'local-reverse-geocoder';
import { getName } from 'i18n-iso-countries';
import { find } from 'geo-tz';
import * as luxon from 'luxon';
import fs from 'node:fs';

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
      resolve(addresses[0][0]);
    });
  });
}

const geocodingPrecisionLevels = ['cities15000', 'cities5000', 'cities1000', 'cities500'];

export interface AdminCode {
  name: string;
  asciiName: string;
  geoNameId: string;
}

export interface GeoData {
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
  admin1Code?: AdminCode;
  admin2Code?: AdminCode;
  admin3Code?: any;
  admin4Code?: any;
  population: string;
  elevation: string;
  dem: string;
  timezone: string;
  modificationDate: string;
  distance: number;
}

@Processor(metadataExtractionQueueName)
export class MetadataExtractionProcessor {
  private isGeocodeInitialized = false;
  private logLevel: ImmichLogLevel;

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,

    private configService: ConfigService,
  ) {
    if (!configService.get('DISABLE_REVERSE_GEOCODING')) {
      Logger.log('Initialising Reverse Geocoding');
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
        dumpDirectory: configService.get('REVERSE_GEOCODING_DUMP_DIRECTORY') || (process.cwd() + '/.reverse-geocoding-dump/'),
      }).then(() => {
        this.isGeocodeInitialized = true;
        Logger.log('Reverse Geocoding Initialised');
      });
    }

    this.logLevel = this.configService.get('LOG_LEVEL') || ImmichLogLevel.SIMPLE;
  }

  private async reverseGeocodeExif(
    latitude: number,
    longitude: number,
  ): Promise<{ country: string; state: string; city: string }> {
    const geoCodeInfo = await geocoderLookup([{ latitude, longitude }]);

    const country = getName(geoCodeInfo.countryCode, 'en');
    const city = geoCodeInfo.name;

    let state = '';
    if (geoCodeInfo.admin2Code?.name) state += geoCodeInfo.admin2Code.name;
    if (geoCodeInfo.admin1Code?.name) {
      if (geoCodeInfo.admin2Code?.name) state += ', ';
      state += geoCodeInfo.admin1Code.name;
    }

    return { country, state, city };
  }

  @Process(exifExtractionProcessorName)
  async extractExifInfo(job: Job<IExifExtractionProcessor>) {
    try {
      const { asset, fileName }: { asset: AssetEntity; fileName: string } = job.data;
      const exifData = await exifr.parse(asset.originalPath, {
        tiff: true,
        ifd0: true as any,
        ifd1: true,
        exif: true,
        gps: true,
        interop: true,
        xmp: true,
        icc: true,
        iptc: true,
        jfif: true,
        ihdr: true,
      });

      if (!exifData) {
        throw new Error(`can not parse exif data from file ${asset.originalPath}`);
      }

      const createdAt = new Date(exifData.DateTimeOriginal || exifData.CreateDate || new Date(asset.createdAt));

      const fileStats = fs.statSync(asset.originalPath);
      const fileSizeInBytes = fileStats.size;

      const newExif = new ExifEntity();
      newExif.assetId = asset.id;
      newExif.make = exifData['Make'] || null;
      newExif.model = exifData['Model'] || null;
      newExif.imageName = path.parse(fileName).name || null;
      newExif.exifImageHeight = exifData['ExifImageHeight'] || exifData['ImageHeight'] || null;
      newExif.exifImageWidth = exifData['ExifImageWidth'] || exifData['ImageWidth'] || null;
      newExif.fileSizeInByte = fileSizeInBytes || null;
      newExif.orientation = exifData['Orientation'] || null;
      newExif.dateTimeOriginal = createdAt;
      newExif.modifyDate = exifData['ModifyDate'] || null;
      newExif.lensModel = exifData['LensModel'] || null;
      newExif.fNumber = exifData['FNumber'] || null;
      newExif.focalLength = exifData['FocalLength'] || null;
      newExif.iso = exifData['ISO'] || null;
      newExif.exposureTime = exifData['ExposureTime'] || null;
      newExif.latitude = exifData['latitude'] || null;
      newExif.longitude = exifData['longitude'] || null;

      /**
       * Correctly store UTC time based on timezone
       * The timestamp being extracted from EXIF is based on the timezone
       * of the container. We need to correct it to UTC time based on the
       * timezone of the location.
       *
       * The timezone of the location can be exracted from the lat/lon
       * GPS coordinates.
       *
       * Any assets that doesn't have this information will used the
       * createdAt timestamp of the asset instead.
       *
       * The updated/corrected timestamp will be used to update the
       * createdAt timestamp in the asset table. So that the information
       * is consistent across the database.
       *  */
      if (newExif.longitude && newExif.latitude) {
        const tz = find(newExif.latitude, newExif.longitude)[0];
        const localTimeWithTimezone = createdAt.toISOString();

        if (localTimeWithTimezone.length == 24) {
          // Remove the last character
          const localTimeWithoutTimezone = localTimeWithTimezone.slice(0, -1);
          const correctUTCTime = luxon.DateTime.fromISO(localTimeWithoutTimezone, { zone: tz }).toUTC().toISO();
          newExif.dateTimeOriginal = new Date(correctUTCTime);
          await this.assetRepository.save({
            id: asset.id,
            createdAt: correctUTCTime,
          });
        }
      } else {
        await this.assetRepository.save({
          id: asset.id,
          createdAt: createdAt.toISOString(),
        });
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

      await this.exifRepository.save(newExif);
    } catch (e) {
      Logger.error(`Error extracting EXIF ${String(e)}`, 'extractExif');

      if (this.logLevel === ImmichLogLevel.VERBOSE) {
        console.trace('Error extracting EXIF', e);
      }
    }
  }

  @Process({ name: reverseGeocodingProcessorName })
  async reverseGeocoding(job: Job<IReverseGeocodingProcessor>) {
    if (this.isGeocodeInitialized) {
      const { latitude, longitude } = job.data;
      const { country, state, city } = await this.reverseGeocodeExif(latitude, longitude);
      await this.exifRepository.update({ id: job.data.exifId }, { city, state, country });
    }
  }

  @Process({ name: imageTaggingProcessorName, concurrency: 2 })
  async tagImage(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    const res = await axios.post('http://immich-machine-learning:3003/image-classifier/tag-image', {
      thumbnailPath: asset.resizePath,
    });

    if (res.status == 201 && res.data.length > 0) {
      const smartInfo = new SmartInfoEntity();
      smartInfo.assetId = asset.id;
      smartInfo.tags = [...res.data];

      await this.smartInfoRepository.upsert(smartInfo, {
        conflictPaths: ['assetId'],
      });
    }
  }

  @Process({ name: objectDetectionProcessorName, concurrency: 2 })
  async detectObject(job: Job) {
    try {
      const { asset }: { asset: AssetEntity } = job.data;

      const res = await axios.post('http://immich-machine-learning:3003/object-detection/detect-object', {
        thumbnailPath: asset.resizePath,
      });

      if (res.status == 201 && res.data.length > 0) {
        const smartInfo = new SmartInfoEntity();
        smartInfo.assetId = asset.id;
        smartInfo.objects = [...res.data];

        await this.smartInfoRepository.upsert(smartInfo, {
          conflictPaths: ['assetId'],
        });
      }
    } catch (error) {
      Logger.error(`Failed to trigger object detection pipe line ${String(error)}`);
    }
  }

  @Process({ name: videoMetadataExtractionProcessorName, concurrency: 2 })
  async extractVideoMetadata(job: Job<IVideoLengthExtractionProcessor>) {
    const { asset, fileName } = job.data;

    try {
      const data = await new Promise<ffmpeg.FfprobeData>((resolve, reject) =>
        ffmpeg.ffprobe(asset.originalPath, (err, data) => {
          if (err) return reject(err);
          return resolve(data);
        }),
      );
      let durationString = asset.duration;
      let createdAt = asset.createdAt;

      if (data.format.duration) {
        durationString = this.extractDuration(data.format.duration);
      }

      const videoTags = data.format.tags;
      if (videoTags) {
        if (videoTags['com.apple.quicktime.creationdate']) {
          createdAt = String(videoTags['com.apple.quicktime.creationdate']);
        } else if (videoTags['creation_time']) {
          createdAt = String(videoTags['creation_time']);
        } else {
          createdAt = asset.createdAt;
        }
      } else {
        createdAt = asset.createdAt;
      }

      const newExif = new ExifEntity();
      newExif.assetId = asset.id;
      newExif.description = '';
      newExif.imageName = path.parse(fileName).name || null;
      newExif.fileSizeInByte = data.format.size || null;
      newExif.dateTimeOriginal = createdAt ? new Date(createdAt) : null;
      newExif.modifyDate = null;
      newExif.latitude = null;
      newExif.longitude = null;
      newExif.city = null;
      newExif.state = null;
      newExif.country = null;
      newExif.fps = null;

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

      await this.exifRepository.save(newExif);
      await this.assetRepository.update({ id: asset.id }, { duration: durationString, createdAt: createdAt });
    } catch (err) {
      // do nothing
      console.log('Error in video metadata extraction', err);
    }
  }

  private extractDuration(duration: number) {
    const videoDurationInSecond = parseInt(duration.toString(), 0);

    const hours = Math.floor(videoDurationInSecond / 3600);
    const minutes = Math.floor((videoDurationInSecond - hours * 3600) / 60);
    const seconds = videoDurationInSecond - hours * 3600 - minutes * 60;

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.000000`;
  }
}
