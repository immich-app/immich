import { AssetEntity, AssetType, ExifEntity } from '@app/infra/entities';
import { Paginated, PaginationOptions } from '../domain.util';

export type AssetStats = Record<AssetType, number>;

export interface AssetStatsOptions {
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface AssetSearchOptions {
  isVisible?: boolean;
  type?: AssetType;
  order?: 'ASC' | 'DESC';
}

export interface LivePhotoSearchOptions {
  ownerId: string;
  livePhotoCID: string;
  otherAssetId: string;
  type: AssetType;
}

export interface MapMarkerSearchOptions {
  isArchived?: boolean;
  isFavorite?: boolean;
  fileCreatedBefore?: Date;
  fileCreatedAfter?: Date;
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
  SIDECAR = 'sidecar',
}

export enum WithProperty {
  SIDECAR = 'sidecar',
  IS_OFFLINE = 'isOffline',
}

export enum TimeBucketSize {
  DAY = 'DAY',
  MONTH = 'MONTH',
}

export interface TimeBucketOptions {
  size: TimeBucketSize;
  isArchived?: boolean;
  isFavorite?: boolean;
  albumId?: string;
  personId?: string;
  userId?: string;
}

export interface TimeBucketItem {
  timeBucket: string;
  count: number;
}

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  create(asset: Partial<AssetEntity>): Promise<AssetEntity>;
  getByDate(ownerId: string, date: Date): Promise<AssetEntity[]>;
  getByIds(ids: string[]): Promise<AssetEntity[]>;
  getByChecksum(userId: string, checksum: Buffer): Promise<AssetEntity | null>;
  getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity>;
  getByUserId(pagination: PaginationOptions, userId: string): Paginated<AssetEntity>;
  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity>;
  getWith(pagination: PaginationOptions, property: WithProperty, libraryId?: string): Paginated<AssetEntity>;
  getRandom(userId: string, count: number): Promise<AssetEntity[]>;
  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  getByLibraryId(libraryIds: string[]): Promise<AssetEntity[]>;
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | null>;
  deleteAll(ownerId: string): Promise<void>;
  getAll(pagination: PaginationOptions, options?: AssetSearchOptions): Paginated<AssetEntity>;
  updateAll(ids: string[], options: Partial<AssetEntity>): Promise<void>;
  save(asset: Partial<AssetEntity>): Promise<AssetEntity>;
  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null>;
  getMapMarkers(ownerId: string, options?: MapMarkerSearchOptions): Promise<MapMarker[]>;
  getStatistics(ownerId: string, options: AssetStatsOptions): Promise<AssetStats>;
  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]>;
  getByTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]>;
  remove(asset: AssetEntity): Promise<AssetEntity>;
  getById(assetId: string): Promise<AssetEntity>;
  upsertExif(exif: Partial<ExifEntity>): Promise<void>;
}
