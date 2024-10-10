import { getKey } from '$lib/utils';
import { type AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';

import { readonly, writable } from 'svelte/store';

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();
  const preloadAssets = writable<AssetResponseDto[]>([]);
  const viewState = writable<boolean>(false);
  const gridScrollTarget = writable<AssetGridRouteSearchParams | null | undefined>();

  const setAsset = (asset: AssetResponseDto) => {
    viewingAssetStoreState.set(asset);
    viewState.set(true);
  };

  const setPreloadAssets = (assets: AssetResponseDto[]) => {
    preloadAssets.set(assets);
  };

  const setAssetId = async (id: string) => {
    const asset = await getAssetInfo({ id, key: getKey() });
    setAsset(asset);
  };

  const showAssetViewer = (show: boolean) => {
    viewState.set(show);
  };

  return {
    asset: readonly(viewingAssetStoreState),
    preloadAssets: readonly(preloadAssets),
    isViewing: viewState,
    gridScrollTarget,
    setAsset,
    setPreloadAssets,
    setAssetId,
    showAssetViewer,
  };
}

export const assetViewingStore = createAssetViewingStore();
