import { ShallowDehydrateObject } from 'kysely';
import _ from 'lodash';
import { createZodDto } from 'nestjs-zod';
import { AlbumUser, AuthSharedLink, User } from 'src/database';
import { BulkIdErrorReasonSchema } from 'src/dtos/asset-ids.response.dto';
import { AssetResponseSchema, MapAsset, mapAsset } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { UserResponseSchema, mapUser } from 'src/dtos/user.dto';
import { AlbumUserRole, AlbumUserRoleSchema, AssetOrder, AssetOrderSchema } from 'src/enum';
import { MaybeDehydrated } from 'src/types';
import { asDateString } from 'src/utils/date';
import { stringToBool } from 'src/validation';
import z from 'zod';

const AlbumInfoSchema = z
  .object({
    withoutAssets: stringToBool.optional().describe('Exclude assets from response'),
  })
  .meta({ id: 'AlbumInfoDto' });

const AlbumUserAddSchema = z
  .object({
    userId: z.uuidv4().describe('User ID'),
    role: AlbumUserRoleSchema.default(AlbumUserRole.Editor).optional().describe('Album user role'),
  })
  .meta({ id: 'AlbumUserAddDto' });

const AddUsersSchema = z
  .object({
    albumUsers: z.array(AlbumUserAddSchema).min(1).describe('Album users to add'),
  })
  .meta({ id: 'AddUsersDto' });

const AlbumUserCreateSchema = z
  .object({
    userId: z.uuidv4().describe('User ID'),
    role: AlbumUserRoleSchema,
  })
  .meta({ id: 'AlbumUserCreateDto' });

const CreateAlbumSchema = z
  .object({
    albumName: z.string().describe('Album name'),
    description: z.string().optional().describe('Album description'),
    albumUsers: z.array(AlbumUserCreateSchema).optional().describe('Album users'),
    assetIds: z.array(z.uuidv4()).optional().describe('Initial asset IDs'),
  })
  .meta({ id: 'CreateAlbumDto' });

const AlbumsAddAssetsSchema = z
  .object({
    albumIds: z.array(z.uuidv4()).describe('Album IDs'),
    assetIds: z.array(z.uuidv4()).describe('Asset IDs'),
  })
  .meta({ id: 'AlbumsAddAssetsDto' });

const AlbumsAddAssetsResponseSchema = z
  .object({
    success: z.boolean().describe('Operation success'),
    error: BulkIdErrorReasonSchema.optional(),
  })
  .meta({ id: 'AlbumsAddAssetsResponseDto' });

const UpdateAlbumSchema = z
  .object({
    albumName: z.string().optional().describe('Album name'),
    description: z.string().optional().describe('Album description'),
    albumThumbnailAssetId: z.uuidv4().optional().describe('Album thumbnail asset ID'),
    isActivityEnabled: z.boolean().optional().describe('Enable activity feed'),
    order: AssetOrderSchema.optional(),
  })
  .meta({ id: 'UpdateAlbumDto' });

const GetAlbumsSchema = z
  .object({
    shared: stringToBool
      .optional()
      .describe('Filter by shared status: true = only shared, false = not shared, undefined = all owned albums'),
    assetId: z.uuidv4().optional().describe('Filter albums containing this asset ID (ignores shared parameter)'),
  })
  .meta({ id: 'GetAlbumsDto' });

const AlbumStatisticsResponseSchema = z
  .object({
    owned: z.int().min(0).describe('Number of owned albums'),
    shared: z.int().min(0).describe('Number of shared albums'),
    notShared: z.int().min(0).describe('Number of non-shared albums'),
  })
  .meta({ id: 'AlbumStatisticsResponseDto' });

const UpdateAlbumUserSchema = z
  .object({
    role: AlbumUserRoleSchema,
  })
  .meta({ id: 'UpdateAlbumUserDto' });

const AlbumUserResponseSchema = z
  .object({
    user: UserResponseSchema,
    role: AlbumUserRoleSchema,
  })
  .meta({ id: 'AlbumUserResponseDto' });

const ContributorCountResponseSchema = z
  .object({
    userId: z.string().describe('User ID'),
    assetCount: z.int().min(0).describe('Number of assets contributed'),
  })
  .meta({ id: 'ContributorCountResponseDto' });

