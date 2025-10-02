import type { AssetAction } from '$lib/constants';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import type { AlbumResponseDto, AssetResponseDto, PersonResponseDto, StackResponseDto } from '@immich/sdk';

type ActionMap = {
  [AssetAction.ARCHIVE]: { asset: TimelineAsset };
  [AssetAction.UNARCHIVE]: { asset: TimelineAsset };
  [AssetAction.FAVORITE]: { asset: TimelineAsset };
  [AssetAction.UNFAVORITE]: { asset: TimelineAsset };
  [AssetAction.TRASH]: { asset: TimelineAsset };
  [AssetAction.DELETE]: { asset: TimelineAsset };
  [AssetAction.RESTORE]: { asset: TimelineAsset };
  [AssetAction.ADD]: { asset: TimelineAsset };
  [AssetAction.ADD_TO_ALBUM]: { asset: TimelineAsset; album: AlbumResponseDto };
  [AssetAction.UNSTACK]: { assets: TimelineAsset[] };
  [AssetAction.KEEP_THIS_DELETE_OTHERS]: { asset: TimelineAsset };
  [AssetAction.SET_STACK_PRIMARY_ASSET]: { stack: StackResponseDto };
  [AssetAction.REMOVE_ASSET_FROM_STACK]: { stack: StackResponseDto | null; asset: AssetResponseDto };
  [AssetAction.SET_VISIBILITY_LOCKED]: { asset: TimelineAsset };
  [AssetAction.SET_VISIBILITY_TIMELINE]: { asset: TimelineAsset };
  [AssetAction.SET_PERSON_FEATURED_PHOTO]: { asset: AssetResponseDto; person: PersonResponseDto };
};

export type Action = {
  [K in AssetAction]: { type: K } & ActionMap[K];
}[AssetAction];
export type OnAction = (action: Action) => void;
export type PreAction = (action: Action) => void;
