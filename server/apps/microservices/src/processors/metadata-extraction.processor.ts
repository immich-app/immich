import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ExifEntity } from '@app/database/entities/exif.entity';
import exifr from 'exifr';
import mapboxGeocoding, { GeocodeService } from '@mapbox/mapbox-sdk/services/geocoding';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import { readFile } from 'fs/promises';
import { Logger } from '@nestjs/common';
import axios from 'axios';
import { SmartInfoEntity } from '@app/database/entities/smart-info.entity';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';

@Processor('metadata-extraction-queue')
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

  @Process('exif-extraction')
  async extractExifInfo(job: Job) {
    try {
      const { asset, fileName, fileSize }: { asset: AssetEntity; fileName: string; fileSize: number } = job.data;

      const fileBuffer = await readFile(asset.originalPath);

      const exifData = await exifr.parse(fileBuffer);

      const newExif = new ExifEntity();
      newExif.assetId = asset.id;
      newExif.make = exifData['Make'] || null;
      newExif.model = exifData['Model'] || null;
      newExif.imageName = path.parse(fileName).name || null;
      newExif.exifImageHeight = exifData['ExifImageHeight'] || null;
      newExif.exifImageWidth = exifData['ExifImageWidth'] || null;
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

        const city = res.filter((geoInfo) => geoInfo['place_type'][0] == 'place')[0]['text'];
        const state = res.filter((geoInfo) => geoInfo['place_type'][0] == 'region')[0]['text'];
        const country = res.filter((geoInfo) => geoInfo['place_type'][0] == 'country')[0]['text'];

        newExif.city = city || null;
        newExif.state = state || null;
        newExif.country = country || null;
      }

      await this.exifRepository.save(newExif);
    } catch (e) {
      Logger.error(`Error extracting EXIF ${String(e)}`, 'extractExif');
    }
  }

  @Process({ name: 'tag-image', concurrency: 2 })
  async tagImage(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    const res = await axios.post('http://immich-machine-learning:3001/image-classifier/tag-image', {
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

  @Process({ name: 'detect-object', concurrency: 2 })
  async detectObject(job: Job) {
    try {
      const { asset }: { asset: AssetEntity } = job.data;

      const res = await axios.post('http://immich-machine-learning:3001/object-detection/detect-object', {
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

  @Process({ name: 'extract-video-length', concurrency: 2 })
  async extractVideoLength(job: Job) {
    const { asset }: { asset: AssetEntity } = job.data;

    ffmpeg.ffprobe(asset.originalPath, async (err, data) => {
      if (!err) {
        if (data.format.duration) {
          const videoDurationInSecond = parseInt(data.format.duration.toString(), 0);

          const hours = Math.floor(videoDurationInSecond / 3600);
          const minutes = Math.floor((videoDurationInSecond - hours * 3600) / 60);
          const seconds = videoDurationInSecond - hours * 3600 - minutes * 60;

          const durationString = `${hours}:${minutes < 10 ? '0' + minutes.toString() : minutes}:${
            seconds < 10 ? '0' + seconds.toString() : seconds
          }.000000`;

          await this.assetRepository.update({ id: asset.id }, { duration: durationString });
        }
      }
    });
  }
}
