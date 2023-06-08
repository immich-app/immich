import { SharedLinkEntity, SharedLinkType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import _ from 'lodash';
import { AlbumResponseDto, mapAlbumExcludeAssetInfo } from '../../album';
import { AssetResponseDto, mapAsset, mapAssetWithoutExif } from '../../asset';

export class SharedLinkResponseDto {
  id!: string;
  description?: string;
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
  showExif!: boolean;
}

export function mapSharedLink(sharedLink: SharedLinkEntity): SharedLinkResponseDto {
  const linkAssets = sharedLink.assets || [];
  const albumAssets = (sharedLink?.album?.assets || []).map((asset) => asset);

  const assets = _.uniqBy([...linkAssets, ...albumAssets], (asset) => asset.id);

  return {
    id: sharedLink.id,
    description: sharedLink.description,
    userId: sharedLink.userId,
    key: sharedLink.key.toString('base64url'),
    type: sharedLink.type,
    createdAt: sharedLink.createdAt,
    expiresAt: sharedLink.expiresAt,
    assets: assets.map(mapAsset),
    album: sharedLink.album ? mapAlbumExcludeAssetInfo(sharedLink.album) : undefined,
    allowUpload: sharedLink.allowUpload,
    allowDownload: sharedLink.allowDownload,
    showExif: sharedLink.showExif,
  };
}

export function mapSharedLinkWithNoExif(sharedLink: SharedLinkEntity): SharedLinkResponseDto {
  const linkAssets = sharedLink.assets || [];
  const albumAssets = (sharedLink?.album?.assets || []).map((asset) => asset);

  const assets = _.uniqBy([...linkAssets, ...albumAssets], (asset) => asset.id);

  return {
    id: sharedLink.id,
    description: sharedLink.description,
    userId: sharedLink.userId,
    key: sharedLink.key.toString('base64url'),
    type: sharedLink.type,
    createdAt: sharedLink.createdAt,
    expiresAt: sharedLink.expiresAt,
    assets: assets.map(mapAssetWithoutExif),
    album: sharedLink.album ? mapAlbumExcludeAssetInfo(sharedLink.album) : undefined,
    allowUpload: sharedLink.allowUpload,
    allowDownload: sharedLink.allowDownload,
    showExif: sharedLink.showExif,
  };
}
