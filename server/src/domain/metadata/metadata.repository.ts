import { AssetEntity, ExifEntity } from '@app/infra/entities';
import { ReadTaskOptions, Tags } from 'exiftool-vendored';
import { InitOptions } from 'local-reverse-geocoder';

export const IMetadataRepository = 'IMetadataRepository';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  country: string | null;
  state: string | null;
  city: string | null;
}

export interface ImmichTags extends Tags {
  ContentIdentifier?: string;
  MotionPhoto?: number;
  MotionPhotoVersion?: number;
  MotionPhotoPresentationTimestampUs?: number;
  MediaGroupUUID?: string;
  ImagePixelDepth?: string;
}

export interface IMetadataRepository {
  init(options: Partial<InitOptions>): Promise<void>;
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult>;
  deleteCache(): Promise<void>;
  getDuration(seconds?: number): string;
  getExifTags(path: string, options?: Partial<ReadTaskOptions>): Promise<ImmichTags | null>;
  getTimezone(lat: number, lon: number): string;
  mapExifEntity(asset: AssetEntity, tags: ImmichTags, fileSize: number): ExifEntity;
}
