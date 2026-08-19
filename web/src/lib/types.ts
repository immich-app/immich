import type { QueueResponseDto } from '@immich/sdk';
import type { ActionItem } from '@immich/ui';
import type { DateTime } from 'luxon';
import type { SvelteSet } from 'svelte/reactivity';
import { MediaType } from '$lib/constants';

export type LatLng = { lng: number; lat: number };

export type QueueSnapshot = { timestamp: number; snapshot?: QueueResponseDto[] };

export type HeaderButtonActionItem = ActionItem & { data?: { title?: string } };

export enum UploadState {
  PENDING,
  STARTED,
  DONE,
  ERROR,
  DUPLICATED,
}

export type UploadAsset = {
  id: string;
  file: File;
  assetId?: string;
  isTrashed?: boolean;
  albumId?: string;
  progress?: number;
  state?: UploadState;
  startDate?: number;
  eta?: number;
  speed?: number;
  error?: unknown;
  message?: string;
};

export enum OnboardingRole {
  SERVER = 'server',
  USER = 'user',
}

export type SearchCameraFilter = {
  make?: string;
  model?: string;
  lensModel?: string;
};

export type SearchDateFilter = {
  takenBefore?: DateTime;
  takenAfter?: DateTime;
};

export type SearchDisplayFilters = {
  isNotInAlbum: boolean;
  isArchive: boolean;
  isFavorite: boolean;
};

export type SearchLocationFilter = {
  country?: string;
  state?: string;
  city?: string;
};

export type SearchFilter = {
  query: string;
  ocr?: string;
  queryType: 'smart' | 'metadata' | 'description' | 'fullPath' | 'ocr';
  personIds: SvelteSet<string>;
  tagIds: SvelteSet<string> | null;
  location: SearchLocationFilter;
  queryAssetId?: string;
  camera: SearchCameraFilter;
  date: SearchDateFilter;
  display: SearchDisplayFilters;
  mediaType: MediaType;
  rating?: number | null;
};

export type JSONSchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object';

export type JSONSchemaProperty = {
  type: JSONSchemaType;
  title?: string;
  description?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  precision?: number;
  array?: boolean;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  uiHint?: {
    type?: 'AlbumId' | 'AssetId' | 'PersonId' | 'TagId';
    order?: number;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SchemaConfig = any;
