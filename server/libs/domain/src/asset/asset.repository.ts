import { AssetEntity, AssetType } from '@app/infra/entities';

export interface AssetSearchOptions {
  isVisible?: boolean;
  type?: AssetType;
}

export enum WithoutProperty {
  THUMBNAIL = 'thumbnail',
  ENCODED_VIDEO = 'encoded-video',
  EXIF = 'exif',
  CLIP_ENCODING = 'clip-embedding',
  OBJECT_TAGS = 'object-tags',
}

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  getByIds(ids: string[]): Promise<AssetEntity[]>;
  getWithout(property: WithoutProperty): Promise<AssetEntity[]>;
  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  deleteAll(ownerId: string): Promise<void>;
  getAll(options?: AssetSearchOptions): Promise<AssetEntity[]>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;
  findLivePhotoMatch(livePhotoCID: string, otherAssetId: string, type: AssetType): Promise<AssetEntity | null>;
}
