import { user } from '$lib/stores/user.store';
import type { AssetResponseDto, UserAdminResponseDto } from '@immich/sdk';
import { SvelteSet } from 'svelte/reactivity';
import { fromStore } from 'svelte/store';

export class AssetInteraction {
  selectedAssets = $state<AssetResponseDto[]>([]);
  hasSelectedAsset(assetId: string) {
    return this.selectedAssets.some((asset) => asset.id === assetId);
  }
  selectedGroup = new SvelteSet<string>();
  assetSelectionCandidates = $state<AssetResponseDto[]>([]);
  hasSelectionCandidate(assetId: string) {
    return this.assetSelectionCandidates.some((asset) => asset.id === assetId);
  }
  assetSelectionStart = $state<AssetResponseDto | null>(null);
  selectionActive = $derived(this.selectedAssets.length > 0);

  private user = fromStore<UserAdminResponseDto | undefined>(user);
  private userId = $derived(this.user.current?.id);

  isAllTrashed = $derived(this.selectedAssets.every((asset) => asset.isTrashed));
  isAllArchived = $derived(this.selectedAssets.every((asset) => asset.isArchived));
  isAllFavorite = $derived(this.selectedAssets.every((asset) => asset.isFavorite));
  isAllUserOwned = $derived(this.selectedAssets.every((asset) => asset.ownerId === this.userId));

  selectAsset(asset: AssetResponseDto) {
    if (!this.hasSelectedAsset(asset.id)) {
      this.selectedAssets.push(asset);
    }
  }

  selectAssets(assets: AssetResponseDto[]) {
    for (const asset of assets) {
      this.selectAsset(asset);
    }
  }

  removeAssetFromMultiselectGroup(assetId: string) {
    const index = this.selectedAssets.findIndex((a) => a.id == assetId);
    if (index !== -1) {
      this.selectedAssets.splice(index, 1);
    }
  }

  addGroupToMultiselectGroup(group: string) {
    this.selectedGroup.add(group);
  }

  removeGroupFromMultiselectGroup(group: string) {
    this.selectedGroup.delete(group);
  }

  setAssetSelectionStart(asset: AssetResponseDto | null) {
    this.assetSelectionStart = asset;
  }

  setAssetSelectionCandidates(assets: AssetResponseDto[]) {
    this.assetSelectionCandidates = assets;
  }

  clearAssetSelectionCandidates() {
    this.assetSelectionCandidates = [];
  }

  clearMultiselect() {
    // Multi-selection
    this.selectedAssets = [];
    this.selectedGroup.clear();

    // Range selection
    this.assetSelectionCandidates = [];
    this.assetSelectionStart = null;
  }
}
