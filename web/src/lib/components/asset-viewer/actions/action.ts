import type { AssetAction } from '$lib/constants';
import type { TimelineAsset } from '$lib/stores/assets-store.svelte';
import type { AlbumResponseDto } from '@immich/sdk';

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
  [AssetAction.SET_VISIBILITY_LOCKED]: { asset: TimelineAsset };
  [AssetAction.SET_VISIBILITY_TIMELINE]: { asset: TimelineAsset };
};

export type Action = {
  [K in AssetAction]: { type: K } & ActionMap[K];
}[AssetAction];
export type OnAction = (action: Action) => void;
export type PreAction = (action: Action) => void;
