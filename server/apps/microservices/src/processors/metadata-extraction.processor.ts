import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AssetEntity } from '@app/database/entities/asset.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm';
import { ExifEntity } from '../../../../libs/database/src/entities/exif.entity';
import exifr from 'exifr';
import mapboxGeocoding, { GeocodeService } from '@mapbox/mapbox-sdk/services/geocoding';
import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';
import { readFile } from 'fs/promises';
import { Logger } from '@nestjs/common';

@Processor('metadata-extraction-queue')
export class MetadataExtractionProcessor {
  private geocodingClient: GeocodeService;

  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,
  ) {
    if (process.env.ENABLE_MAPBOX) {
      this.geocodingClient = mapboxGeocoding({
        accessToken: process.env.MAPBOX_KEY,
      });
    }
  }

  @Process('exif-extraction')
  async extractExifInfo(job: Job) {
    try {
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
      if (process.env.ENABLE_MAPBOX && exifData['longitude'] && exifData['latitude']) {
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
      Logger.error(`Error extracting EXIF ${e.toString()}`, 'extractExif');
    }
  }
}
