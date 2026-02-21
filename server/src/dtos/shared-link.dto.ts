import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { createZodDto } from 'nestjs-zod';
import { SharedLink } from 'src/database';
import { HistoryBuilder } from 'src/decorators';
import { AlbumResponseSchema, mapAlbumWithoutAssets } from 'src/dtos/album.dto';
import { AssetResponseSchema, mapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkType, SharedLinkTypeSchema } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';
import { z } from 'zod';

export class SharedLinkSearchDto {
  @ValidateUUID({ optional: true, description: 'Filter by album ID' })
  albumId?: string;

  @ValidateUUID({
    optional: true,
    description: 'Filter by shared link ID',
    history: new HistoryBuilder().added('v2.5.0'),
  })
  id?: string;
}

export class SharedLinkCreateDto {
  @ValidateEnum({ enum: SharedLinkType, name: 'SharedLinkType', description: 'Shared link type' })
  type!: SharedLinkType;

  @ValidateUUID({ each: true, optional: true, description: 'Asset IDs (for individual assets)' })
  assetIds?: string[];

  @ValidateUUID({ optional: true, description: 'Album ID (for album sharing)' })
  albumId?: string;

  @ApiPropertyOptional({ description: 'Link description' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Link password' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  password?: string | null;

  @ApiPropertyOptional({ description: 'Custom URL slug' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  slug?: string | null;

  @ValidateDate({ optional: true, nullable: true, description: 'Expiration date' })
  expiresAt?: Date | null = null;

  @ValidateBoolean({ optional: true, description: 'Allow uploads' })
  allowUpload?: boolean;

  @ValidateBoolean({ optional: true, description: 'Allow downloads', default: true })
  allowDownload?: boolean = true;

  @ValidateBoolean({ optional: true, description: 'Show metadata', default: true })
  showMetadata?: boolean = true;
}

export class SharedLinkEditDto {
  @ApiPropertyOptional({ description: 'Link description' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Link password' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  password?: string | null;

  @ApiPropertyOptional({ description: 'Custom URL slug' })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({ description: 'Expiration date' })
  @Optional({ nullable: true })
  expiresAt?: Date | null;

  @ValidateBoolean({ optional: true, description: 'Allow uploads' })
  allowUpload?: boolean;

  @ValidateBoolean({ optional: true, description: 'Allow downloads' })
  allowDownload?: boolean;

  @ValidateBoolean({ optional: true, description: 'Show metadata' })
  showMetadata?: boolean;

  @ValidateBoolean({
    optional: true,
    description:
      'Whether to change the expiry time. Few clients cannot send null to set the expiryTime to never. Setting this flag and not sending expiryAt is considered as null instead. Clients that can send null values can ignore this.',
  })
  changeExpiryTime?: boolean;
}

export class SharedLinkLoginDto {
  @ValidateString({ description: 'Shared link password', example: 'password' })
  password!: string;
}

export class SharedLinkPasswordDto {
  @ApiPropertyOptional({ example: 'password', description: 'Link password' })
  @IsString()
  @Optional()
  password?: string;

  @ApiPropertyOptional({ description: 'Access token' })
  @IsString()
  @Optional()
  token?: string;
}
export const SharedLinkResponseSchema = z
  .object({
    id: z.string().describe('Shared link ID'),
    description: z.string().describe('Link description').nullable(),
    password: z.string().describe('Has password').nullable(),
    token: z.string().describe('Access token').nullish(),
    userId: z.string().describe('Owner user ID'),
    key: z.string().describe('Encryption key (base64url)'),
    type: SharedLinkTypeSchema,
    createdAt: z.iso.datetime().describe('Creation date'),
    expiresAt: z.iso.datetime().describe('Expiration date').nullable(),
    assets: z.array(AssetResponseSchema),
    album: AlbumResponseSchema.optional(),
    allowUpload: z.boolean().describe('Allow uploads'),
    allowDownload: z.boolean().describe('Allow downloads'),
    showMetadata: z.boolean().describe('Show metadata'),
    slug: z.string().describe('Custom URL slug').nullable(),
  })
  .describe('Shared link response')
  .meta({ id: 'SharedLinkResponseDto' });

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
    createdAt: new Date(sharedLink.createdAt).toISOString(),
    expiresAt: sharedLink.expiresAt != null ? new Date(sharedLink.expiresAt).toISOString() : null,
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
