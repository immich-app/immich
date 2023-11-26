import { Tags } from 'exiftool-vendored';

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

export interface ExifDuration {
  Value: number;
  Scale?: number;
}

export interface ImmichTags extends Omit<Tags, 'FocalLength' | 'Duration'> {
  ContentIdentifier?: string;
  MotionPhoto?: number;
  MotionPhotoVersion?: number;
  MotionPhotoPresentationTimestampUs?: number;
  MediaGroupUUID?: string;
  ImagePixelDepth?: string;
  FocalLength?: number;
  Duration?: number | ExifDuration;
}

export interface IMetadataRepository {
  init(): Promise<void>;
  teardown(): Promise<void>;
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult | null>;
  getExifTags(path: string): Promise<ImmichTags | null>;
}
