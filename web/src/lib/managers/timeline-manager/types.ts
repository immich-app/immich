import type { TimelineDate, TimelineDateTime, TimelineYearMonth } from '$lib/utils/timeline-util';
import type { AssetStackResponseDto, AssetVisibility } from '@immich/sdk';

export type ViewportTopMonth = TimelineYearMonth | undefined | 'lead-in' | 'lead-out';

export type AssetApiGetTimeBucketsRequest = Parameters<typeof import('@immich/sdk').getTimeBuckets>[0];

export type TimelineManagerOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'> & {
  timelineAlbumId?: string;
  deferInit?: boolean;
  /** Used to force timeline re-initialization when switching accounts (not sent to API) */
  _accountSwitchId?: string;
};

export type AssetDescriptor = { id: string };

export type Direction = 'earlier' | 'later';

export type TimelineAsset = {
  id: string;
  ownerId: string;
  ratio: number;
  thumbhash: string | null;
  localDateTime: TimelineDateTime;
  fileCreatedAt: TimelineDateTime;
  visibility: AssetVisibility;
  isFavorite: boolean;
  isTrashed: boolean;
  isVideo: boolean;
  isImage: boolean;
  stack: AssetStackResponseDto | null;
  duration: string | null;
  projectionType: string | null;
  livePhotoVideoId: string | null;
  city: string | null;
  country: string | null;
  people: string[] | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type MoveAsset = { asset: TimelineAsset; date: TimelineDate };

export interface Viewport {
  width: number;
  height: number;
}

export type ViewportXY = Viewport & {
  x: number;
  y: number;
};

export interface AddAsset {
  type: 'add';
  values: TimelineAsset[];
}

export interface UpdateAsset {
  type: 'update';
  values: TimelineAsset[];
}

export interface DeleteAsset {
  type: 'delete';
  values: string[];
}

export interface TrashAssets {
  type: 'trash';
  values: string[];
}

export interface UpdateStackAssets {
  type: 'update_stack_assets';
  values: string[];
}

export type PendingChange = AddAsset | UpdateAsset | DeleteAsset | TrashAssets | UpdateStackAssets;

export type ScrubberMonth = {
  height: number;
  assetCount: number;
  year: number;
  month: number;
  title: string;
};

export type TimelineManagerLayoutOptions = {
  rowHeight?: number;
  headerHeight?: number;
  gap?: number;
};

export interface UpdateGeometryOptions {
  invalidateHeight: boolean;
  noDefer?: boolean;
}

/** Strips internal-only properties before passing options to the API */
export function getApiOptions(options: TimelineManagerOptions): AssetApiGetTimeBucketsRequest {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _accountSwitchId, timelineAlbumId, deferInit, ...apiOptions } = options;
  return apiOptions;
}
