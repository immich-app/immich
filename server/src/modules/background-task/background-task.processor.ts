import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ConfigService } from '@nestjs/config';
import exifr from 'exifr';
import { readFile } from 'fs/promises';
import fs from 'fs';
import { Logger } from '@nestjs/common';
import { ExifEntity } from '../../api-v1/asset/entities/exif.entity';
import axios from 'axios';
import { SmartInfoEntity } from '../../api-v1/asset/entities/smart-info.entity';
import mapboxGeocoding, { GeocodeService } from '@mapbox/mapbox-sdk/services/geocoding';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

@Processor('background-task')
export class BackgroundTaskProcessor {
  private geocodingClient: GeocodeService;

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(SmartInfoEntity)
    private smartInfoRepository: Repository<SmartInfoEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    private configService: ConfigService,
  ) {
    if (this.configService.get('ENABLE_MAPBOX')) {
      this.geocodingClient = mapboxGeocoding({
        accessToken: this.configService.get('MAPBOX_KEY'),
      });
    }
  }

  @Process('extract-exif')
  async extractExif(job: Job) {
    const { savedAsset, fileName, fileSize }: { savedAsset: AssetEntity; fileName: string; fileSize: number } =
      job.data;
    const fileBuffer = await readFile(savedAsset.originalPath);

    const exifData = await exifr.parse(fileBuffer);

    const newExif = new ExifEntity();
    newExif.assetId = savedAsset.id;
    newExif.make = exifData['Make'] || null;
    newExif.model = exifData['Model'] || null;
    newExif.imageName = fileName || null;
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
    if (this.configService.get('ENABLE_MAPBOX') && exifData['longitude'] && exifData['latitude']) {
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

    try {
    } catch (e) {
      Logger.error(`Error extracting EXIF ${e.toString()}`, 'extractExif');
    }
  }

  @Process('delete-file-on-disk')
  async deleteFileOnDisk(job) {
    const { assets }: { assets: AssetEntity[] } = job.data;

    for (const asset of assets) {
      fs.unlink(asset.originalPath, (err) => {
        if (err) {
          console.log('error deleting ', asset.originalPath);
        }
      });

      fs.unlink(asset.resizePath, (err) => {
        if (err) {
          console.log('error deleting ', asset.originalPath);
        }
      });
    }
  }

  @Process('tag-image')
  async tagImage(job) {
    const { thumbnailPath, asset }: { thumbnailPath: string; asset: AssetEntity } = job.data;

    const res = await axios.post('http://immich-microservices:3001/image-classifier/tagImage', {
      thumbnailPath: thumbnailPath,
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

  @Process('detect-object')
  async detectObject(job) {
    try {
      const { thumbnailPath, asset }: { thumbnailPath: string; asset: AssetEntity } = job.data;

      const res = await axios.post('http://immich-microservices:3001/object-detection/detectObject', {
        thumbnailPath: thumbnailPath,
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
      Logger.error(`Failed to trigger object detection pipe line ${error.toString()}`)
    }

  }
}