export const AlbumResponseSchema = z
  .object({
    id: z.string().describe('Album ID'),
    ownerId: z.string().describe('Owner user ID'),
    albumName: z.string().describe('Album name'),
    description: z.string().describe('Album description'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    createdAt: z.string().meta({ format: 'date-time' }).describe('Creation date'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    updatedAt: z.string().meta({ format: 'date-time' }).describe('Last update date'),
    albumThumbnailAssetId: z.string().nullable().describe('Thumbnail asset ID'),
    shared: z.boolean().describe('Is shared album'),
    albumUsers: z.array(AlbumUserResponseSchema),
    hasSharedLink: z.boolean().describe('Has shared link'),
    assets: z.array(AssetResponseSchema),
    owner: UserResponseSchema,
    assetCount: z.int().min(0).describe('Number of assets'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    lastModifiedAssetTimestamp: z
      .string()
      .meta({ format: 'date-time' })
      .optional()
      .describe('Last modified asset timestamp'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    startDate: z.string().meta({ format: 'date-time' }).optional().describe('Start date (earliest asset)'),
    // TODO: use `isoDatetimeToDate` when using `ZodSerializerDto` on the controllers.
    endDate: z.string().meta({ format: 'date-time' }).optional().describe('End date (latest asset)'),
    isActivityEnabled: z.boolean().describe('Activity feed enabled'),
    order: AssetOrderSchema.optional(),
    contributorCounts: z.array(ContributorCountResponseSchema).optional(),
  })
  .meta({ id: 'AlbumResponseDto' });

export class AlbumInfoDto extends createZodDto(AlbumInfoSchema) {}
export class AddUsersDto extends createZodDto(AddUsersSchema) {}
export class AlbumUserCreateDto extends createZodDto(AlbumUserCreateSchema) {}
export class CreateAlbumDto extends createZodDto(CreateAlbumSchema) {}
export class AlbumsAddAssetsDto extends createZodDto(AlbumsAddAssetsSchema) {}
export class AlbumsAddAssetsResponseDto extends createZodDto(AlbumsAddAssetsResponseSchema) {}
export class UpdateAlbumDto extends createZodDto(UpdateAlbumSchema) {}
export class GetAlbumsDto extends createZodDto(GetAlbumsSchema) {}
export class AlbumStatisticsResponseDto extends createZodDto(AlbumStatisticsResponseSchema) {}
export class UpdateAlbumUserDto extends createZodDto(UpdateAlbumUserSchema) {}
export class AlbumResponseDto extends createZodDto(AlbumResponseSchema) {}
class AlbumUserResponseDto extends createZodDto(AlbumUserResponseSchema) {}

export type MapAlbumDto = {
  albumUsers?: AlbumUser[];
  assets?: ShallowDehydrateObject<MapAsset>[];
  sharedLinks?: ShallowDehydrateObject<AuthSharedLink>[];
  albumName: string;
  description: string;
  albumThumbnailAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
  id: string;
  ownerId: string;
  owner: ShallowDehydrateObject<User>;
  isActivityEnabled: boolean;
  order: AssetOrder;
};

export const mapAlbum = (
  entity: MaybeDehydrated<MapAlbumDto>,
  withAssets: boolean,
  auth?: AuthDto,
): AlbumResponseDto => {
  const albumUsers: AlbumUserResponseDto[] = [];

  if (entity.albumUsers) {
    for (const albumUser of entity.albumUsers) {
      const user = mapUser(albumUser.user);
      albumUsers.push({
        user,
        role: albumUser.role,
      });
    }
  }

  const albumUsersSorted = _.orderBy(albumUsers, ['role', 'user.name']);

  const assets = entity.assets || [];

  const hasSharedLink = !!entity.sharedLinks && entity.sharedLinks.length > 0;
  const hasSharedUser = albumUsers.length > 0;

  let startDate = assets.at(0)?.localDateTime;
  let endDate = assets.at(-1)?.localDateTime;
  // Swap dates if start date is greater than end date.
  if (startDate && endDate && startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  return {
    albumName: entity.albumName,
    description: entity.description,
    albumThumbnailAssetId: entity.albumThumbnailAssetId,
    createdAt: asDateString(entity.createdAt),
    updatedAt: asDateString(entity.updatedAt),
    id: entity.id,
    ownerId: entity.ownerId,
    owner: mapUser(entity.owner),
    albumUsers: albumUsersSorted,
    shared: hasSharedUser || hasSharedLink,
    hasSharedLink,
    startDate: asDateString(startDate),
    endDate: asDateString(endDate),
    assets: (withAssets ? assets : []).map((asset) => mapAsset(asset, { auth })),
    assetCount: entity.assets?.length || 0,
    isActivityEnabled: entity.isActivityEnabled,
    order: entity.order,
  };
};

export const mapAlbumWithAssets = (entity: MaybeDehydrated<MapAlbumDto>) => mapAlbum(entity, true);
export const mapAlbumWithoutAssets = (entity: MaybeDehydrated<MapAlbumDto>) => mapAlbum(entity, false);
