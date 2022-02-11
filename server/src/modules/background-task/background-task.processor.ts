import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Job, Queue } from 'bull';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../api-v1/asset/entities/asset.entity';
import { ConfigService } from '@nestjs/config';
import exifr from 'exifr';
import { readFile } from 'fs/promises';
import { Logger } from '@nestjs/common';
import { ExifEntity } from '../../api-v1/asset/entities/exif.entity';

@Processor('background-task')
export class BackgroundTaskProcessor {
  constructor(
    @InjectRepository(AssetEntity)
    private assetRepository: Repository<AssetEntity>,

    @InjectRepository(ExifEntity)
    private exifRepository: Repository<ExifEntity>,

    private configService: ConfigService,
  ) {}

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

    await this.exifRepository.save(newExif);

    try {
    } catch (e) {
      Logger.error(`Error extracting EXIF ${e.toString()}`, 'extractExif');
    }
  }
}
