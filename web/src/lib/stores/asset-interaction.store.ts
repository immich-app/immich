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

  const navigateAsset = async (direction: 'next' | 'previous') => {
    const currentBucketIndex = _assetGridState.loadedAssets[_viewingAssetStoreState.id];
    if (currentBucketIndex < 0 || currentBucketIndex >= _assetGridState.buckets.length) {
      return;
    }

    const currentBucket = _assetGridState.buckets[currentBucketIndex];

    const index = currentBucket.assets.findIndex(({ id }) => id == _viewingAssetStoreState.id);
    if (index === -1) {
      return;
    }

    if (direction === 'next') {
      if (index + 1 < currentBucket.assets.length) {
        const asset = currentBucket.assets[index + 1];
        if (asset) {
          setViewingAsset(asset);
        }
      } else {
        const nextBucketIndex = currentBucketIndex + 1;
        if (nextBucketIndex < _assetGridState.buckets.length) {
          const nextBucket = _assetGridState.buckets[nextBucketIndex];
          if (nextBucket.assets.length === 0) {
            await assetStore.getAssetsByBucket(nextBucket.bucketDate, BucketPosition.Below);
            navigateAsset(direction);
          } else {
            const asset = nextBucket.assets[0];
            if (asset) {
              setViewingAsset(asset);
            }
          }
        }
      }
    } else {
      if (index > 0) {
        const asset = currentBucket.assets[index - 1];
        if (asset) {
          setViewingAsset(asset);
        }
      } else {
        const prevBucketIndex = currentBucketIndex - 1;
        if (prevBucketIndex >= 0) {
          const prevBucket = _assetGridState.buckets[prevBucketIndex];
          if (prevBucket.assets.length === 0) {
            await assetStore.getAssetsByBucket(prevBucket.bucketDate, BucketPosition.Above);
            navigateAsset(direction);
          } else {
            const asset = prevBucket.assets[prevBucket.assets.length - 1];
            if (asset) {
              setViewingAsset(asset);
            }
          }
        }
      }
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
