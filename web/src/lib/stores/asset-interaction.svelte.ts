import { user } from '$lib/stores/user.store';
import type { TimelineStackResponseDto, UserAdminResponseDto } from '@immich/sdk';
import { SvelteSet } from 'svelte/reactivity';
import { fromStore } from 'svelte/store';

export type BaseInteractionAsset = {
  id: string;
  isTrashed: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  ownerId: string;
  stack?: TimelineStackResponseDto | null | undefined;
};
export class AssetInteraction<T extends BaseInteractionAsset> {
  selectedAssets = $state<T[]>([]);
  hasSelectedAsset(assetId: string) {
    return this.selectedAssets.some((asset) => asset.id === assetId);
  }
  selectedGroup = new SvelteSet<string>();
  assetSelectionCandidates = $state<T[]>([]);
  hasSelectionCandidate(assetId: string) {
    return this.assetSelectionCandidates.some((asset) => asset.id === assetId);
  }
  assetSelectionStart = $state<T | null>(null);
  focussedAssetId = $state<string | null>(null);
  selectionActive = $derived(this.selectedAssets.length > 0);

  private user = fromStore<UserAdminResponseDto | undefined>(user);
  private userId = $derived(this.user.current?.id);

  isAllTrashed = $derived(this.selectedAssets.every((asset) => asset.isTrashed));
  isAllArchived = $derived(this.selectedAssets.every((asset) => asset.isArchived));
  isAllFavorite = $derived(this.selectedAssets.every((asset) => asset.isFavorite));
  isAllUserOwned = $derived(this.selectedAssets.every((asset) => asset.ownerId === this.userId));

  selectAsset(asset: T) {
    if (!this.hasSelectedAsset(asset.id)) {
      this.selectedAssets.push(asset);
    }
  }

  selectAssets(assets: T[]) {
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

  setAssetSelectionStart(asset: T | null) {
    this.assetSelectionStart = asset;
  }

  setAssetSelectionCandidates(assets: T[]) {
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

  isFocussedAsset(assetId: string) {
    return this.focussedAssetId === assetId;
  }
}
