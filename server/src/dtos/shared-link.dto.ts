import { createZodDto } from 'nestjs-zod';
import { SharedLink } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AlbumResponseSchema, mapAlbumWithoutAssets } from 'src/dtos/album.dto';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkTypeSchema } from 'src/enum';
import { emptyStringToNull, isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const SharedLinkSearchSchema = z
  .object({
    albumId: z.uuidv4().optional().describe('Filter by album ID'),
    id: z
      .uuidv4()
      .optional()
      .describe('Filter by shared link ID')
      .meta(new HistoryBuilder().added('v2.5.0').getExtensions()),
  })
  .meta({ id: 'SharedLinkSearchDto' });

const SharedLinkCreateSchema = z
  .object({
    type: SharedLinkTypeSchema,
    assetIds: z.array(z.uuidv4()).optional().describe('Asset IDs (for individual assets)'),
    albumId: z.uuidv4().optional().describe('Album ID (for album sharing)'),
    description: emptyStringToNull(z.string().nullable()).optional().describe('Link description'),
    password: emptyStringToNull(z.string().nullable()).optional().describe('Link password'),
    slug: emptyStringToNull(z.string().nullable()).optional().describe('Custom URL slug'),
    expiresAt: isoDatetimeToDate.nullable().describe('Expiration date').default(null).optional(),
    allowUpload: z.boolean().optional().describe('Allow uploads'),
    allowDownload: z.boolean().default(true).optional().describe('Allow downloads'),
    showMetadata: z.boolean().default(true).optional().describe('Show metadata'),
  })
  .meta({ id: 'SharedLinkCreateDto' });

const SharedLinkEditSchema = z
  .object({
    description: emptyStringToNull(z.string().nullable()).optional().describe('Link description'),
    password: emptyStringToNull(z.string().nullable()).optional().describe('Link password'),
    slug: emptyStringToNull(z.string().nullable()).optional().describe('Custom URL slug'),
    expiresAt: isoDatetimeToDate.nullish().describe('Expiration date'),
    allowUpload: z.boolean().optional().describe('Allow uploads'),
    allowDownload: z.boolean().optional().describe('Allow downloads'),
    showMetadata: z.boolean().optional().describe('Show metadata'),
    changeExpiryTime: z
      .boolean()
      .optional()
      .describe(
        'Whether to change the expiry time. Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this.',
      ),
  })
  .meta({ id: 'SharedLinkEditDto' });

const SharedLinkLoginSchema = z
  .object({
    password: z.string().describe('Shared link password').meta({ example: 'password' }),
  })
  .meta({ id: 'SharedLinkLoginDto' });

const SharedLinkPasswordSchema = z
  .object({
    password: z.string().optional().describe('Link password'),
    token: z.string().optional().describe('Access token'),
  })
  .meta({ id: 'SharedLinkPasswordDto' });

const SharedLinkResponseSchema = z
  .object({
    id: z.string().describe('Shared link ID'),
    description: z.string().nullable().describe('Link description'),
    password: z.string().nullable().describe('Has password'),
    token: z
      .string()
      .nullish()
      .describe('Access token')
      .meta({
        ...new HistoryBuilder().added('v1').stable('v2').deprecated('v2.6.0').getExtensions(),
        deprecated: true,
      }),
    userId: z.string().describe('Owner user ID'),
    key: z.string().describe('Encryption key (base64url)'),
    type: SharedLinkTypeSchema,
    createdAt: isoDatetimeToDate.describe('Creation date'),
    expiresAt: isoDatetimeToDate.nullable().describe('Expiration date'),
    assets: z.array(AssetResponseSchema),
    album: AlbumResponseSchema.optional(),
    allowUpload: z.boolean().describe('Allow uploads'),
    allowDownload: z.boolean().describe('Allow downloads'),
    showMetadata: z.boolean().describe('Show metadata'),
    slug: z.string().nullable().describe('Custom URL slug'),
  })
  .describe('Shared link response')
  .meta({ id: 'SharedLinkResponseDto' });

export class SharedLinkSearchDto extends createZodDto(SharedLinkSearchSchema) {}
export class SharedLinkCreateDto extends createZodDto(SharedLinkCreateSchema) {}
export class SharedLinkEditDto extends createZodDto(SharedLinkEditSchema) {}
export class SharedLinkLoginDto extends createZodDto(SharedLinkLoginSchema) {}
export class SharedLinkPasswordDto extends createZodDto(SharedLinkPasswordSchema) {}
export class SharedLinkResponseDto extends createZodDto(SharedLinkResponseSchema) {}

export function mapSharedLink(sharedLink: SharedLink, options: { stripAssetMetadata: boolean }): SharedLinkResponseDto {
  const assets = sharedLink.assets || [];

  const response = {
    id: sharedLink.id,
    description: sharedLink.description,
    password: sharedLink.password,
    userId: sharedLink.userId,
    key: sharedLink.key.toString('base64url'),
    type: sharedLink.type,
    createdAt: sharedLink.createdAt,
    expiresAt: sharedLink.expiresAt,
    assets: assets.map((asset) => mapAsset(asset, { stripMetadata: options.stripAssetMetadata })),
    album: sharedLink.album ? mapAlbumWithoutAssets(sharedLink.album) : undefined,
    allowUpload: sharedLink.allowUpload,
    allowDownload: sharedLink.allowDownload,
    showMetadata: sharedLink.showExif,
    slug: sharedLink.slug,
  };

  // unless we select sharedLink.album.sharedLinks this will be wrong
  if (response.album) {
    response.album.hasSharedLink = true;
    response.album.shared = true;
  }

  return response;
}
