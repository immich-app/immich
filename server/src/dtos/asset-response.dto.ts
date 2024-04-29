import { ApiProperty } from '@nestjs/swagger';
import { PropertyLifecycle } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ExifResponseDto, mapExif } from 'src/dtos/exif.dto';
import { PersonWithFacesResponseDto, mapFacesWithoutPerson, mapPerson } from 'src/dtos/person.dto';
import { TagResponseDto, mapTag } from 'src/dtos/tag.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { SmartInfoEntity } from 'src/entities/smart-info.entity';

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
  people?: PersonWithFacesResponseDto[];
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
  auth?: AuthDto;
};

const peopleWithFaces = (faces: AssetFaceEntity[]): PersonWithFacesResponseDto[] => {
  const result: PersonWithFacesResponseDto[] = [];
  if (faces) {
    for (const face of faces) {
      if (face.person) {
        const existingPersonEntry = result.find((item) => item.id === face.person!.id);
        if (existingPersonEntry) {
          existingPersonEntry.faces.push(face);
        } else {
          result.push({ ...mapPerson(face.person!), faces: [mapFacesWithoutPerson(face)] });
        }
      }
    }
  }

  return result;
};

export function mapAsset(entity: AssetEntity, options: AssetMapOptions = {}): AssetResponseDto {
  const { stripMetadata = false, withStack = false } = options;

  if (stripMetadata) {
    const sanitizedAssetResponse: SanitizedAssetResponseDto = {
      id: entity.id,
      type: entity.type,
      thumbhash: entity.thumbhash?.toString('base64') ?? null,
      localDateTime: entity.localDateTime,
      resized: !!entity.previewPath,
      duration: entity.duration ?? '0:00:00.00000',
      livePhotoVideoId: entity.livePhotoVideoId,
      hasMetadata: false,
    };
    return sanitizedAssetResponse as AssetResponseDto;
  }

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
    resized: !!entity.previewPath,
    thumbhash: entity.thumbhash?.toString('base64') ?? null,
    fileCreatedAt: entity.fileCreatedAt,
    fileModifiedAt: entity.fileModifiedAt,
    localDateTime: entity.localDateTime,
    updatedAt: entity.updatedAt,
    isFavorite: options.auth?.user.id === entity.ownerId ? entity.isFavorite : false,
    isArchived: options.auth?.user.id === entity.ownerId ? entity.isArchived : false,
    isTrashed: !!entity.deletedAt,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map(mapTag),
    people: peopleWithFaces(entity.faces),
    checksum: entity.checksum.toString('base64'),
    stackParentId: withStack ? entity.stack?.primaryAssetId : undefined,
    stack: withStack
      ? entity.stack?.assets
          .filter((a) => a.id !== entity.stack?.primaryAssetId)
          .map((a) => mapAsset(a, { stripMetadata, auth: options.auth }))
      : undefined,
    stackCount: entity.stack?.assets?.length ?? null,
    isExternal: entity.isExternal,
    isOffline: entity.isOffline,
    isReadOnly: entity.isReadOnly,
    hasMetadata: true,
  };
}

export class MemoryLaneResponseDto {
  @PropertyLifecycle({ deprecatedAt: 'v1.100.0' })
  title!: string;

  @ApiProperty({ type: 'integer' })
  yearsAgo!: number;

  assets!: AssetResponseDto[];
}

export class SmartInfoResponseDto {
  tags?: string[] | null;
  objects?: string[] | null;
}

export function mapSmartInfo(entity: SmartInfoEntity): SmartInfoResponseDto {
  return {
    tags: entity.tags,
    objects: entity.objects,
  };
}
