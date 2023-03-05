import { AlbumEntity, AssetEntity, AssetType } from '@app/infra/db/entities';

export enum SearchCollection {
  ASSETS = 'assets',
  ALBUMS = 'albums',
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

  index(collection: SearchCollection.ASSETS, item: AssetEntity): Promise<void>;
  index(collection: SearchCollection.ALBUMS, item: AlbumEntity): Promise<void>;

  delete(collection: SearchCollection, id: string): Promise<void>;

  import(collection: SearchCollection.ASSETS, items: AssetEntity[], done: boolean): Promise<void>;
  import(collection: SearchCollection.ALBUMS, items: AlbumEntity[], done: boolean): Promise<void>;

  search(collection: SearchCollection.ASSETS, query: string, filters: SearchFilter): Promise<SearchResult<AssetEntity>>;
  search(collection: SearchCollection.ALBUMS, query: string, filters: SearchFilter): Promise<SearchResult<AlbumEntity>>;

  explore(userId: string): Promise<SearchExploreItem<AssetEntity>[]>;
}
