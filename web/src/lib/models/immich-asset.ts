export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}

export type ImmichExif = {
  id: string;
  assetId: string;
  make: string;
  model: string;
  imageName: string;
  exifImageWidth: number;
  exifImageHeight: number;
  fileSizeInByte: number;
  orientation: string;
  dateTimeOriginal: Date;
  modifyDate: Date;
  lensModel: string;
  fNumber: number;
  focalLength: number;
  iso: number;
  exposureTime: number;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export type ImmichAssetSmartInfo = {
  id: string;
  assetId: string;
  tags: string[];
  objects: string[];
}

export type ImmichAsset = {
  id: string;
  deviceAssetId: string;
  userId: string;
  deviceId: string;
  type: AssetType;
  originalPath: string;
  resizePath: string;
  createdAt: string;
  modifiedAt: string;
  isFavorite: boolean;
  mimeType: string;
  duration: string;
  exifInfo?: ImmichExif;
  smartInfo?: ImmichAssetSmartInfo;
}