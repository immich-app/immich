export type TimelineStack = {
  id: string;
  primaryAssetId: string;
  assetCount: number;
};

export type AssetDescription = {
  city: string | null;
  country: string | null;
};

export type TimeBucketAssets = {
  id: string[];
  ownerId: string[];
  ratio: number[];
  isFavorite: number[];
  isArchived: number[];
  isTrashed: number[];
  isVideo: number[];
  isImage: number[];
  thumbhash: (string | null)[];
  localDateTime: string[];
  stack: (TimelineStack | null)[];
  duration: (string | null)[];
  projectionType: (string | null)[];
  livePhotoVideoId: (string | null)[];
  description: AssetDescription[];
};
