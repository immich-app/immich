import { AssetEntity, AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { PersonResponseDto, mapFace } from '../../person/person.dto';
import { TagResponseDto, mapTag } from '../../tag';
import { UserResponseDto, mapUser } from '../../user/response-dto/user-response.dto';
import { ExifResponseDto, mapExif } from './exif-response.dto';
import { SmartInfoResponseDto, mapSmartInfo } from './smart-info-response.dto';

export class AssetResponseDto {
  id!: string;
  deviceAssetId!: string;
  deviceId!: string;
  ownerId!: string;
  owner?: UserResponseDto;
  libraryId!: string;

  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;
  originalPath!: string;
  originalFileName!: string;
  resized!: boolean;
  /**base64 encoded thumbhash */
  thumbhash!: string | null;
  fileCreatedAt!: Date;
  fileModifiedAt!: Date;
  updatedAt!: Date;
  isFavorite!: boolean;
  isArchived!: boolean;
  isTrashed!: boolean;
  localDateTime!: Date;
  isOffline!: boolean;
  isExternal!: boolean;
  isReadOnly!: boolean;
  duration!: string;
  exifInfo?: ExifResponseDto;
  smartInfo?: SmartInfoResponseDto;
  livePhotoVideoId?: string | null;
  tags?: TagResponseDto[];
  people?: PersonResponseDto[];
  /**base64 encoded sha1 hash */
  checksum!: string;
  stackParentId?: string | null;
  stack?: AssetResponseDto[];
  @ApiProperty({ type: 'integer' })
  stackCount!: number;
}

function _map(entity: AssetEntity, withExif: boolean, withStack: boolean): AssetResponseDto {
  return {
    id: entity.id,
    deviceAssetId: entity.deviceAssetId,
    ownerId: entity.ownerId,
    owner: entity.owner ? mapUser(entity.owner) : undefined,
    deviceId: entity.deviceId,
    libraryId: entity.libraryId,
    type: entity.type,
    originalPath: entity.originalPath,
    originalFileName: entity.originalFileName,
    resized: !!entity.resizePath,
    thumbhash: entity.thumbhash?.toString('base64') ?? null,
    fileCreatedAt: entity.fileCreatedAt,
    fileModifiedAt: entity.fileModifiedAt,
    localDateTime: entity.localDateTime,
    updatedAt: entity.updatedAt,
    isFavorite: entity.isFavorite,
    isArchived: entity.isArchived,
    isTrashed: !!entity.deletedAt,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: withExif ? (entity.exifInfo ? mapExif(entity.exifInfo) : undefined) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map(mapTag),
    people: entity.faces?.map(mapFace).filter((person) => !person.isHidden),
    checksum: entity.checksum.toString('base64'),
    stackParentId: entity.stackParentId,
    stack: withStack ? entity.stack?.map(mapAsset) ?? undefined : undefined,
    stackCount: entity.stack?.length ?? 0,
    isExternal: entity.isExternal,
    isOffline: entity.isOffline,
    isReadOnly: entity.isReadOnly,
  };
}

export function mapAsset(entity: AssetEntity): AssetResponseDto {
  return _map(entity, true, false);
}

export function mapAssetWithStack(entity: AssetEntity): AssetResponseDto {
  return _map(entity, true, true);
}

export function mapAssetWithoutExif(entity: AssetEntity): AssetResponseDto {
  return _map(entity, false, true);
}

export class MemoryLaneResponseDto {
  title!: string;
  assets!: AssetResponseDto[];
}
