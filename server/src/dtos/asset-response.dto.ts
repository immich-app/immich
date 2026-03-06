import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Selectable } from 'kysely';
import { AssetFace, AssetFile, Exif, Stack, Tag, User } from 'src/database';
import { HistoryBuilder, Property } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { ExifResponseDto, mapExif } from 'src/dtos/exif.dto';
import {
  AssetFaceWithoutPersonResponseDto,
  PersonWithFacesResponseDto,
  mapFacesWithoutPerson,
  mapPerson,
} from 'src/dtos/person.dto';
import { TagResponseDto, mapTag } from 'src/dtos/tag.dto';
import { UserResponseDto, mapUser } from 'src/dtos/user.dto';
import { AssetStatus, AssetType, AssetVisibility } from 'src/enum';
import { ImageDimensions } from 'src/types';
import { getDimensions } from 'src/utils/asset.util';
import { hexOrBufferToBase64 } from 'src/utils/bytes';
import { mimeTypes } from 'src/utils/mime-types';
import { ValidateEnum, ValidateUUID } from 'src/validation';

export class SanitizedAssetResponseDto {
  @ApiProperty({ description: 'Asset ID' })
  id!: string;
  @ValidateEnum({ enum: AssetType, name: 'AssetTypeEnum', description: 'Asset type' })
  type!: AssetType;
  @ApiProperty({
    description:
      'Thumbhash for thumbnail generation (base64) also used as the c query param for thumbnail cache busting.',
  })
  thumbhash!: string | null;
  @ApiPropertyOptional({ description: 'Original MIME type' })
  originalMimeType?: string;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description:
      'The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer\'s local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by "local" days and months.',
    example: '2024-01-15T14:30:00.000Z',
  })
  localDateTime!: Date;
  @ApiProperty({ description: 'Video duration (for videos)' })
  duration!: string;
  @ApiPropertyOptional({ description: 'Live photo video ID' })
  livePhotoVideoId?: string | null;
  @ApiProperty({ description: 'Whether asset has metadata' })
  hasMetadata!: boolean;
  @ApiProperty({ description: 'Asset width' })
  width!: number | null;
  @ApiProperty({ description: 'Asset height' })
  height!: number | null;
}

export class AssetResponseDto extends SanitizedAssetResponseDto {
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description: 'The UTC timestamp when the asset was originally uploaded to Immich.',
    example: '2024-01-15T20:30:00.000Z',
  })
  createdAt!: Date;
  @ApiProperty({ description: 'Device asset ID' })
  deviceAssetId!: string;
  @ApiProperty({ description: 'Device ID' })
  deviceId!: string;
  @ApiProperty({ description: 'Owner user ID' })
  ownerId!: string;
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  owner?: UserResponseDto;
  @ValidateUUID({
    nullable: true,
    description: 'Library ID',
    history: new HistoryBuilder().added('v1').deprecated('v1'),
  })
  libraryId?: string | null;
  @ApiProperty({ description: 'Original file path' })
  originalPath!: string;
  @ApiProperty({ description: 'Original file name' })
  originalFileName!: string;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description:
      'The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken.',
    example: '2024-01-15T19:30:00.000Z',
  })
  fileCreatedAt!: Date;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description:
      'The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken.',
    example: '2024-01-16T10:15:00.000Z',
  })
  fileModifiedAt!: Date;
  @ApiProperty({
    type: 'string',
    format: 'date-time',
    description:
      'The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified.',
    example: '2024-01-16T12:45:30.000Z',
  })
  updatedAt!: Date;
  @ApiProperty({ description: 'Is favorite' })
  isFavorite!: boolean;
  @ApiProperty({ description: 'Is archived' })
  isArchived!: boolean;
  @ApiProperty({ description: 'Is trashed' })
  isTrashed!: boolean;
  @ApiProperty({ description: 'Is offline' })
  isOffline!: boolean;
  @ValidateEnum({ enum: AssetVisibility, name: 'AssetVisibility', description: 'Asset visibility' })
  visibility!: AssetVisibility;
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  exifInfo?: ExifResponseDto;
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  tags?: TagResponseDto[];
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  people?: PersonWithFacesResponseDto[];
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  unassignedFaces?: AssetFaceWithoutPersonResponseDto[];
  @ApiProperty({ description: 'Base64 encoded SHA1 hash' })
  checksum!: string;
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  stack?: AssetStackResponseDto | null;
  @ApiPropertyOptional({ description: 'Duplicate group ID' })
  duplicateId?: string | null;

  @Property({ description: 'Is resized', history: new HistoryBuilder().added('v1').deprecated('v1.113.0') })
  resized?: boolean;
  @Property({ description: 'Is edited', history: new HistoryBuilder().added('v2.5.0').beta('v2.5.0') })
  isEdited!: boolean;
}

