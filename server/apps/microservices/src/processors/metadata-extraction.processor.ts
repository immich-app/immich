import {
  IAssetRepository,
  IBaseJob,
  IEntityJob,
  IGeocodingRepository,
  IJobRepository,
  JobName,
  JOBS_ASSET_PAGINATION_SIZE,
  QueueName,
  usePagination,
  WithoutProperty,
} from '@app/domain';
import { AssetEntity, AssetType, ExifEntity } from '@app/infra/entities';
import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import tz_lookup from '@photostructure/tz-lookup';
import { exiftool, Tags } from 'exiftool-vendored';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { Duration } from 'luxon';
import fs from 'node:fs';
import sharp from 'sharp';
import { Repository } from 'typeorm/repository/Repository';
import { promisify } from 'util';
import { parseLatitude, parseLongitude } from '../utils/exif/coordinates';
import { exifTimeZone, exifToDate } from '../utils/exif/date-time';
import { parseISO } from '../utils/exif/iso';
import { toNumberOrNull } from '../utils/numbers';

const ffprobe = promisify<string, FfprobeData>(ffmpeg.ffprobe);

interface ImmichTags extends Tags {
  ContentIdentifier?: string;
}

export class MetadataExtractionProcessor {
  private logger = new Logger(MetadataExtractionProcessor.name);
  private reverseGeocodingEnabled: boolean;

  constructor(
    @Inject(IAssetRepository) private assetRepository: IAssetRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IGeocodingRepository) private geocodingRepository: IGeocodingRepository,
    @InjectRepository(ExifEntity) private exifRepository: Repository<ExifEntity>,

