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
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import mapboxGeocoding, { GeocodeService } from '@mapbox/mapbox-sdk/services/geocoding';
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Job } from 'bull';
import exifr from 'exifr';
import ffmpeg from 'fluent-ffmpeg';
import { readFile } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { Repository } from 'typeorm/repository/Repository';

@Processor(metadataExtractionQueueName)
export class MetadataExtractionProcessor {
  private geocodingClient?: GeocodeService;

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,
  ) {
    if (process.env.ENABLE_MAPBOX == 'true' && process.env.MAPBOX_KEY) {
      this.geocodingClient = mapboxGeocoding({
        accessToken: process.env.MAPBOX_KEY,
      });
    }
  }

  @Process(exifExtractionProcessorName)
  async extractExifInfo(job: Job<IExifExtractionProcessor>) {
    try {
      const { asset, fileName, fileSize }: { asset: AssetEntity; fileName: string; fileSize: number } = job.data;
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

      const newExif = new ExifEntity();
      newExif.assetId = asset.id;
      newExif.make = exifData['Make'] || null;
      newExif.model = exifData['Model'] || null;
      newExif.imageName = path.parse(fileName).name || null;
      newExif.exifImageHeight = exifData['ExifImageHeight'] || exifData['ImageHeight'] || null;
      newExif.exifImageWidth = exifData['ExifImageWidth'] || exifData['ImageWidth'] || null;
      newExif.fileSizeInByte = fileSize || null;
      newExif.orientation = exifData['Orientation'] || null;
      newExif.dateTimeOriginal = exifData['DateTimeOriginal'] || null;
      newExif.modifyDate = exifData['ModifyDate'] || null;
      newExif.lensModel = exifData['LensModel'] || null;
      newExif.fNumber = exifData['FNumber'] || null;
      newExif.focalLength = exifData['FocalLength'] || null;
      newExif.iso = exifData['ISO'] || null;
      newExif.exposureTime = exifData['ExposureTime'] || null;
      newExif.latitude = exifData['latitude'] || null;
      newExif.longitude = exifData['longitude'] || null;

      // Reverse GeoCoding
      if (this.geocodingClient && exifData['longitude'] && exifData['latitude']) {
        const geoCodeInfo: MapiResponse = await this.geocodingClient
          .reverseGeocode({
            query: [exifData['longitude'], exifData['latitude']],
            types: ['country', 'region', 'place'],
          })
          .send();

        const res: [] = geoCodeInfo.body['features'];

        let city = '';
        let state = '';
        let country = '';

        if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]) {
          city = res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]['text'];
        }

        if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]) {
          state = res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]['text'];
        }

        if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]) {
          country = res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]['text'];
        }

        newExif.city = city || null;
        newExif.state = state || null;
        newExif.country = country || null;
      }

      // Enrich metadata
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
    }
  }

  @Process({ name: reverseGeocodingProcessorName })
  async reverseGeocoding(job: Job<IReverseGeocodingProcessor>) {
    const { exif } = job.data;

    if (this.geocodingClient) {
      const geoCodeInfo: MapiResponse = await this.geocodingClient
        .reverseGeocode({
          query: [Number(exif.longitude), Number(exif.latitude)],
          types: ['country', 'region', 'place'],
        })
        .send();

      const res: [] = geoCodeInfo.body['features'];

      let city = '';
      let state = '';
      let country = '';

      if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]) {
        city = res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]['text'];
      }

      if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]) {
        state = res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]['text'];
      }

      if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]) {
        country = res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]['text'];
      }

      await this.exifRepository.update({ id: exif.id }, { city, state, country });
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
      if (this.geocodingClient && newExif.longitude && newExif.latitude) {
        const geoCodeInfo: MapiResponse = await this.geocodingClient
          .reverseGeocode({
            query: [newExif.longitude, newExif.latitude],
            types: ['country', 'region', 'place'],
          })
          .send();

        const res: [] = geoCodeInfo.body['features'];

        let city = '';
        let state = '';
        let country = '';

        if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]) {
          city = res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]['text'];
        }

        if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]) {
          state = res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]['text'];
        }

        if (res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]) {
          country = res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]['text'];
        }

        newExif.city = city || null;
        newExif.state = state || null;
        newExif.country = country || null;
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
            let fpsParts = stream.r_frame_rate.split('/');

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
