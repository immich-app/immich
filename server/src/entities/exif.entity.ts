import { AssetEntity } from 'src/entities/asset.entity';

export class ExifEntity {
  asset?: AssetEntity;
  assetId!: string;
  updatedAt?: Date;
  updateId?: string;
  description!: string; // or caption
  exifImageWidth!: number | null;
  exifImageHeight!: number | null;
  fileSizeInByte!: number | null;
  orientation!: string | null;
  dateTimeOriginal!: Date | null;
  modifyDate!: Date | null;
  timeZone!: string | null;
  latitude!: number | null;
  longitude!: number | null;
  projectionType!: string | null;
  city!: string | null;
  livePhotoCID!: string | null;
  autoStackId!: string | null;
  state!: string | null;
  country!: string | null;
  make!: string | null;
  model!: string | null;
  lensModel!: string | null;
  fNumber!: number | null;
  focalLength!: number | null;
  iso!: number | null;
  exposureTime!: string | null;
  profileDescription!: string | null;
  colorspace!: string | null;
  bitsPerSample!: number | null;
  rating!: number | null;
  fps?: number | null;
}
