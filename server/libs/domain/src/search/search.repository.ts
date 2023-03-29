import { AlbumEntity, AssetEntity, AssetType } from '@app/infra/entities';

export enum SearchCollection {
  ASSETS = 'assets',
  ALBUMS = 'albums',
}

export enum SearchStrategy {
  CLIP = 'CLIP',
  TEXT = 'TEXT',
}

export interface SearchFilter {
  id?: string;
  userId: string;
  type?: AssetType;
  isFavorite?: boolean;
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
  facets: SearchFacet[];
}

export interface SearchFacet {
  fieldName: string;
  counts: Array<{
    count: number;
    value: string;
  }>;
}

export interface SearchExploreItem<T> {
  fieldName: string;
  items: Array<{
    value: string;
    data: T;
  }>;
}

export type SearchCollectionIndexStatus = Record<SearchCollection, boolean>;

export const ISearchRepository = 'ISearchRepository';

export interface ISearchRepository {
  setup(): Promise<void>;
  checkMigrationStatus(): Promise<SearchCollectionIndexStatus>;

  importAlbums(items: AlbumEntity[], done: boolean): Promise<void>;
  importAssets(items: AssetEntity[], done: boolean): Promise<void>;

  deleteAlbums(ids: string[]): Promise<void>;
  deleteAssets(ids: string[]): Promise<void>;

  searchAlbums(query: string, filters: SearchFilter): Promise<SearchResult<AlbumEntity>>;
  searchAssets(query: string, filters: SearchFilter): Promise<SearchResult<AssetEntity>>;
  vectorSearch(query: number[], filters: SearchFilter): Promise<SearchResult<AssetEntity>>;

  explore(userId: string): Promise<SearchExploreItem<AssetEntity>[]>;
}
