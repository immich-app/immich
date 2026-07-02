import type { AssetResponseDto, PersonResponseDto } from '@immich/sdk';
import type { AssetAction } from '$lib/constants';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';

type ActionMap = {
  [AssetAction.ARCHIVE]: { asset: TimelineAsset };
  [AssetAction.UNARCHIVE]: { asset: TimelineAsset };
  [AssetAction.TRASH]: { asset: TimelineAsset };
  [AssetAction.DELETE]: { asset: TimelineAsset };
  [AssetAction.RESTORE]: { asset: TimelineAsset };
  [AssetAction.SET_VISIBILITY_LOCKED]: { asset: TimelineAsset };
  [AssetAction.SET_VISIBILITY_TIMELINE]: { asset: TimelineAsset };
  [AssetAction.SET_PERSON_FEATURED_PHOTO]: { asset: AssetResponseDto; person: PersonResponseDto };
  [AssetAction.RATING]: { asset: TimelineAsset; rating: number | null };
};

export type Action = {
  [K in AssetAction]: { type: K } & ActionMap[K];
}[AssetAction];
export type OnAction = (action: Action) => void;
export type PreAction = (action: Action) => void;
