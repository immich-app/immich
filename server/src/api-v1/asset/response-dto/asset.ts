import { AssetEntity } from '../entities/asset.entity';
import { AssetType } from '../entities/asset.entity';
import { Exif, mapExif } from './exif';
import { SmartInfo, mapSmartInfo } from './smart-info';

export interface Asset {
  id: string;
  deviceAssetId: string;
  ownerId: string;
  deviceId: string;
  type: AssetType;
  originalPath: string;
  resizePath: string | null;
  createdAt: string;
  modifiedAt: string;
  isFavorite: boolean;
  mimeType: string | null;
  duration: string | null;
  exifInfo?: Exif;
  smartInfo?: SmartInfo;
}

export function mapAsset(entity: AssetEntity): Asset {
  return {
    id: entity.id,
    deviceAssetId: entity.deviceAssetId,
    ownerId: entity.userId,
    deviceId: entity.deviceId,
    type: entity.type,
    originalPath: entity.originalPath,
    resizePath: entity.resizePath,
    createdAt: entity.createdAt,
    modifiedAt: entity.modifiedAt,
    isFavorite: entity.isFavorite,
    mimeType: entity.mimeType,
    duration: entity.duration,
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
  };
}
