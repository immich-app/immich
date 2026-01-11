import { authManager } from '$lib/managers/auth-manager.svelte';
import { type AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import { readonly, writable } from 'svelte/store';

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();

  const viewState = writable<boolean>(false);
  const gridScrollTarget = writable<AssetGridRouteSearchParams | null | undefined>();

  const setAsset = (asset: AssetResponseDto) => {
    viewingAssetStoreState.set(asset);
    viewState.set(true);
  };

  const setAssetId = async (id: string): Promise<AssetResponseDto> => {
    const asset = await getAssetInfo({ ...authManager.params, id });
    setAsset(asset);
    return asset;
  };

  const showAssetViewer = (show: boolean) => {
    viewState.set(show);
  };

  return {
    asset: readonly(viewingAssetStoreState),
    isViewing: viewState,
    gridScrollTarget,
    setAsset,
    setAssetId,
    showAssetViewer,
  };
}

export const assetViewingStore = createAssetViewingStore();
