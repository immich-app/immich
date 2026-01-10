import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SharedLink } from 'src/database';
import { HistoryBuilder, Property } from 'src/decorators';
import { AlbumResponseDto, mapAlbumWithoutAssets } from 'src/dtos/album.dto';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export class SharedLinkSearchDto {
  @ApiPropertyOptional({ description: 'Filter by album ID' })
  @ValidateUUID({ optional: true })
  albumId?: string;

  @ApiPropertyOptional({ description: 'Filter by shared link ID' })
  @ValidateUUID({ optional: true })
  @Property({ history: new HistoryBuilder().added('v2.5.0') })
  id?: string;
}

export class SharedLinkCreateDto {
  @ApiProperty({ description: 'Shared link type', enum: SharedLinkType })
  @ValidateEnum({ enum: SharedLinkType, name: 'SharedLinkType' })
  type!: SharedLinkType;

  @ApiPropertyOptional({ description: 'Asset IDs (for individual assets)', type: [String] })
  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ApiPropertyOptional({ description: 'Album ID (for album sharing)' })
  @ValidateUUID({ optional: true })
  albumId?: string;

  @ApiPropertyOptional({ description: 'Link description', nullable: true })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Link password', nullable: true })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  password?: string | null;

  @ApiPropertyOptional({ description: 'Custom URL slug', nullable: true })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({ description: 'Expiration date', nullable: true })
  @ValidateDate({ optional: true, nullable: true })
  expiresAt?: Date | null = null;

  @ApiPropertyOptional({ description: 'Allow uploads', default: false })
  @ValidateBoolean({ optional: true })
  allowUpload?: boolean;

  @ApiPropertyOptional({ description: 'Allow downloads', default: true })
  @ValidateBoolean({ optional: true })
  allowDownload?: boolean = true;

  @ApiPropertyOptional({ description: 'Show metadata', default: true })
  @ValidateBoolean({ optional: true })
  showMetadata?: boolean = true;
}

export class SharedLinkEditDto {
  @ApiPropertyOptional({ description: 'Link description', nullable: true })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: 'Link password', nullable: true })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  password?: string | null;

  @ApiPropertyOptional({ description: 'Custom URL slug', nullable: true })
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  slug?: string | null;

  @ApiPropertyOptional({ description: 'Expiration date', nullable: true })
  @Optional({ nullable: true })
  expiresAt?: Date | null;

  @ApiPropertyOptional({ description: 'Allow uploads' })
  @ValidateBoolean({ optional: true })
  allowUpload?: boolean;

  @ApiPropertyOptional({ description: 'Allow downloads' })
  @ValidateBoolean({ optional: true })
  allowDownload?: boolean;

  @ApiPropertyOptional({ description: 'Show metadata' })
  @ValidateBoolean({ optional: true })
  showMetadata?: boolean;

  @ApiPropertyOptional({ description: 'Change expiry time (set to true to remove expiry)' })
  @ValidateBoolean({ optional: true })
  changeExpiryTime?: boolean;
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
  @ApiProperty({ description: 'Link description', nullable: true })
  description!: string | null;
  @ApiProperty({ description: 'Has password', nullable: true })
  password!: string | null;
  @ApiPropertyOptional({ description: 'Access token', nullable: true })
  token?: string | null;
  @ApiProperty({ description: 'Owner user ID' })
  userId!: string;
  @ApiProperty({ description: 'Encryption key (base64url)' })
  key!: string;

  @ApiProperty({ description: 'Shared link type', enum: SharedLinkType })
  @ValidateEnum({ enum: SharedLinkType, name: 'SharedLinkType' })
  type!: SharedLinkType;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: Date;
  @ApiProperty({ description: 'Expiration date', nullable: true })
  expiresAt!: Date | null;
  @ApiProperty({ description: 'Shared assets', type: [AssetResponseDto] })
  assets!: AssetResponseDto[];
  @ApiPropertyOptional({ description: 'Shared album', type: AlbumResponseDto })
  album?: AlbumResponseDto;
  @ApiProperty({ description: 'Allow uploads' })
  allowUpload!: boolean;

  @ApiProperty({ description: 'Allow downloads' })
  allowDownload!: boolean;
  @ApiProperty({ description: 'Show metadata' })
  showMetadata!: boolean;

  @ApiProperty({ description: 'Custom URL slug', nullable: true })
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
