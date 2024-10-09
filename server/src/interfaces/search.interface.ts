import { AssetFaceEntity } from 'src/entities/asset-face.entity';
import { AssetEntity } from 'src/entities/asset.entity';
import { GeodataPlacesEntity } from 'src/entities/geodata-places.entity';
import { AssetStatus, AssetType } from 'src/enum';
import { Paginated } from 'src/utils/pagination';

export const ISearchRepository = 'ISearchRepository';

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

export interface SearchAssetIDOptions {
  checksum?: Buffer;
  deviceAssetId?: string;
  id?: string;
}

export interface SearchUserIdOptions {
  deviceId?: string;
  libraryId?: string | null;
  userIds?: string[];
}

export type SearchIdOptions = SearchAssetIDOptions & SearchUserIdOptions;

export interface SearchStatusOptions {
  isArchived?: boolean;
  isEncoded?: boolean;
  isFavorite?: boolean;
  isMotion?: boolean;
  isOffline?: boolean;
  isVisible?: boolean;
  isNotInAlbum?: boolean;
  type?: AssetType;
  status?: AssetStatus;
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
  previewPath?: string;
  thumbnailPath?: string;
}

export interface SearchExifOptions {
  city?: string | null;
  country?: string | null;
  lensModel?: string | null;
  make?: string | null;
  model?: string | null;
  state?: string | null;
}

export interface SearchEmbeddingOptions {
  embedding: number[];
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

export interface AssetDuplicateSearch {
  assetId: string;
  embedding: number[];
  maxDistance?: number;
  type: AssetType;
  userIds: string[];
}

export interface FaceSearchResult {
  distance: number;
  face: AssetFaceEntity;
}

export interface AssetDuplicateResult {
  assetId: string;
  duplicateId: string | null;
  distance: number;
}

export interface ISearchRepository {
  searchMetadata(pagination: SearchPaginationOptions, options: AssetSearchOptions): Paginated<AssetEntity>;
  searchSmart(pagination: SearchPaginationOptions, options: SmartSearchOptions): Paginated<AssetEntity>;
  searchDuplicates(options: AssetDuplicateSearch): Promise<AssetDuplicateResult[]>;
  searchFaces(search: FaceEmbeddingSearch): Promise<FaceSearchResult[]>;
  searchRandom(size: number, options: AssetSearchOptions): Promise<AssetEntity[]>;
  upsert(assetId: string, embedding: number[]): Promise<void>;
  searchPlaces(placeName: string): Promise<GeodataPlacesEntity[]>;
  getAssetsByCity(userIds: string[]): Promise<AssetEntity[]>;
  deleteAllSearchEmbeddings(): Promise<void>;
  getDimensionSize(): Promise<number>;
  setDimensionSize(dimSize: number): Promise<void>;
  getCountries(userIds: string[]): Promise<Array<string | null>>;
  getStates(userIds: string[], country?: string): Promise<Array<string | null>>;
  getCities(userIds: string[], country?: string, state?: string): Promise<Array<string | null>>;
  getCameraMakes(userIds: string[], model?: string): Promise<Array<string | null>>;
  getCameraModels(userIds: string[], make?: string): Promise<Array<string | null>>;
}
