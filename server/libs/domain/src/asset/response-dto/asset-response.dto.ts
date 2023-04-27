import { AssetEntity, AssetFaceEntity, AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { mapTag, TagResponseDto } from '../../tag';
import { ExifResponseDto, mapExif } from './exif-response.dto';
import { mapSmartInfo, SmartInfoResponseDto } from './smart-info-response.dto';

export class PersonResponseDto {
  id!: string;
  name!: string;
  thumbnailPath!: string;
}

export function mapPerson(face: AssetFaceEntity): PersonResponseDto {
  return {
    id: face.person.id,
    name: face.person.name,
    thumbnailPath: face.person.thumbnailPath,
  };
}

export class AssetResponseDto {
  id!: string;
  deviceAssetId!: string;
  ownerId!: string;
  deviceId!: string;

  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;
  originalPath!: string;
  originalFileName!: string;
  resizePath!: string | null;
  fileCreatedAt!: string;
  fileModifiedAt!: string;
  updatedAt!: string;
  isFavorite!: boolean;
  isArchived!: boolean;
  mimeType!: string | null;
  duration!: string;
  webpPath!: string | null;
  encodedVideoPath?: string | null;
  exifInfo?: ExifResponseDto;
  smartInfo?: SmartInfoResponseDto;
  livePhotoVideoId?: string | null;
  tags?: TagResponseDto[];
  people?: PersonResponseDto[];
}

export function mapAsset(entity: AssetEntity): AssetResponseDto {
  return {
    id: entity.id,
    deviceAssetId: entity.deviceAssetId,
    ownerId: entity.ownerId,
    deviceId: entity.deviceId,
    type: entity.type,
    originalPath: entity.originalPath,
    originalFileName: entity.originalFileName,
    resizePath: entity.resizePath,
    fileCreatedAt: entity.fileCreatedAt,
    fileModifiedAt: entity.fileModifiedAt,
    updatedAt: entity.updatedAt,
    isFavorite: entity.isFavorite,
    isArchived: entity.isArchived,
    mimeType: entity.mimeType,
    webpPath: entity.webpPath,
    encodedVideoPath: entity.encodedVideoPath,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map(mapTag),
    people: entity.faces?.map(mapPerson),
  };
}

export function mapAssetWithoutExif(entity: AssetEntity): AssetResponseDto {
  return {
    id: entity.id,
    deviceAssetId: entity.deviceAssetId,
    ownerId: entity.ownerId,
    deviceId: entity.deviceId,
    type: entity.type,
    originalPath: entity.originalPath,
    originalFileName: entity.originalFileName,
    resizePath: entity.resizePath,
    fileCreatedAt: entity.fileCreatedAt,
    fileModifiedAt: entity.fileModifiedAt,
    updatedAt: entity.updatedAt,
    isFavorite: entity.isFavorite,
    isArchived: entity.isArchived,
    mimeType: entity.mimeType,
    webpPath: entity.webpPath,
    encodedVideoPath: entity.encodedVideoPath,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map(mapTag),
    people: entity.faces?.map(mapPerson),
  };
}
