import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { user } from '$lib/stores/user.store';
import { AssetVisibility, type UserAdminResponseDto } from '@immich/sdk';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { fromStore } from 'svelte/store';

export class AssetInteraction {
  private selectedAssetsMap = new SvelteMap<string, TimelineAsset>();
  selectedAssets = $derived(Array.from(this.selectedAssetsMap.values()));
  selectAll = $state(false);
  hasSelectedAsset(assetId: string) {
    return this.selectedAssetsMap.has(assetId);
  }
  selectedGroup = new SvelteSet<string>();
  assetSelectionCandidates = $state<TimelineAsset[]>([]);
  hasSelectionCandidate(assetId: string) {
    return this.assetSelectionCandidates.some((asset) => asset.id === assetId);
  }
  assetSelectionStart = $state<TimelineAsset | null>(null);
  selectionActive = $derived(this.selectedAssetsMap.size > 0);

  private user = fromStore<UserAdminResponseDto | undefined>(user);
  private userId = $derived(this.user.current?.id);

  isAllTrashed = $derived(this.selectedAssets.every((asset) => asset.isTrashed));
  isAllArchived = $derived(this.selectedAssets.every((asset) => asset.visibility === AssetVisibility.Archive));
  isAllFavorite = $derived(this.selectedAssets.every((asset) => asset.isFavorite));
  isAllUserOwned = $derived(this.selectedAssets.every((asset) => asset.ownerId === this.userId));

  selectAsset(asset: TimelineAsset) {
    this.selectedAssetsMap.set(asset.id, asset);
  }

  selectAssets(assets: TimelineAsset[]) {
    for (const asset of assets) {
      this.selectAsset(asset);
    }
  }

  removeAssetFromMultiselectGroup(assetId: string) {
    this.selectedAssetsMap.delete(assetId);
  }

  addGroupToMultiselectGroup(group: string) {
    this.selectedGroup.add(group);
  }

  removeGroupFromMultiselectGroup(group: string) {
    this.selectedGroup.delete(group);
  }

  setAssetSelectionStart(asset: TimelineAsset | null) {
    this.assetSelectionStart = asset;
  }

  setAssetSelectionCandidates(assets: TimelineAsset[]) {
    this.assetSelectionCandidates = assets;
  }

  clearAssetSelectionCandidates() {
    this.assetSelectionCandidates = [];
  }

  clearMultiselect() {
    this.selectAll = false;

    // Multi-selection
    this.selectedAssetsMap.clear();
    this.selectedGroup.clear();

    // Range selection
    this.assetSelectionCandidates = [];
    this.assetSelectionStart = null;
  }
}