export type MapAsset = {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  id: string;
  updateId: string;
  status: AssetStatus;
  checksum: Buffer<ArrayBufferLike>;
  deviceAssetId: string;
  deviceId: string;
  duplicateId: string | null;
  duration: string | null;
  edits?: AssetEditActionItem[];
  encodedVideoPath: string | null;
  exifInfo?: Selectable<Exif> | null;
  faces?: AssetFace[];
  fileCreatedAt: Date;
  fileModifiedAt: Date;
  files?: AssetFile[];
  isExternal: boolean;
  isFavorite: boolean;
  isOffline: boolean;
  visibility: AssetVisibility;
  libraryId: string | null;
  livePhotoVideoId: string | null;
  localDateTime: Date;
  originalFileName: string;
  originalPath: string;
  owner?: User | null;
  ownerId: string;
  stack?: Stack | null;
  stackId: string | null;
  tags?: Tag[];
  thumbhash: Buffer<ArrayBufferLike> | null;
  type: AssetType;
  width: number | null;
  height: number | null;
  isEdited: boolean;
};

export class AssetStackResponseDto {
  @ApiProperty({ description: 'Stack ID' })
  id!: string;

  @ApiProperty({ description: 'Primary asset ID' })
  primaryAssetId!: string;

  @ApiProperty({ type: 'integer', description: 'Number of assets in stack' })
  assetCount!: number;
}

export type AssetMapOptions = {
  stripMetadata?: boolean;
  withStack?: boolean;
  auth?: AuthDto;
};

const peopleWithFaces = (
  faces?: AssetFace[],
  edits?: AssetEditActionItem[],
  assetDimensions?: ImageDimensions,
): PersonWithFacesResponseDto[] => {
  if (!faces) {
    return [];
  }

  const peopleFaces: Map<string, PersonWithFacesResponseDto> = new Map();

  for (const face of faces) {
    if (!face.person) {
      continue;
    }

    if (!peopleFaces.has(face.person.id)) {
      peopleFaces.set(face.person.id, { ...mapPerson(face.person), faces: [] });
    }
    const mappedFace = mapFacesWithoutPerson(face, edits, assetDimensions);
    peopleFaces.get(face.person.id)!.faces.push(mappedFace);
  }

  return [...peopleFaces.values()];
};

const mapStack = (entity: { stack?: Stack | null }) => {
  if (!entity.stack) {
    return null;
  }

  return {
    id: entity.stack.id,
    primaryAssetId: entity.stack.primaryAssetId,
    assetCount: entity.stack.assetCount ?? entity.stack.assets.length + 1,
  };
};

export function mapAsset(entity: MapAsset, options: AssetMapOptions = {}): AssetResponseDto {
  const { stripMetadata = false, withStack = false } = options;

  if (stripMetadata) {
    const sanitizedAssetResponse: SanitizedAssetResponseDto = {
      id: entity.id,
      type: entity.type,
      originalMimeType: mimeTypes.lookup(entity.originalFileName),
      thumbhash: entity.thumbhash ? hexOrBufferToBase64(entity.thumbhash) : null,
      localDateTime: entity.localDateTime,
      duration: entity.duration ?? '0:00:00.00000',
      livePhotoVideoId: entity.livePhotoVideoId,
      hasMetadata: false,
      width: entity.width,
      height: entity.height,
    };
    return sanitizedAssetResponse as AssetResponseDto;
  }

  const assetDimensions = entity.exifInfo ? getDimensions(entity.exifInfo) : undefined;

  return {
    id: entity.id,
    createdAt: entity.createdAt,
    deviceAssetId: entity.deviceAssetId,
    ownerId: entity.ownerId,
    owner: entity.owner ? mapUser(entity.owner) : undefined,
    deviceId: entity.deviceId,
    libraryId: entity.libraryId,
    type: entity.type,
    originalPath: entity.originalPath,
    originalFileName: entity.originalFileName,
    originalMimeType: mimeTypes.lookup(entity.originalFileName),
    thumbhash: entity.thumbhash ? hexOrBufferToBase64(entity.thumbhash) : null,
    fileCreatedAt: entity.fileCreatedAt,
    fileModifiedAt: entity.fileModifiedAt,
    localDateTime: entity.localDateTime,
    updatedAt: entity.updatedAt,
    isFavorite: options.auth?.user.id === entity.ownerId && entity.isFavorite,
    isArchived: entity.visibility === AssetVisibility.Archive,
    isTrashed: !!entity.deletedAt,
    visibility: entity.visibility,
    duration: entity.duration ?? '0:00:00.00000',
    exifInfo: entity.exifInfo ? mapExif(entity.exifInfo) : undefined,
    livePhotoVideoId: entity.livePhotoVideoId,
    tags: entity.tags?.map((tag) => mapTag(tag)),
    people: peopleWithFaces(entity.faces, entity.edits, assetDimensions),
    unassignedFaces: entity.faces
      ?.filter((face) => !face.person)
      .map((a) => mapFacesWithoutPerson(a, entity.edits, assetDimensions)),
    checksum: hexOrBufferToBase64(entity.checksum)!,
    stack: withStack ? mapStack(entity) : undefined,
    isOffline: entity.isOffline,
    hasMetadata: true,
    duplicateId: entity.duplicateId,
    resized: true,
    width: entity.width,
    height: entity.height,
    isEdited: entity.isEdited,
  };
}
