import { AssetEntity, AssetFaceEntity, AssetType, GeodataPlacesEntity, SmartInfoEntity } from '@app/infra/entities';
import { Paginated } from '../domain.util';

export const ISearchRepository = 'ISearchRepository';

export enum SearchStrategy {
  SMART = 'SMART',
  TEXT = 'TEXT',
}

export interface SearchFilter {
  id?: string;
  userId: string;
  type?: AssetType;
  isFavorite?: boolean;
  isArchived?: boolean;
  city?: string;
  state?: string;
  country?: string;
  make?: string;
  model?: string;
  objects?: string[];
  tags?: string[];
  recent?: boolean;
  motion?: boolean;
  debug?: boolean;
}

export interface SearchResult<T> {
  /** total matches */
  total: number;
  /** collection size */
  count: number;
  /** current page */
  page: number;
  /** items for page */
  items: T[];
  /** score */
  distances: number[];
  facets: SearchFacet[];
}

export interface SearchFacet {
  fieldName: string;
  counts: Array<{
    count: number;
    value: string;
  }>;
}

export type SearchExploreItemSet<T> = Array<{
  value: string;
  data: T;
}>;

export interface SearchExploreItem<T> {
  fieldName: string;
  items: SearchExploreItemSet<T>;
}

export type Embedding = number[];

export interface SearchAssetIDOptions {
  checksum?: Buffer;
  deviceAssetId?: string;
  id?: string;
}

export interface SearchUserIdOptions {
  deviceId?: string;
  libraryId?: string;
  userIds?: string[];
}

export type SearchIdOptions = SearchAssetIDOptions & SearchUserIdOptions;

export interface SearchStatusOptions {
  isArchived?: boolean;
  isEncoded?: boolean;
  isExternal?: boolean;
  isFavorite?: boolean;
  isMotion?: boolean;
  isOffline?: boolean;
  isReadOnly?: boolean;
  isVisible?: boolean;
  isNotInAlbum?: boolean;
  type?: AssetType;
  withArchived?: boolean;
  withDeleted?: boolean;
}

export interface SearchOneToOneRelationOptions {
  withExif?: boolean;
  withSmartInfo?: boolean;
  withStacked?: boolean;
}

export interface SearchRelationOptions extends SearchOneToOneRelationOptions {
  withFaces?: boolean;
  withPeople?: boolean;
}

export interface SearchDateOptions {
  createdBefore?: Date;
  createdAfter?: Date;
  takenBefore?: Date;
  takenAfter?: Date;
  trashedBefore?: Date;
  trashedAfter?: Date;
  updatedBefore?: Date;
  updatedAfter?: Date;
}

export interface SearchPathOptions {
  encodedVideoPath?: string;
  originalFileName?: string;
  originalPath?: string;
  resizePath?: string;
  webpPath?: string;
}

export interface SearchExifOptions {
  city?: string;
  country?: string;
  lensModel?: string;
  make?: string;
  model?: string;
  state?: string;
}

export interface SearchEmbeddingOptions {
  embedding: Embedding;
  userIds: string[];
}

export interface SearchPeopleOptions {
  personIds?: string[];
}

export interface SearchOrderOptions {
  orderDirection?: 'ASC' | 'DESC';
}

export interface SearchPaginationOptions {
  page: number;
  size: number;
}

type BaseAssetSearchOptions = SearchDateOptions &
  SearchIdOptions &
  SearchExifOptions &
  SearchOrderOptions &
  SearchPathOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions;

export type AssetSearchOptions = BaseAssetSearchOptions & SearchRelationOptions;

export type AssetSearchOneToOneRelationOptions = BaseAssetSearchOptions & SearchOneToOneRelationOptions;

export type AssetSearchBuilderOptions = Omit<AssetSearchOptions, 'orderDirection'>;

export type SmartSearchOptions = SearchDateOptions &
  SearchEmbeddingOptions &
  SearchExifOptions &
  SearchOneToOneRelationOptions &
  SearchStatusOptions &
  SearchUserIdOptions &
  SearchPeopleOptions;

export interface FaceEmbeddingSearch extends SearchEmbeddingOptions {
  hasPerson?: boolean;
  numResults: number;
  maxDistance?: number;
}

export interface FaceSearchResult {
  distance: number;
  face: AssetFaceEntity;
}

export interface ISearchRepository {
  init(modelName: string): Promise<void>;
  searchMetadata(pagination: SearchPaginationOptions, options: AssetSearchOptions): Paginated<AssetEntity>;
  searchSmart(pagination: SearchPaginationOptions, options: SmartSearchOptions): Paginated<AssetEntity>;
  searchFaces(search: FaceEmbeddingSearch): Promise<FaceSearchResult[]>;
  upsert(smartInfo: Partial<SmartInfoEntity>, embedding?: Embedding): Promise<void>;
  searchPlaces(placeName: string): Promise<GeodataPlacesEntity[]>;
  deleteAllSearchEmbeddings(): Promise<void>;
}
