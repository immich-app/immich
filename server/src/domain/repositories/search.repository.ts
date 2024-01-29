import { AssetType } from '@app/infra/entities';

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
