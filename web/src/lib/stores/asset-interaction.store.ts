import type { AssetResponseDto } from '@immich/sdk';
import { derived, readonly, writable } from 'svelte/store';

export type AssetInteractionStore = ReturnType<typeof createAssetInteractionStore>;

export function createAssetInteractionStore() {
  const selectedAssets = writable(new Set<AssetResponseDto>());
  const selectedGroup = writable(new Set<string>());
  const isMultiSelectStoreState = derived(selectedAssets, ($selectedAssets) => $selectedAssets.size > 0);

  // Candidates for the range selection. This set includes only loaded assets, so it improves highlight
  // performance. From the user's perspective, range is highlighted almost immediately
  const assetSelectionCandidates = writable(new Set<AssetResponseDto>());
  // The beginning of the selection range
  const assetSelectionStart = writable<AssetResponseDto | null>(null);

  const selectAsset = (asset: AssetResponseDto) => {
    selectedAssets.update(($selectedAssets) => $selectedAssets.add(asset));
  };

  const selectAssets = (assets: AssetResponseDto[]) => {
    selectedAssets.update(($selectedAssets) => {
      for (const asset of assets) {
        $selectedAssets.add(asset);
      }
      return $selectedAssets;
    });
  };

  const removeAssetFromMultiselectGroup = (asset: AssetResponseDto) => {
    selectedAssets.update(($selectedAssets) => {
      $selectedAssets.delete(asset);
      return $selectedAssets;
    });
  };

  const addGroupToMultiselectGroup = (group: string) => {
    selectedGroup.update(($selectedGroup) => $selectedGroup.add(group));
  };

  const removeGroupFromMultiselectGroup = (group: string) => {
    selectedGroup.update(($selectedGroup) => {
      $selectedGroup.delete(group);
      return $selectedGroup;
    });
  };

  const setAssetSelectionStart = (asset: AssetResponseDto | null) => {
    assetSelectionStart.set(asset);
  };

  const setAssetSelectionCandidates = (assets: AssetResponseDto[]) => {
    assetSelectionCandidates.set(new Set(assets));
  };

  const clearAssetSelectionCandidates = () => {
    assetSelectionCandidates.set(new Set());
  };

  const clearMultiselect = () => {
    // Multi-selection
    selectedAssets.set(new Set());
    selectedGroup.set(new Set());

    // Range selection
    assetSelectionCandidates.set(new Set());
    assetSelectionStart.set(null);
  };

  return {
    selectAsset,
    selectAssets,
    removeAssetFromMultiselectGroup,
    addGroupToMultiselectGroup,
    removeGroupFromMultiselectGroup,
    setAssetSelectionCandidates,
    clearAssetSelectionCandidates,
    setAssetSelectionStart,
    clearMultiselect,
    isMultiSelectState: readonly(isMultiSelectStoreState),
    selectedAssets: readonly(selectedAssets),
    selectedGroup: readonly(selectedGroup),
    assetSelectionCandidates: readonly(assetSelectionCandidates),
    assetSelectionStart: readonly(assetSelectionStart),
  };
}
