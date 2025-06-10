import type { TimelinePlainDate, TimelinePlainDateTime } from '$lib/utils/timeline-util';
import type { AssetStackResponseDto, AssetVisibility } from '@immich/sdk';

export type AssetApiGetTimeBucketsRequest = Parameters<typeof import('@immich/sdk').getTimeBuckets>[0];

export type AssetStoreOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'> & {
  timelineAlbumId?: string;
  deferInit?: boolean;
};

export type AssetDescriptor = { id: string };

export type Direction = 'earlier' | 'later';

export type TimelineAsset = {
  id: string;
  ownerId: string;
  ratio: number;
  thumbhash: string | null;
  localDateTime: TimelinePlainDateTime;
  fileCreatedAt: TimelinePlainDateTime;
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
};

export type AssetOperation = (asset: TimelineAsset) => { remove: boolean };

export type MoveAsset = { asset: TimelineAsset; date: TimelinePlainDate };

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

export type LiteBucket = {
  bucketHeight: number;
  assetCount: number;
  year: number;
  month: number;
  bucketDateFormattted: string;
};

export type AssetStoreLayoutOptions = {
  rowHeight?: number;
  headerHeight?: number;
  gap?: number;
};

export interface UpdateGeometryOptions {
  invalidateHeight: boolean;
  noDefer?: boolean;
}
