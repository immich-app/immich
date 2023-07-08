import { AssetGridState, BucketPosition } from '$lib/models/asset-grid-state';
import { api, AssetResponseDto } from '@api';
import { derived, writable } from 'svelte/store';
import { assetGridState, assetStore } from './assets.store';

// Asset Viewer
export const viewingAssetStoreState = writable<AssetResponseDto>();
export const isViewingAssetStoreState = writable<boolean>(false);

// Multi-Selection mode
export const assetsInAlbumStoreState = writable<AssetResponseDto[]>([]);
export const selectedAssets = writable<Set<AssetResponseDto>>(new Set());
export const selectedGroup = writable<Set<string>>(new Set());
export const isMultiSelectStoreState = derived(selectedAssets, ($selectedAssets) => $selectedAssets.size > 0);
export const assetSelectionCandidates = writable<Set<AssetResponseDto>>(new Set());

function createAssetInteractionStore() {
  let _assetGridState = new AssetGridState();
  let _viewingAssetStoreState: AssetResponseDto;
  let _selectedAssets: Set<AssetResponseDto>;
  let _selectedGroup: Set<string>;
  let _assetsInAlbums: AssetResponseDto[];
  let _assetSelectionCandidates: Set<AssetResponseDto>;

  // Subscriber
  assetGridState.subscribe((state) => {
    _assetGridState = state;
  });

  viewingAssetStoreState.subscribe((asset) => {
    _viewingAssetStoreState = asset;
  });

  selectedAssets.subscribe((assets) => {
    _selectedAssets = assets;
  });

  selectedGroup.subscribe((group) => {
    _selectedGroup = group;
  });

  assetsInAlbumStoreState.subscribe((assets) => {
    _assetsInAlbums = assets;
  });

  assetSelectionCandidates.subscribe((assets) => {
    _assetSelectionCandidates = assets;
  });

  // Methods

  /**
   * Asset Viewer
   */
  const setViewingAsset = async (asset: AssetResponseDto) => {
    setViewingAssetId(asset.id);
  };

  const setViewingAssetId = async (id: string) => {
    const { data } = await api.assetApi.getAssetById({ id });
    viewingAssetStoreState.set(data);
    isViewingAssetStoreState.set(true);
  };

  const setIsViewingAsset = (isViewing: boolean) => {
    isViewingAssetStoreState.set(isViewing);
  };

  const getNextAsset = async (currentBucketIndex: number, assetId: string): Promise<AssetResponseDto | null> => {
    const currentBucket = _assetGridState.buckets[currentBucketIndex];
    const assetIndex = currentBucket.assets.findIndex(({ id }) => id == assetId);
    if (assetIndex === -1) {
      return null;
    }

    if (assetIndex + 1 < currentBucket.assets.length) {
      return currentBucket.assets[assetIndex + 1];
    }

    const nextBucketIndex = currentBucketIndex + 1;
    if (nextBucketIndex >= _assetGridState.buckets.length) {
      return null;
    }

    const nextBucket = _assetGridState.buckets[nextBucketIndex];
    await assetStore.getAssetsByBucket(nextBucket.bucketDate, BucketPosition.Unknown);

    return nextBucket.assets[0] ?? null;
  };

  const getPrevAsset = async (currentBucketIndex: number, assetId: string): Promise<AssetResponseDto | null> => {
    const currentBucket = _assetGridState.buckets[currentBucketIndex];
    const assetIndex = currentBucket.assets.findIndex(({ id }) => id == assetId);
    if (assetIndex === -1) {
      return null;
    }

    if (assetIndex > 0) {
      return currentBucket.assets[assetIndex - 1];
    }

    const prevBucketIndex = currentBucketIndex - 1;
    if (prevBucketIndex < 0) {
      return null;
    }

    const prevBucket = _assetGridState.buckets[prevBucketIndex];
    await assetStore.getAssetsByBucket(prevBucket.bucketDate, BucketPosition.Unknown);

    return prevBucket.assets[prevBucket.assets.length - 1] ?? null;
  };

  const navigateAsset = async (direction: 'next' | 'previous') => {
    const currentAssetId = _viewingAssetStoreState.id;
    const currentBucketIndex = _assetGridState.loadedAssets[currentAssetId];
    if (currentBucketIndex < 0 || currentBucketIndex >= _assetGridState.buckets.length) {
      return;
    }

    const asset =
      direction === 'next'
        ? await getNextAsset(currentBucketIndex, currentAssetId)
        : await getPrevAsset(currentBucketIndex, currentAssetId);

    if (asset) {
      setViewingAsset(asset);
    }
  };

  /**
   * Multiselect
   */
  const addAssetToMultiselectGroup = (asset: AssetResponseDto) => {
    // Not select if in album already
    if (_assetsInAlbums.find((a) => a.id === asset.id)) {
      return;
    }

    _selectedAssets.add(asset);
    selectedAssets.set(_selectedAssets);
  };

  const removeAssetFromMultiselectGroup = (asset: AssetResponseDto) => {
    _selectedAssets.delete(asset);
    selectedAssets.set(_selectedAssets);
  };

  const addGroupToMultiselectGroup = (group: string) => {
    _selectedGroup.add(group);
    selectedGroup.set(_selectedGroup);
  };

  const removeGroupFromMultiselectGroup = (group: string) => {
    _selectedGroup.delete(group);
    selectedGroup.set(_selectedGroup);
  };

  const setAssetSelectionCandidates = (assets: AssetResponseDto[]) => {
    _assetSelectionCandidates = new Set(assets);
    assetSelectionCandidates.set(_assetSelectionCandidates);
  };

  const clearAssetSelectionCandidates = () => {
    _assetSelectionCandidates.clear();
    assetSelectionCandidates.set(_assetSelectionCandidates);
  };

  const clearMultiselect = () => {
    _selectedAssets.clear();
    _selectedGroup.clear();
    _assetSelectionCandidates.clear();
    _assetsInAlbums = [];

    selectedAssets.set(_selectedAssets);
    selectedGroup.set(_selectedGroup);
    assetsInAlbumStoreState.set(_assetsInAlbums);
    assetSelectionCandidates.set(_assetSelectionCandidates);
  };

  return {
    setViewingAsset,
    setViewingAssetId,
    setIsViewingAsset,
    navigateAsset,
    addAssetToMultiselectGroup,
    removeAssetFromMultiselectGroup,
    addGroupToMultiselectGroup,
    removeGroupFromMultiselectGroup,
    setAssetSelectionCandidates,
    clearAssetSelectionCandidates,
    clearMultiselect,
  };
}

export const assetInteractionStore = createAssetInteractionStore();
