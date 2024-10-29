import { getKey } from '$lib/utils';
import { type AssetGridRouteSearchParams } from '$lib/utils/navigation';
import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
import { readonly, writable } from 'svelte/store';

function createAssetViewingStore() {
  const viewingAssetStoreState = writable<AssetResponseDto>();
  const preloadAssets = writable<AssetResponseDto[]>([]);
  const viewState = writable<boolean>(false);
  const gridScrollTarget = writable<AssetGridRouteSearchParams | null | undefined>();

  const setAsset = (asset: AssetResponseDto, assetsToPreload: AssetResponseDto[] = []) => {
    preloadAssets.set(assetsToPreload);
    viewingAssetStoreState.set(asset);
    viewState.set(true);
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
    setAssetId,
    showAssetViewer,
  };
}

export const assetViewingStore = createAssetViewingStore();
