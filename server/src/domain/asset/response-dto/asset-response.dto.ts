import { AssetEntity, AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { PersonResponseDto, mapFace } from '../../person/person.dto';
import { TagResponseDto, mapTag } from '../../tag';
import { UserResponseDto, mapUser } from '../../user/response-dto/user-response.dto';
import { ExifResponseDto, mapExif } from './exif-response.dto';
import { SmartInfoResponseDto, mapSmartInfo } from './smart-info-response.dto';

export class SanitizedAssetResponseDto {
  id!: string;
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;
  thumbhash!: string | null;
  resized!: boolean;
  localDateTime!: Date;
  duration!: string;
  livePhotoVideoId?: string | null;
  hasMetadata!: boolean;
}

export class AssetResponseDto extends SanitizedAssetResponseDto {
  deviceAssetId!: string;
  deviceId!: string;
  ownerId!: string;
  owner?: UserResponseDto;
  libraryId!: string;
  originalPath!: string;
  originalFileName!: string;
  resized!: boolean;
  fileCreatedAt!: Date;
  fileModifiedAt!: Date;
  updatedAt!: Date;
  isFavorite!: boolean;
  isArchived!: boolean;
  isTrashed!: boolean;
  isOffline!: boolean;
  isExternal!: boolean;
  isReadOnly!: boolean;
  exifInfo?: ExifResponseDto;
  smartInfo?: SmartInfoResponseDto;
  tags?: TagResponseDto[];
  people?: PersonResponseDto[];
  /**base64 encoded sha1 hash */
  checksum!: string;
  stackParentId?: string | null;
  stack?: AssetResponseDto[];
  @ApiProperty({ type: 'integer' })
  stackCount!: number | null;
}

export type AssetMapOptions = {
  stripMetadata?: boolean;
  withStack?: boolean;
};

export function mapAsset(entity: AssetEntity, options: AssetMapOptions = {}): AssetResponseDto {
  const { stripMetadata = false, withStack = false } = options;

  const sanitizedAssetResponse: SanitizedAssetResponseDto = {
    id: entity.id,
    type: entity.type,
    thumbhash: entity.thumbhash?.toString('base64') ?? null,
    localDateTime: entity.localDateTime,
    resized: !!entity.resizePath,
    duration: entity.duration ?? '0:00:00.00000',
    livePhotoVideoId: entity.livePhotoVideoId,
    hasMetadata: false,
  };

  if (stripMetadata) {
    return sanitizedAssetResponse as AssetResponseDto;
  }

  return {
    ...sanitizedAssetResponse,
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
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map(mapTag),
    people: entity.faces
      ?.map(mapFace)
      .filter((person): person is PersonResponseDto => person !== null && !person.isHidden)
      .reduce((people, person) => {
        const existingPerson = people.find((p) => p.id === person.id);
        if (!existingPerson) {
          people.push(person);
        }
        return people;
      }, [] as PersonResponseDto[]),
    checksum: entity.checksum.toString('base64'),
    stackParentId: entity.stackParentId,
    stack: withStack ? entity.stack?.map((a) => mapAsset(a, { stripMetadata })) ?? undefined : undefined,
    stackCount: entity.stack?.length ?? null,
    isExternal: entity.isExternal,
    isOffline: entity.isOffline,
    isReadOnly: entity.isReadOnly,
    hasMetadata: true,
  };
}

export class MemoryLaneResponseDto {
  title!: string;
  assets!: AssetResponseDto[];
}
