import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { ExifResponseDto, mapExif } from './exif-response.dto';
import { SmartInfoResponseDto, mapSmartInfo } from './smart-info-response.dto';

export interface AssetResponseDto {
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
  exifInfo?: ExifResponseDto;
  smartInfo?: SmartInfoResponseDto;
}

export function mapAsset(entity: AssetEntity): AssetResponseDto {
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
