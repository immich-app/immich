import { ApiProperty } from '@nestjs/swagger';
import { PropertyLifecycle } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ExifResponseDto, mapExif } from 'src/dtos/exif.dto';
import {
  AssetFaceWithoutPersonResponseDto,
  PersonWithFacesResponseDto,
  mapFacesWithoutPerson,
  mapPerson,
} from 'src/dtos/person.dto';
import { TagResponseDto, mapTag } from 'src/dtos/tag.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { SmartInfoEntity } from 'src/entities/smart-info.entity';
import { AssetType } from 'src/enum';
import { mimeTypes } from 'src/utils/mime-types';

export class SanitizedAssetResponseDto {
  id!: string;
  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;
  thumbhash!: string | null;
  originalMimeType?: string;
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
  @PropertyLifecycle({ deprecatedAt: 'v1.106.0' })
  libraryId?: string | null;
  originalPath!: string;
  originalFileName!: string;
  fileCreatedAt!: Date;
  fileModifiedAt!: Date;
  updatedAt!: Date;
  isFavorite!: boolean;
  isArchived!: boolean;
  isTrashed!: boolean;
  isOffline!: boolean;
  exifInfo?: ExifResponseDto;
  smartInfo?: SmartInfoResponseDto;
  tags?: TagResponseDto[];
  people?: PersonWithFacesResponseDto[];
  unassignedFaces?: AssetFaceWithoutPersonResponseDto[];
  /**base64 encoded sha1 hash */
  checksum!: string;
  stack?: AssetStackResponseDto | null;
  duplicateId?: string | null;

  @PropertyLifecycle({ deprecatedAt: 'v1.113.0' })
  resized?: boolean;
}

export class AssetStackResponseDto {
  id!: string;

  primaryAssetId!: string;

  @ApiProperty({ type: 'integer' })
  assetCount!: number;
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

const mapStack = (entity: AssetEntity) => {
  if (!entity.stack) {
    return null;
  }

  return {
    id: entity.stack.id,
    primaryAssetId: entity.stack.primaryAssetId,
    assetCount: entity.stack.assetCount ?? entity.stack.assets.length,
  };
};

export function mapAsset(entity: AssetEntity, options: AssetMapOptions = {}): AssetResponseDto {
  const { stripMetadata = false, withStack = false } = options;

  if (stripMetadata) {
    const sanitizedAssetResponse: SanitizedAssetResponseDto = {
      id: entity.id,
      type: entity.type,
      originalMimeType: mimeTypes.lookup(entity.originalFileName),
      thumbhash: entity.thumbhash?.toString('base64') ?? null,
      localDateTime: entity.localDateTime,
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
    originalMimeType: mimeTypes.lookup(entity.originalFileName),
    thumbhash: entity.thumbhash?.toString('base64') ?? null,
    fileCreatedAt: entity.fileCreatedAt,
    fileModifiedAt: entity.fileModifiedAt,
    localDateTime: entity.localDateTime,
    updatedAt: entity.updatedAt,
    isFavorite: options.auth?.user.id === entity.ownerId ? entity.isFavorite : false,
    isArchived: entity.isArchived,
    isTrashed: !!entity.deletedAt,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    smartInfo: entity.smartInfo ? mapSmartInfo(entity.smartInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map((tag) => mapTag(tag)),
    people: peopleWithFaces(entity.faces),
    unassignedFaces: entity.faces?.filter((face) => !face.person).map((a) => mapFacesWithoutPerson(a)),
    checksum: entity.checksum.toString('base64'),
    stack: withStack ? mapStack(entity) : undefined,
    isOffline: entity.isOffline,
    hasMetadata: true,
    duplicateId: entity.duplicateId,
    resized: true,
  };
}

export class MemoryLaneResponseDto {
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
