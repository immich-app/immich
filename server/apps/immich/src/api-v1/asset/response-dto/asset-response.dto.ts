import { AssetEntity, AssetType } from '@app/database/entities/asset.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ExifResponseDto, mapExif } from './exif-response.dto';
import { SmartInfoResponseDto, mapSmartInfo } from './smart-info-response.dto';

export class AssetResponseDto {
  id!: string;
  deviceAssetId!: string;
  ownerId!: string;
  deviceId!: string;

  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;
  originalPath!: string;
  resizePath!: string | null;
  createdAt!: string;
  modifiedAt!: string;
  isFavorite!: boolean;
  mimeType!: string | null;
  duration!: string;
  webpPath!: string | null;
  encodedVideoPath!: string | null;
  exifInfo?: ExifResponseDto;
  smartInfo?: SmartInfoResponseDto;
  livePhotoVideoId!: string | null;
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
    webpPath: entity.webpPath,
    encodedVideoPath: entity.encodedVideoPath,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
  };
}