    configService: ConfigService,
  ) {
    this.reverseGeocodingEnabled = !configService.get('DISABLE_REVERSE_GEOCODING');
  }

  async init(deleteCache = false) {
    this.logger.warn(`Reverse geocoding is ${this.reverseGeocodingEnabled ? 'enabled' : 'disabled'}`);
    if (!this.reverseGeocodingEnabled) {
      return;
    }

    try {
      if (deleteCache) {
        await this.geocodingRepository.deleteCache();
      }
      this.logger.log('Initializing Reverse Geocoding');

      await this.jobRepository.pause(QueueName.METADATA_EXTRACTION);
      await this.geocodingRepository.init();
      await this.jobRepository.resume(QueueName.METADATA_EXTRACTION);

      this.logger.log('Reverse Geocoding Initialized');
    } catch (error: any) {
      this.logger.error(`Unable to initialize reverse geocoding: ${error}`, error?.stack);
    }
  }

  async handleQueueMetadataExtraction(job: IBaseJob) {
    const { force } = job;
    const assetPagination = usePagination(JOBS_ASSET_PAGINATION_SIZE, (pagination) => {
      return force
        ? this.assetRepository.getAll(pagination)
        : this.assetRepository.getWithout(pagination, WithoutProperty.EXIF);
    });

    for await (const assets of assetPagination) {
      for (const asset of assets) {
        await this.jobRepository.queue({ name: JobName.METADATA_EXTRACTION, data: { id: asset.id } });
      }
    }

    return true;
  }

  async handleMetadataExtraction({ id }: IEntityJob) {
    const [asset] = await this.assetRepository.getByIds([id]);
    if (!asset || !asset.isVisible) {
      return false;
    }

    if (asset.type === AssetType.VIDEO) {
      return this.handleVideoMetadataExtraction(asset);
    } else {
      return this.handlePhotoMetadataExtraction(asset);
    }
  }

  private async handlePhotoMetadataExtraction(asset: AssetEntity) {
    const mediaExifData = await exiftool.read<ImmichTags>(asset.originalPath).catch((error: any) => {
      this.logger.warn(
        `The exifData parsing failed due to ${error} for asset ${asset.id} at ${asset.originalPath}`,
        error?.stack,
      );
      return null;
    });

    const sidecarExifData = asset.sidecarPath
      ? await exiftool.read<ImmichTags>(asset.sidecarPath).catch((error: any) => {
          this.logger.warn(
            `The exifData parsing failed due to ${error} for asset ${asset.id} at ${asset.originalPath}`,
            error?.stack,
          );
          return null;
        })
      : {};

    const getExifProperty = <T extends keyof ImmichTags>(
      ...properties: T[]
    ): NonNullable<ImmichTags[T]> | string | null => {
      for (const property of properties) {
        const value = sidecarExifData?.[property] ?? mediaExifData?.[property];
        if (value !== null && value !== undefined) {
          // Can also be string when the value cannot be parsed
          return value;
        }
      }

      return null;
    };

    const timeZone = exifTimeZone(getExifProperty('DateTimeOriginal', 'CreateDate') ?? asset.fileCreatedAt);
    const fileCreatedAt = exifToDate(getExifProperty('DateTimeOriginal', 'CreateDate') ?? asset.fileCreatedAt);
    const fileModifiedAt = exifToDate(getExifProperty('ModifyDate') ?? asset.fileModifiedAt);
    const fileStats = fs.statSync(asset.originalPath);
    const fileSizeInBytes = fileStats.size;

    const newExif = new ExifEntity();
    newExif.assetId = asset.id;
    newExif.fileSizeInByte = fileSizeInBytes;
    newExif.make = getExifProperty('Make');
    newExif.model = getExifProperty('Model');
    newExif.exifImageHeight = toNumberOrNull(getExifProperty('ExifImageHeight', 'ImageHeight'));
    newExif.exifImageWidth = toNumberOrNull(getExifProperty('ExifImageWidth', 'ImageWidth'));
    newExif.exposureTime = getExifProperty('ExposureTime');
    newExif.orientation = getExifProperty('Orientation')?.toString() ?? null;
    newExif.dateTimeOriginal = fileCreatedAt;
    newExif.modifyDate = fileModifiedAt;
    newExif.timeZone = timeZone;
    newExif.lensModel = getExifProperty('LensModel');
    newExif.fNumber = toNumberOrNull(getExifProperty('FNumber'));
    newExif.focalLength = toNumberOrNull(getExifProperty('FocalLength'));

    // Handle array values by converting to string
    const iso = getExifProperty('ISO')?.toString();
    newExif.iso = iso ? parseISO(iso) : null;

    const latitude = getExifProperty('GPSLatitude');
    const longitude = getExifProperty('GPSLongitude');
    newExif.latitude = latitude !== null ? parseLatitude(latitude) : null;
    newExif.longitude = longitude !== null ? parseLongitude(longitude) : null;

    newExif.livePhotoCID = getExifProperty('MediaGroupUUID');
    if (newExif.livePhotoCID && !asset.livePhotoVideoId) {
      const motionAsset = await this.assetRepository.findLivePhotoMatch({
        livePhotoCID: newExif.livePhotoCID,
        otherAssetId: asset.id,
        ownerId: asset.ownerId,
        type: AssetType.VIDEO,
      });
      if (motionAsset) {
        await this.assetRepository.save({ id: asset.id, livePhotoVideoId: motionAsset.id });
        await this.assetRepository.save({ id: motionAsset.id, isVisible: false });
      }
    }

    await this.applyReverseGeocoding(asset, newExif);

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
    await this.assetRepository.save({ id: asset.id, fileCreatedAt: fileCreatedAt || undefined });

    return true;
  }

  private async handleVideoMetadataExtraction(asset: AssetEntity) {
    const data = await ffprobe(asset.originalPath);
    const durationString = this.extractDuration(data.format.duration || asset.duration);
    let fileCreatedAt = asset.fileCreatedAt;

    const videoTags = data.format.tags;
    if (videoTags) {
      if (videoTags['com.apple.quicktime.creationdate']) {
        fileCreatedAt = new Date(videoTags['com.apple.quicktime.creationdate']);
      } else if (videoTags['creation_time']) {
        fileCreatedAt = new Date(videoTags['creation_time']);
      }
    }

    const exifData = await exiftool.read<ImmichTags>(asset.sidecarPath || asset.originalPath).catch((error: any) => {
      this.logger.warn(
        `The exifData parsing failed due to ${error} for asset ${asset.id} at ${asset.originalPath}`,
        error?.stack,
      );
      return null;
    });

    const newExif = new ExifEntity();
    newExif.assetId = asset.id;
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
      const photoAsset = await this.assetRepository.findLivePhotoMatch({
        livePhotoCID: newExif.livePhotoCID,
        ownerId: asset.ownerId,
        otherAssetId: asset.id,
        type: AssetType.IMAGE,
      });
      if (photoAsset) {
        await this.assetRepository.save({ id: photoAsset.id, livePhotoVideoId: asset.id });
        await this.assetRepository.save({ id: asset.id, isVisible: false });
      }
    }

    if (videoTags && videoTags['location']) {
      const location = videoTags['location'] as string;
      const locationRegex = /([+-][0-9]+\.[0-9]+)([+-][0-9]+\.[0-9]+)\/$/;
      const match = location.match(locationRegex);

      if (match?.length === 3) {
        newExif.latitude = parseLatitude(match[1]);
        newExif.longitude = parseLongitude(match[2]);
      }
    } else if (videoTags && videoTags['com.apple.quicktime.location.ISO6709']) {
      const location = videoTags['com.apple.quicktime.location.ISO6709'] as string;
      const locationRegex = /([+-][0-9]+\.[0-9]+)([+-][0-9]+\.[0-9]+)([+-][0-9]+\.[0-9]+)\/$/;
      const match = location.match(locationRegex);

      if (match?.length === 4) {
        newExif.latitude = parseLatitude(match[1]);
        newExif.longitude = parseLongitude(match[2]);
      }
    }

    if (newExif.longitude && newExif.latitude) {
      try {
        newExif.timeZone = tz_lookup(newExif.latitude, newExif.longitude);
      } catch (error: any) {
        this.logger.warn(`Error while calculating timezone from gps coordinates: ${error}`, error?.stack);
      }
    }

    await this.applyReverseGeocoding(asset, newExif);

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
    await this.assetRepository.save({ id: asset.id, duration: durationString, fileCreatedAt });

    return true;
  }

  private async applyReverseGeocoding(asset: AssetEntity, newExif: ExifEntity) {
    const { latitude, longitude } = newExif;
    if (this.reverseGeocodingEnabled && longitude && latitude) {
      try {
        const { country, state, city } = await this.geocodingRepository.reverseGeocode({ latitude, longitude });
        newExif.country = country;
        newExif.state = state;
        newExif.city = city;
      } catch (error: any) {
        this.logger.warn(
          `Unable to run reverse geocoding due to ${error} for asset ${asset.id} at ${asset.originalPath}`,
          error?.stack,
        );
      }
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
