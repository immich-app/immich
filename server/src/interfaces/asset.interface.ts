import { AssetOrder } from 'src/entities/album.entity';
import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity, AssetType } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { ReverseGeocodeResult } from 'src/interfaces/metadata.interface';
import { AssetSearchOptions, SearchExploreItem } from 'src/interfaces/search.interface';
import { Paginated, PaginationOptions } from 'src/utils/pagination';
import { FindOptionsRelations, FindOptionsSelect } from 'typeorm';

export type AssetStats = Record<AssetType, number>;

export interface AssetStatsOptions {
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
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

export interface MapMarker extends ReverseGeocodeResult {
  id: string;
  lat: number;
  lon: number;
}

export enum WithoutProperty {
  THUMBNAIL = 'thumbnail',
  ENCODED_VIDEO = 'encoded-video',
  EXIF = 'exif',
  SMART_SEARCH = 'smart-search',
  OBJECT_TAGS = 'object-tags',
  FACES = 'faces',
  PERSON = 'person',
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

export interface AssetBuilderOptions {
  isArchived?: boolean;
  isFavorite?: boolean;
  isTrashed?: boolean;
  albumId?: string;
  personId?: string;
  userIds?: string[];
  withStacked?: boolean;
  exifInfo?: boolean;
  assetType?: AssetType;
}

export interface TimeBucketOptions extends AssetBuilderOptions {
  size: TimeBucketSize;
  order?: AssetOrder;
}

export interface TimeBucketItem {
  timeBucket: string;
  count: number;
}

export type AssetCreate = Pick<
  AssetEntity,
  | 'deviceAssetId'
  | 'ownerId'
  | 'libraryId'
  | 'deviceId'
  | 'type'
  | 'originalPath'
  | 'fileCreatedAt'
  | 'localDateTime'
  | 'fileModifiedAt'
  | 'checksum'
  | 'originalFileName'
> &
  Partial<AssetEntity>;

export type AssetWithoutRelations = Omit<
  AssetEntity,
  | 'livePhotoVideo'
  | 'stack'
  | 'albums'
  | 'faces'
  | 'owner'
  | 'library'
  | 'exifInfo'
  | 'sharedLinks'
  | 'smartInfo'
  | 'smartSearch'
  | 'tags'
>;

export type AssetUpdateOptions = Pick<AssetWithoutRelations, 'id'> & Partial<AssetWithoutRelations>;

export type AssetUpdateAllOptions = Omit<Partial<AssetWithoutRelations>, 'id'>;

export interface MonthDay {
  day: number;
  month: number;
}

export interface AssetExploreFieldOptions {
  maxFields: number;
  minAssetsPerField: number;
}

export interface AssetExploreOptions extends AssetExploreFieldOptions {
  relation: keyof AssetEntity;
  relatedField: string;
  unnest?: boolean;
}

export interface AssetFullSyncOptions {
  ownerId: string;
  lastCreationDate?: Date;
  lastId?: string;
  updatedUntil: Date;
  isArchived?: false;
  withStacked?: true;
  limit: number;
}

export interface AssetDeltaSyncOptions {
  userIds: string[];
  updatedAfter: Date;
  limit: number;
}

export type AssetPathEntity = Pick<AssetEntity, 'id' | 'originalPath' | 'isOffline'>;

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  create(asset: AssetCreate): Promise<AssetEntity>;
  deleteAll(ownerId: string): Promise<void>;
  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null>;
  getAll(pagination: PaginationOptions, options?: AssetSearchOptions): Paginated<AssetEntity>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getAssetIdByCity(userId: string, options: AssetExploreFieldOptions): Promise<SearchExploreItem<string>>;
  getAssetIdByTag(userId: string, options: AssetExploreFieldOptions): Promise<SearchExploreItem<string>>;
  getAllForUserFullSync(options: AssetFullSyncOptions): Promise<AssetEntity[]>;
  getByIds(
    ids: string[],
    relations?: FindOptionsRelations<AssetEntity>,
    select?: FindOptionsSelect<AssetEntity>,
  ): Promise<AssetEntity[]>;
  getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity>;
  getByChecksum(libraryId: string, checksum: Buffer): Promise<AssetEntity | null>;
  getByDayOfYear(ownerIds: string[], monthDay: MonthDay): Promise<AssetEntity[]>;
  getByIdsWithAllRelations(ids: string[]): Promise<AssetEntity[]>;
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | null>;
  getByUserId(pagination: PaginationOptions, userId: string, options?: AssetSearchOptions): Paginated<AssetEntity>;
  getById(id: string, relations?: FindOptionsRelations<AssetEntity>): Promise<AssetEntity | null>;
  getChangedDeltaSync(options: AssetDeltaSyncOptions): Promise<AssetEntity[]>;
  getExternalLibraryAssetPaths(pagination: PaginationOptions, libraryId: string): Paginated<AssetPathEntity>;
  getFirstAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  getMapMarkers(ownerIds: string[], options?: MapMarkerSearchOptions): Promise<MapMarker[]>;
  getRandom(userId: string, count: number): Promise<AssetEntity[]>;
  getStatistics(ownerId: string, options: AssetStatsOptions): Promise<AssetStats>;
  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]>;
  getTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]>;
  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity>;
  getWith(pagination: PaginationOptions, property: WithProperty, libraryId?: string): Paginated<AssetEntity>;
  remove(asset: AssetEntity): Promise<void>;
  restoreAll(ids: string[]): Promise<void>;
  setReadOnlyForLibrary(libraryId: string, isReadOnly: boolean): Promise<void>;
  softDeleteAll(ids: string[]): Promise<void>;
  updateAll(ids: string[], options: Partial<AssetUpdateAllOptions>): Promise<void>;
  update(asset: AssetUpdateOptions): Promise<void>;
  upsertExif(exif: Partial<ExifEntity>): Promise<void>;
  upsertJobStatus(jobStatus: Partial<AssetJobStatusEntity>): Promise<void>;
}
