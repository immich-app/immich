import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import { AssetFace, AssetFile, Exif, Stack, Tag, User } from 'src/database';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetEditActionItem } from 'src/dtos/editing.dto';
import { ExifResponseSchema, mapExif } from 'src/dtos/exif.dto';
import {
  AssetFaceWithoutPersonResponseSchema,
  PersonWithFacesResponseDto,
  PersonWithFacesResponseSchema,
  mapFacesWithoutPerson,
  mapPerson,
} from 'src/dtos/person.dto';
import { TagResponseSchema, mapTag } from 'src/dtos/tag.dto';
import { UserResponseSchema, mapUser } from 'src/dtos/user.dto';
import { AssetStatus, AssetType, AssetTypeSchema, AssetVisibility, AssetVisibilitySchema } from 'src/enum';
import { ImageDimensions } from 'src/types';
import { getDimensions } from 'src/utils/asset.util';
import { hexOrBufferToBase64 } from 'src/utils/bytes';
import { mimeTypes } from 'src/utils/mime-types';
import { z } from 'zod';

const SanitizedAssetResponseSchema = z
  .object({
    id: z.string().describe('Asset ID'),
    type: AssetTypeSchema,
    thumbhash: z.string().describe('Thumbhash for thumbnail generation').nullable(),
    originalMimeType: z.string().optional().describe('Original MIME type'),
    localDateTime: z.iso
      .datetime()
      .describe(
        'The local date and time when the photo/video was taken, derived from EXIF metadata. This represents the photographer\'s local time regardless of timezone, stored as a timezone-agnostic timestamp. Used for timeline grouping by "local" days and months.',
      ),
    duration: z.string().describe('Video duration (for videos)'),
    livePhotoVideoId: z.string().nullish().describe('Live photo video ID'),
    hasMetadata: z.boolean().describe('Whether asset has metadata'),
    width: z.int().nonnegative().describe('Asset width').nullable(),
    height: z.int().nonnegative().describe('Asset height').nullable(),
  })
  .meta({ id: 'SanitizedAssetResponseDto' });

export class SanitizedAssetResponseDto extends createZodDto(SanitizedAssetResponseSchema) {}

const AssetStackResponseSchema = z
  .object({
    id: z.string().describe('Stack ID'),
    primaryAssetId: z.string().describe('Primary asset ID'),
    assetCount: z.int().nonnegative().describe('Number of assets in stack'),
  })
  .meta({ id: 'AssetStackResponseDto' });

export class AssetStackResponseDto extends createZodDto(AssetStackResponseSchema) {}

export const AssetResponseSchema = SanitizedAssetResponseSchema.extend(
  z.object({
    createdAt: z.iso.datetime().describe('The UTC timestamp when the asset was originally uploaded to Immich.'),
    deviceAssetId: z.string().describe('Device asset ID'),
    deviceId: z.string().describe('Device ID'),
    ownerId: z.string().describe('Owner user ID'),
    owner: UserResponseSchema.optional(),
    libraryId: z.uuidv4().nullish().describe('Library ID'),
    originalPath: z.string().describe('Original file path'),
    originalFileName: z.string().describe('Original file name'),
    fileCreatedAt: z.iso
      .datetime()
      .describe(
        'The actual UTC timestamp when the file was created/captured, preserving timezone information. This is the authoritative timestamp for chronological sorting within timeline groups. Combined with timezone data, this can be used to determine the exact moment the photo was taken.',
      ),
    fileModifiedAt: z.iso
      .datetime()
      .describe(
        'The UTC timestamp when the file was last modified on the filesystem. This reflects the last time the physical file was changed, which may be different from when the photo was originally taken.',
      ),
    updatedAt: z.iso
      .datetime()
      .describe(
        'The UTC timestamp when the asset record was last updated in the database. This is automatically maintained by the database and reflects when any field in the asset was last modified.',
      ),
    isFavorite: z.boolean().describe('Is favorite'),
    isArchived: z.boolean().describe('Is archived'),
    isTrashed: z.boolean().describe('Is trashed'),
    isOffline: z.boolean().describe('Is offline'),
    visibility: AssetVisibilitySchema,
    exifInfo: ExifResponseSchema.optional(),
    tags: z.array(TagResponseSchema).optional(),
    people: z.array(PersonWithFacesResponseSchema).optional(),
    unassignedFaces: z.array(AssetFaceWithoutPersonResponseSchema).optional(),
    checksum: z.string().describe('Base64 encoded SHA1 hash'),
    stack: AssetStackResponseSchema.nullish(),
    duplicateId: z.string().nullish().describe('Duplicate group ID'),
    resized: z.boolean().optional().describe('Is resized'),
    isEdited: z.boolean().describe('Is edited'),
  }).shape,
).meta({ id: 'AssetResponseDto' });

export class AssetResponseDto extends createZodDto(AssetResponseSchema) {}

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
      localDateTime: new Date(entity.localDateTime).toISOString(),
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
    createdAt: new Date(entity.createdAt).toISOString(),
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
    fileCreatedAt: new Date(entity.fileCreatedAt).toISOString(),
    fileModifiedAt: new Date(entity.fileModifiedAt).toISOString(),
    localDateTime: new Date(entity.localDateTime).toISOString(),
    updatedAt: new Date(entity.updatedAt).toISOString(),
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
