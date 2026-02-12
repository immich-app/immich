import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SharedLink } from 'src/database';
import { HistoryBuilder, Property } from 'src/decorators';
import { AlbumResponseDto, mapAlbumWithoutAssets } from 'src/dtos/album.dto';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateString, ValidateUUID } from 'src/validation';

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
export class SharedLinkResponseDto {
  @ApiProperty({ description: 'Shared link ID' })
  id!: string;
  @ApiProperty({ description: 'Link description' })
  description!: string | null;
  @ApiProperty({ description: 'Has password' })
  password!: string | null;
  @Property({
    description: 'Access token',
    history: new HistoryBuilder().added('v1').stable('v2').deprecated('v2.6.0'),
  })
  token?: string | null;
  @ApiProperty({ description: 'Owner user ID' })
  userId!: string;
  @ApiProperty({ description: 'Encryption key (base64url)' })
  key!: string;

  @ValidateEnum({ enum: SharedLinkType, name: 'SharedLinkType', description: 'Shared link type' })
  type!: SharedLinkType;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Expiration date' })
  expiresAt!: Date | null;
  // Description lives on schema to avoid duplication
  @ApiProperty({ description: undefined })
  assets!: AssetResponseDto[];
  // Description lives on schema to avoid duplication
  @ApiPropertyOptional({ description: undefined })
  album?: AlbumResponseDto;
  @ApiProperty({ description: 'Allow uploads' })
  allowUpload!: boolean;

  @ApiProperty({ description: 'Allow downloads' })
  allowDownload!: boolean;
  @ApiProperty({ description: 'Show metadata' })
  showMetadata!: boolean;

  @ApiProperty({ description: 'Custom URL slug' })
  slug!: string | null;
}

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
