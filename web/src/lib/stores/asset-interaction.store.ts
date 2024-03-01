import type { AssetResponseDto } from '@immich/sdk';
import { derived, writable } from 'svelte/store';

export interface AssetInteractionStore {
  selectAsset: (asset: AssetResponseDto) => void;
  removeAssetFromMultiselectGroup: (asset: AssetResponseDto) => void;
  addGroupToMultiselectGroup: (group: string) => void;
  removeGroupFromMultiselectGroup: (group: string) => void;
  setAssetSelectionCandidates: (assets: AssetResponseDto[]) => void;
  clearAssetSelectionCandidates: () => void;
  setAssetSelectionStart: (asset: AssetResponseDto | null) => void;
  clearMultiselect: () => void;
  isMultiSelectState: {
    subscribe: (run: (value: boolean) => void, invalidate?: (value?: boolean) => void) => () => void;
  };
  selectedAssets: {
    subscribe: (
      run: (value: Set<AssetResponseDto>) => void,
      invalidate?: (value?: Set<AssetResponseDto>) => void,
    ) => () => void;
  };
  selectedGroup: {
    subscribe: (run: (value: Set<string>) => void, invalidate?: (value?: Set<string>) => void) => () => void;
  };
  assetSelectionCandidates: {
    subscribe: (
      run: (value: Set<AssetResponseDto>) => void,
      invalidate?: (value?: Set<AssetResponseDto>) => void,
    ) => () => void;
  };
  assetSelectionStart: {
    subscribe: (
      run: (value: AssetResponseDto | null) => void,
      invalidate?: (value?: AssetResponseDto | null) => void,
    ) => () => void;
  };
}

export function createAssetInteractionStore(): AssetInteractionStore {
  let _selectedAssets: Set<AssetResponseDto>;
  let _selectedGroup: Set<string>;
  let _assetSelectionCandidates: Set<AssetResponseDto>;
  let _assetSelectionStart: AssetResponseDto | null;

  // Selected assets
  const selectedAssets = writable<Set<AssetResponseDto>>(new Set());
  // Selected date groups
  const selectedGroup = writable<Set<string>>(new Set());
  // If any asset selected
  const isMultiSelectStoreState = derived(selectedAssets, ($selectedAssets) => $selectedAssets.size > 0);

  // Candidates for the range selection. This set includes only loaded assets, so it improves highlight
  // performance. From the user's perspective, range is highlighted almost immediately
  const assetSelectionCandidates = writable<Set<AssetResponseDto>>(new Set());
  // The beginning of the selection range
  const assetSelectionStart = writable<AssetResponseDto | null>(null);

  selectedAssets.subscribe((assets) => {
    _selectedAssets = assets;
  });

  selectedGroup.subscribe((group) => {
    _selectedGroup = group;
  });

  assetSelectionCandidates.subscribe((assets) => {
    _assetSelectionCandidates = assets;
  });

  assetSelectionStart.subscribe((asset) => {
    _assetSelectionStart = asset;
  });

  const selectAsset = (asset: AssetResponseDto) => {
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

  const setAssetSelectionStart = (asset: AssetResponseDto | null) => {
    _assetSelectionStart = asset;
    assetSelectionStart.set(_assetSelectionStart);
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
    // Multi-selection
    _selectedAssets.clear();
    _selectedGroup.clear();

    // Range selection
    _assetSelectionCandidates.clear();
    _assetSelectionStart = null;

    selectedAssets.set(_selectedAssets);
    selectedGroup.set(_selectedGroup);
    assetSelectionCandidates.set(_assetSelectionCandidates);
    assetSelectionStart.set(_assetSelectionStart);
  };

  return {
    selectAsset,
    removeAssetFromMultiselectGroup,
    addGroupToMultiselectGroup,
    removeGroupFromMultiselectGroup,
    setAssetSelectionCandidates,
    clearAssetSelectionCandidates,
    setAssetSelectionStart,
    clearMultiselect,
    isMultiSelectState: {
      subscribe: isMultiSelectStoreState.subscribe,
    },
    selectedAssets: {
      subscribe: selectedAssets.subscribe,
    },
    selectedGroup: {
      subscribe: selectedGroup.subscribe,
    },
    assetSelectionCandidates: {
      subscribe: assetSelectionCandidates.subscribe,
    },
    assetSelectionStart: {
      subscribe: assetSelectionStart.subscribe,
    },
  };
}
