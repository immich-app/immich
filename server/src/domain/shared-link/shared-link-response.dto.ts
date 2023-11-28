import { SharedLinkEntity, SharedLinkType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import _ from 'lodash';
import { AlbumResponseDto, mapAlbumWithoutAssets } from '../album';
import { AssetResponseDto, mapAsset } from '../asset';

export class SharedLinkResponseDto {
  id!: string;
  description!: string | null;
  password!: string | null;
  token?: string | null;
  userId!: string;
  key!: string;

  @ApiProperty({ enumName: 'SharedLinkType', enum: SharedLinkType })
  type!: SharedLinkType;
  createdAt!: Date;
  expiresAt!: Date | null;
  assets!: AssetResponseDto[];
  album?: AlbumResponseDto;
  allowUpload!: boolean;

  allowDownload!: boolean;
  showMetadata!: boolean;
}

export function mapSharedLink(sharedLink: SharedLinkEntity): SharedLinkResponseDto {
  const linkAssets = sharedLink.assets || [];
  const albumAssets = (sharedLink?.album?.assets || []).map((asset) => asset);

  const assets = _.uniqBy([...linkAssets, ...albumAssets], (asset) => asset.id);

  return {
    id: sharedLink.id,
    description: sharedLink.description,
    password: sharedLink.password,
    userId: sharedLink.userId,
    key: sharedLink.key.toString('base64url'),
    type: sharedLink.type,
    createdAt: sharedLink.createdAt,
    expiresAt: sharedLink.expiresAt,
    assets: assets.map((asset) => mapAsset(asset)),
    album: sharedLink.album ? mapAlbumWithoutAssets(sharedLink.album) : undefined,
    allowUpload: sharedLink.allowUpload,
    allowDownload: sharedLink.allowDownload,
    showMetadata: sharedLink.showExif,
  };
}

export function mapSharedLinkWithoutMetadata(sharedLink: SharedLinkEntity): SharedLinkResponseDto {
  const linkAssets = sharedLink.assets || [];
  const albumAssets = (sharedLink?.album?.assets || []).map((asset) => asset);

  const assets = _.uniqBy([...linkAssets, ...albumAssets], (asset) => asset.id);

  return {
    id: sharedLink.id,
    description: sharedLink.description,
    password: sharedLink.password,
    userId: sharedLink.userId,
    key: sharedLink.key.toString('base64url'),
    type: sharedLink.type,
    createdAt: sharedLink.createdAt,
    expiresAt: sharedLink.expiresAt,
    assets: assets.map((asset) => mapAsset(asset, { stripMetadata: true })) as AssetResponseDto[],
    album: sharedLink.album ? mapAlbumWithoutAssets(sharedLink.album) : undefined,
    allowUpload: sharedLink.allowUpload,
    allowDownload: sharedLink.allowDownload,
    showMetadata: sharedLink.showExif,
  };
}
