import { Asset } from './asset';

export interface Exif {
  id: string;
  assetId: string;
  description: string; // or caption
  exifImageWidth: number | null;
  exifImageHeight: number | null;
  fileSizeInByte: number | null;
  orientation: string | null;
  dateTimeOriginal: Date | null;
  modifyDate: Date | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  make: string | null;
  model: string | null;
  imageName: string | null;
  lensModel: string | null;
  fNumber: number | null;
  focalLength: number | null;
  iso: number | null;
  exposureTime: number | null;
  fps?: number | null;
  asset?: Asset;
  exifTextSearchableColumn: string;
}
