import type { AssetAction } from '$lib/constants';
import type { Asset } from '$lib/managers/timeline-manager/types';
import type { AlbumResponseDto, AssetResponseDto, PersonResponseDto, StackResponseDto } from '@immich/sdk';

type ActionMap = {
  [AssetAction.ARCHIVE]: { asset: Asset };
  [AssetAction.UNARCHIVE]: { asset: Asset };
  [AssetAction.FAVORITE]: { asset: Asset };
  [AssetAction.UNFAVORITE]: { asset: Asset };
  [AssetAction.TRASH]: { asset: Asset };
  [AssetAction.DELETE]: { asset: Asset };
  [AssetAction.RESTORE]: { asset: Asset };
  [AssetAction.ADD]: { asset: Asset };
  [AssetAction.ADD_TO_ALBUM]: { asset: Asset; album: AlbumResponseDto };
  [AssetAction.STACK]: { stack: StackResponseDto };
  [AssetAction.UNSTACK]: { assets: Asset[] };
  [AssetAction.KEEP_THIS_DELETE_OTHERS]: { asset: Asset };
  [AssetAction.SET_STACK_PRIMARY_ASSET]: { stack: StackResponseDto };
  [AssetAction.REMOVE_ASSET_FROM_STACK]: { stack: StackResponseDto | null; asset: AssetResponseDto };
  [AssetAction.SET_VISIBILITY_LOCKED]: { asset: Asset };
  [AssetAction.SET_VISIBILITY_TIMELINE]: { asset: Asset };
  [AssetAction.SET_PERSON_FEATURED_PHOTO]: { asset: AssetResponseDto; person: PersonResponseDto };
};

export type Action = {
  [K in AssetAction]: { type: K } & ActionMap[K];
}[AssetAction];
export type OnAction = (action: Action) => void;
export type PreAction = (action: Action) => void;
