import { AssetEntity, AssetType } from '@app/infra/entities';

export interface AssetSearchOptions {
  isVisible?: boolean;
  type?: AssetType;
}

export interface LivePhotoSearchOptions {
  ownerId: string;
  livePhotoCID: string;
  otherAssetId: string;
  type: AssetType;
}

export interface MapMarkerSearchOptions {
  isFavorite?: boolean;
}

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
}

export enum WithoutProperty {
  THUMBNAIL = 'thumbnail',
  ENCODED_VIDEO = 'encoded-video',
  EXIF = 'exif',
  CLIP_ENCODING = 'clip-embedding',
  OBJECT_TAGS = 'object-tags',
  FACES = 'faces',
}

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  getByIds(ids: string[]): Promise<AssetEntity[]>;
  getWithout(property: WithoutProperty): Promise<AssetEntity[]>;
  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  deleteAll(ownerId: string): Promise<void>;
  getAll(options?: AssetSearchOptions): Promise<AssetEntity[]>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;
  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null>;
  getMapMarkers(ownerId: string, options?: MapMarkerSearchOptions): Promise<MapMarker[]>;
}
