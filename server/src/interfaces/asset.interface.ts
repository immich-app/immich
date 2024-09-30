import { AssetJobStatusEntity } from 'src/entities/asset-job-status.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { ExifEntity } from 'src/entities/exif.entity';
import { AssetFileType, AssetOrder, AssetStatus, AssetType } from 'src/enum';
import { AssetSearchOptions, SearchExploreItem } from 'src/interfaces/search.interface';
import { Paginated, PaginationOptions } from 'src/utils/pagination';
import { FindOptionsOrder, FindOptionsRelations, FindOptionsSelect } from 'typeorm';

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
  OBJECT_TAGS = 'object-tags',
  FACES = 'faces',
  PERSON = 'person',
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

type AssetUpdateWithoutRelations = Pick<AssetWithoutRelations, 'id'> & Partial<AssetWithoutRelations>;
type AssetUpdateWithLivePhotoRelation = Pick<AssetWithoutRelations, 'id'> & Pick<AssetEntity, 'livePhotoVideo'>;

export type AssetUpdateOptions = AssetUpdateWithoutRelations | AssetUpdateWithLivePhotoRelation;

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

export type AssetPathEntity = Pick<AssetEntity, 'id' | 'originalPath' | 'isOffline'>;

export const IAssetRepository = 'IAssetRepository';

export interface IAssetRepository {
  create(asset: AssetCreate): Promise<AssetEntity>;
  getByIds(
    ids: string[],
    relations?: FindOptionsRelations<AssetEntity>,
    select?: FindOptionsSelect<AssetEntity>,
  ): Promise<AssetEntity[]>;
  getByIdsWithAllRelations(ids: string[]): Promise<AssetEntity[]>;
  getByDayOfYear(ownerIds: string[], monthDay: MonthDay): Promise<AssetEntity[]>;
  getByChecksum(options: { ownerId: string; checksum: Buffer; libraryId?: string }): Promise<AssetEntity | null>;
  getByChecksums(userId: string, checksums: Buffer[]): Promise<AssetEntity[]>;
  getUploadAssetIdByChecksum(ownerId: string, checksum: Buffer): Promise<string | undefined>;
  getByAlbumId(pagination: PaginationOptions, albumId: string): Paginated<AssetEntity>;
  getByDeviceIds(ownerId: string, deviceId: string, deviceAssetIds: string[]): Promise<string[]>;
  getByUserId(pagination: PaginationOptions, userId: string, options?: AssetSearchOptions): Paginated<AssetEntity>;
  getById(
    id: string,
    relations?: FindOptionsRelations<AssetEntity>,
    order?: FindOptionsOrder<AssetEntity>,
  ): Promise<AssetEntity | null>;
  getWithout(pagination: PaginationOptions, property: WithoutProperty): Paginated<AssetEntity>;
  getWith(
    pagination: PaginationOptions,
    property: WithProperty,
    libraryId?: string,
    withDeleted?: boolean,
  ): Paginated<AssetEntity>;
  getRandom(userIds: string[], count: number): Promise<AssetEntity[]>;
  getLastUpdatedAssetForAlbumId(albumId: string): Promise<AssetEntity | null>;
  getByLibraryIdAndOriginalPath(libraryId: string, originalPath: string): Promise<AssetEntity | null>;
  deleteAll(ownerId: string): Promise<void>;
  getAll(pagination: PaginationOptions, options?: AssetSearchOptions): Paginated<AssetEntity>;
  getAllByDeviceId(userId: string, deviceId: string): Promise<string[]>;
  getLivePhotoCount(motionId: string): Promise<number>;
  updateAll(ids: string[], options: Partial<AssetUpdateAllOptions>): Promise<void>;
  updateDuplicates(options: AssetUpdateDuplicateOptions): Promise<void>;
  update(asset: AssetUpdateOptions): Promise<void>;
  remove(asset: AssetEntity): Promise<void>;
  findLivePhotoMatch(options: LivePhotoSearchOptions): Promise<AssetEntity | null>;
  getStatistics(ownerId: string, options: AssetStatsOptions): Promise<AssetStats>;
  getTimeBuckets(options: TimeBucketOptions): Promise<TimeBucketItem[]>;
  getTimeBucket(timeBucket: string, options: TimeBucketOptions): Promise<AssetEntity[]>;
  upsertExif(exif: Partial<ExifEntity>): Promise<void>;
  upsertJobStatus(...jobStatus: Partial<AssetJobStatusEntity>[]): Promise<void>;
  getAssetIdByCity(userId: string, options: AssetExploreFieldOptions): Promise<SearchExploreItem<string>>;
  getAssetIdByTag(userId: string, options: AssetExploreFieldOptions): Promise<SearchExploreItem<string>>;
  getDuplicates(options: AssetBuilderOptions): Promise<AssetEntity[]>;
  getAllForUserFullSync(options: AssetFullSyncOptions): Promise<AssetEntity[]>;
  getChangedDeltaSync(options: AssetDeltaSyncOptions): Promise<AssetEntity[]>;
  upsertFile(file: UpsertFileOptions): Promise<void>;
  upsertFiles(files: UpsertFileOptions[]): Promise<void>;
}
