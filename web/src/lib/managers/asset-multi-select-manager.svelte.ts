import { eventManager } from '$lib/managers/event-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { user } from '$lib/stores/user.store';
import type { AssetControlContext } from '$lib/types';
import { AssetVisibility, type UserAdminResponseDto } from '@immich/sdk';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { fromStore } from 'svelte/store';

export type AssetMultiSelectOptions = {
  resetOnNavigate?: boolean;
};
export class AssetMultiSelectManager {
  #selectedMap = new SvelteMap<string, TimelineAsset>();
  #user = fromStore<UserAdminResponseDto | undefined>(user);
  #userId = $derived(this.#user.current?.id);

  selectAll = $state(false);
  startAsset = $state<TimelineAsset | null>(null);

  selectedGroup = new SvelteSet<string>();

  assetSelectionCandidates = $state<TimelineAsset[]>([]);

  selectionActive = $derived(this.#selectedMap.size > 0);
  selectedAssets = $derived(Array.from(this.#selectedMap.values()));
  isAllTrashed = $derived(this.selectedAssets.every((asset) => asset.isTrashed));
  isAllArchived = $derived(this.selectedAssets.every((asset) => asset.visibility === AssetVisibility.Archive));
  isAllFavorite = $derived(this.selectedAssets.every((asset) => asset.isFavorite));
  isAllUserOwned = $derived(this.selectedAssets.every((asset) => asset.ownerId === this.#userId));

  #unsubscribe?: () => void;

  constructor(options?: AssetMultiSelectOptions) {
    const { resetOnNavigate = false } = options ?? {};
    if (resetOnNavigate) {
      this.#unsubscribe = eventManager.on({ AppNavigate: () => this.clearMultiselect() });
    }
  }

  destroy() {
    this.#unsubscribe?.();
  }

  asControlContext(): AssetControlContext {
    return {
      getOwnedAssets: () => this.selectedAssets.filter((asset) => asset.ownerId === this.#userId),
      getAssets: () => this.selectedAssets,
      clearSelect: () => this.clearMultiselect(),
    };
  }

  hasSelectedAsset(assetId: string) {
    return this.#selectedMap.has(assetId);
  }

  hasSelectionCandidate(assetId: string) {
    return this.assetSelectionCandidates.some((asset) => asset.id === assetId);
  }

  selectAsset(asset: TimelineAsset) {
    this.#selectedMap.set(asset.id, asset);
  }

  selectAssets(assets: TimelineAsset[]) {
    for (const asset of assets) {
      this.selectAsset(asset);
    }
  }

  removeAssetFromMultiselectGroup(assetId: string) {
    this.#selectedMap.delete(assetId);
  }

  addGroupToMultiselectGroup(group: string) {
    this.selectedGroup.add(group);
  }

  removeGroupFromMultiselectGroup(group: string) {
    this.selectedGroup.delete(group);
  }

  setAssetSelectionStart(asset: TimelineAsset | null) {
    this.startAsset = asset;
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
    this.#selectedMap.clear();
    this.selectedGroup.clear();

    // Range selection
    this.assetSelectionCandidates = [];
    this.startAsset = null;
  }
}

export const assetMultiSelectManager = new AssetMultiSelectManager({ resetOnNavigate: true });
