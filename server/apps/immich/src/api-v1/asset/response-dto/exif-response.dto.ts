import { ExifEntity } from '@app/database/entities/exif.entity';

export interface ExifResponseDto {
  id: string;
  make: string | null;
  model: string | null;
  imageName: string | null;
  exifImageWidth: number | null;
  exifImageHeight: number | null;
  fileSizeInByte: number | null;
  orientation: string | null;
  dateTimeOriginal: Date | null;
  modifyDate: Date | null;
  lensModel: string | null;
  fNumber: number | null;
  focalLength: number | null;
  iso: number | null;
  exposureTime: number | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
}

export function mapExif(entity: ExifEntity): ExifResponseDto {
  return {
    id: entity.id,
    make: entity.make,
    model: entity.model,
    imageName: entity.imageName,
    exifImageWidth: entity.exifImageWidth,
    exifImageHeight: entity.exifImageHeight,
    fileSizeInByte: entity.fileSizeInByte,
    orientation: entity.orientation,
    dateTimeOriginal: entity.dateTimeOriginal,
    modifyDate: entity.modifyDate,
    lensModel: entity.lensModel,
    fNumber: entity.fNumber,
    focalLength: entity.focalLength,
    iso: entity.iso,
    exposureTime: entity.exposureTime,
    latitude: entity.latitude,
    longitude: entity.longitude,
    city: entity.city,
    state: entity.state,
    country: entity.country,
  };
}
