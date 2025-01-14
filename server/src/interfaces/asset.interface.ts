import { Insertable, Updateable } from 'kysely';
import { AssetFiles, AssetJobStatus, Assets, Exif } from 'src/db';
import { AssetEntity } from 'src/entities/asset.entity';
import { AssetFileType, AssetOrder, AssetStatus, AssetType } from 'src/enum';
import { AssetSearchOptions, SearchExploreItem } from 'src/interfaces/search.interface';
import { Paginated, PaginationOptions } from 'src/utils/pagination';

export type AssetStats = Record<AssetType, number>;

export interface AssetStatsOptions {
  isFavorite?: boolean;
  isArchived?: boolean;
  isTrashed?: boolean;
}

export interface LivePhotoSearchOptions {
  ownerId: string;
  libraryId?: string | null;
  livePhotoCID: string;
  otherAssetId: string;
  type: AssetType;
}

export enum WithoutProperty {
  THUMBNAIL = 'thumbnail',
  ENCODED_VIDEO = 'encoded-video',
  EXIF = 'exif',
  SMART_SEARCH = 'smart-search',
  DUPLICATE = 'duplicate',
  FACES = 'faces',
  SIDECAR = 'sidecar',
}

export enum WithProperty {
  SIDECAR = 'sidecar',
}

export enum TimeBucketSize {
  DAY = 'DAY',
  MONTH = 'MONTH',
}

export interface AssetBuilderOptions {
  isArchived?: boolean;
  isFavorite?: boolean;
  isTrashed?: boolean;
  isDuplicate?: boolean;
  albumId?: string;
  tagId?: string;
  personId?: string;
  userIds?: string[];
  withStacked?: boolean;
  exifInfo?: boolean;
  status?: AssetStatus;
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

export interface MonthDay {
  day: number;
  month: number;
}

export interface AssetExploreFieldOptions {
  maxFields: number;
  minAssetsPerField: number;
}

export interface AssetFullSyncOptions {
  ownerId: string;
  lastId?: string;
  updatedUntil: Date;
  limit: number;
}

export interface AssetDeltaSyncOptions {
  userIds: string[];
  updatedAfter: Date;
  limit: number;
}

export interface AssetUpdateDuplicateOptions {
  targetDuplicateId: string | null;
  assetIds: string[];
  duplicateIds: string[];
}

export interface UpsertFileOptions {
  assetId: string;
  type: AssetFileType;
  path: string;
}

export interface AssetGetByChecksumOptions {
  ownerId: string;
  checksum: Buffer;
  libraryId?: string;
}

export type AssetPathEntity = Pick<AssetEntity, 'id' | 'originalPath' | 'isOffline'>;

export interface GetByIdsRelations {
  exifInfo?: boolean;
  faces?: { person?: boolean };
  files?: boolean;
  library?: boolean;
  owner?: boolean;
  smartSearch?: boolean;
  stack?: { assets?: boolean };
  tags?: boolean;
}

export interface DuplicateGroup {
  duplicateId: string;
  assets: AssetEntity[];
}

export interface DayOfYearAssets {
  yearsAgo: number;
  assets: AssetEntity[];
}

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  create(asset: Insertable<Assets>): Promise<AssetEntity>;
  getByIds(ids: string[], relations?: GetByIdsRelations): Promise<AssetEntity[]>;
  getByIdsWithAllRelations(ids: string[]): Promise<AssetEntity[]>;
  getByDayOfYear(ownerIds: string[], monthDay: MonthDay): Promise<DayOfYearAssets[]>;
  getByChecksum(options: AssetGetByChecksumOptions): Promise<AssetEntity | undefined>;
  getByChecksums(userId: string, checksums: Buffer[]): Promise<AssetEntity[]>;
  getUploadAssetIdByChecksum(ownerId: string, checksum: Buffer): Promise<string | undefined>;
  getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity>;
  getByDeviceIds(ownerId: string, deviceId: string, deviceAssetIds: string[]): Promise<string[]>;
  getByUserId(pagination: PaginationOptions, userId: string, options?: AssetSearchOptions): Paginated<AssetEntity>;
  getById(id: string, relations?: GetByIdsRelations): Promise<AssetEntity | undefined>;
  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity>;
  getRandom(userIds: string[], count: number): Promise<AssetEntity[]>;
  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | undefined>;
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | undefined>;
  deleteAll(ownerId: string): Promise<void>;
  getAll(pagination: PaginationOptions, options?: AssetSearchOptions): Paginated<AssetEntity>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getLivePhotoCount(motionId: string): Promise<number>;
  updateAll(ids: string[], options: Updateable<Assets>): Promise<void>;
  updateDuplicates(options: AssetUpdateDuplicateOptions): Promise<void>;
  update(asset: Updateable<Assets> & { id: string }): Promise<AssetEntity>;
  remove(asset: AssetEntity): Promise<void>;
  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | undefined>;
  getStatistics(ownerId: string, options: AssetStatsOptions): Promise<AssetStats>;
  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]>;
  getTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]>;
  upsertExif(exif: Insertable<Exif>): Promise<void>;
  upsertJobStatus(...jobStatus: Insertable<AssetJobStatus>[]): Promise<void>;
  getAssetIdByCity(userId: string, options: AssetExploreFieldOptions): Promise<SearchExploreItem<string>>;
  getDuplicates(userId: string): Promise<DuplicateGroup[]>;
  getAllForUserFullSync(options: AssetFullSyncOptions): Promise<AssetEntity[]>;
  getChangedDeltaSync(options: AssetDeltaSyncOptions): Promise<AssetEntity[]>;
  upsertFile(options: Insertable<AssetFiles>): Promise<void>;
  upsertFiles(options: Insertable<AssetFiles>[]): Promise<void>;
}
