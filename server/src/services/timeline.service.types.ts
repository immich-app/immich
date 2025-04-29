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
  thumbhash: (string | number)[];
  localDateTime: Date[];
  stack: (TimelineStack | number)[];
  duration: (string | number)[];
  projectionType: (string | number)[];
  livePhotoVideoId: (string | number)[];
  description: AssetDescription[];
};
