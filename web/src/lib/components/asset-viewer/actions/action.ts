import type { AssetAction } from '$lib/constants';
import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';

type ActionMap = {
  [AssetAction.ARCHIVE]: { asset: AssetResponseDto };
  [AssetAction.UNARCHIVE]: { asset: AssetResponseDto };
  [AssetAction.FAVORITE]: { asset: AssetResponseDto };
  [AssetAction.UNFAVORITE]: { asset: AssetResponseDto };
  [AssetAction.TRASH]: { asset: AssetResponseDto };
  [AssetAction.DELETE]: { asset: AssetResponseDto };
  [AssetAction.RESTORE]: { asset: AssetResponseDto };
  [AssetAction.ADD]: { asset: AssetResponseDto };
  [AssetAction.ADD_TO_ALBUM]: { asset: AssetResponseDto; album: AlbumResponseDto };
  [AssetAction.UNSTACK]: { assets: AssetResponseDto[] };
  [AssetAction.KEEP_THIS_DELETE_OTHERS]: { asset: AssetResponseDto };
};

export type Action = {
  [K in AssetAction]: { type: K } & ActionMap[K];
}[AssetAction];
export type OnAction = (action: Action) => void;
