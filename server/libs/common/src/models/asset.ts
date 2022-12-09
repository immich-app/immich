import { Exif } from './exif';
import { SmartInfo } from './smart-info';
import { Tag } from './tag';

export interface Asset {
  id: string;
  deviceAssetId: string;
  userId: string;
  deviceId: string;
  type: AssetType;
  originalPath: string;
  resizePath: string | null;
  webpPath: string | null;
  encodedVideoPath: string;
  createdAt: string;
  modifiedAt: string;
  isFavorite: boolean;
  mimeType: string | null;
  checksum?: Buffer | null; // sha1 checksum
  duration: string | null;
  isVisible: boolean;
  livePhotoVideoId: string | null;
  exifInfo?: Exif;
  smartInfo?: SmartInfo;
  tags: Tag[];
}

export enum AssetType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  OTHER = 'OTHER',
}
