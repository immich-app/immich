import { AssetVisibility } from 'src/enum';

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
  isFavorite: boolean[];
  visibility: AssetVisibility[];
  isTrashed: boolean[];
  isImage: boolean[];
  thumbhash: (string | null)[];
  localDateTime: string[];
  stack?: ([string, string] | null)[];
  duration: (string | null)[];
  projectionType: (string | null)[];
  livePhotoVideoId: (string | null)[];
  city: (string | null)[];
  country: (string | null)[];
};
