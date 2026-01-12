import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { SharedLink } from 'src/database';
import { HistoryBuilder, Property } from 'src/decorators';
import { AlbumResponseDto, mapAlbumWithoutAssets } from 'src/dtos/album.dto';
import { AssetResponseDto, mapAsset } from 'src/dtos/asset-response.dto';
import { SharedLinkType } from 'src/enum';
import { Optional, ValidateBoolean, ValidateDate, ValidateEnum, ValidateUUID } from 'src/validation';

export class SharedLinkSearchDto {
  @ValidateUUID({ optional: true })
  albumId?: string;

  @ValidateUUID({ optional: true })
  @Property({ history: new HistoryBuilder().added('v2.5.0') })
  id?: string;
}

export class SharedLinkCreateDto {
  @ValidateEnum({ enum: SharedLinkType, name: 'SharedLinkType' })
  type!: SharedLinkType;

  @ValidateUUID({ each: true, optional: true })
  assetIds?: string[];

  @ValidateUUID({ optional: true })
  albumId?: string;

  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  description?: string | null;

  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  password?: string | null;

  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  slug?: string | null;

  @ValidateDate({ optional: true, nullable: true })
  expiresAt?: Date | null = null;

  @ValidateBoolean({ optional: true })
  allowUpload?: boolean;

  @ValidateBoolean({ optional: true })
  allowDownload?: boolean = true;

  @ValidateBoolean({ optional: true })
  showMetadata?: boolean = true;
}

export class SharedLinkEditDto {
  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  description?: string | null;

  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  password?: string | null;

  @Optional({ nullable: true, emptyToNull: true })
  @IsString()
  slug?: string | null;

  @Optional({ nullable: true })
  expiresAt?: Date | null;

  @ValidateBoolean({ optional: true })
  allowUpload?: boolean;

  @ValidateBoolean({ optional: true })
  allowDownload?: boolean;

  @ValidateBoolean({ optional: true })
  showMetadata?: boolean;

  /**
   * Few clients cannot send null to set the expiryTime to never.
   * Setting this flag and not sending expiryAt is considered as null instead.
   * Clients that can send null values can ignore this.
   */
  @ValidateBoolean({ optional: true })
  changeExpiryTime?: boolean;
}

export class SharedLinkPasswordDto {
  @IsString()
  @Optional()
  @ApiProperty({ example: 'password' })
  password?: string;

  @IsString()
  @Optional()
  token?: string;
}
export class SharedLinkResponseDto {
  id!: string;
  description!: string | null;
  password!: string | null;
  token?: string | null;
  userId!: string;
  key!: string;

  @ValidateEnum({ enum: SharedLinkType, name: 'SharedLinkType' })
  type!: SharedLinkType;
  createdAt!: Date;
  expiresAt!: Date | null;
  assets!: AssetResponseDto[];
  album?: AlbumResponseDto;
  allowUpload!: boolean;

  allowDownload!: boolean;
  showMetadata!: boolean;

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
