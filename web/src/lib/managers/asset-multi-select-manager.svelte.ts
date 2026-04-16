import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { AssetVisibility } from '@immich/sdk';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

export type AssetMultiSelectOptions = {
  resetOnNavigate?: boolean;
};
export class AssetMultiSelectManager {
  #selectedMap = new SvelteMap<string, TimelineAsset>();

  selectAll = $state(false);
  startAsset = $state<TimelineAsset | null>(null);

  selectedGroup = new SvelteSet<string>();

  candidates = $state<TimelineAsset[]>([]);

  selectionActive = $derived(this.#selectedMap.size > 0);

  assets = $derived(Array.from(this.#selectedMap.values()));
  ownedAssets = $derived(
    authManager.authenticated ? this.assets.filter((asset) => asset.ownerId === authManager.user.id) : this.assets,
  );

  isAllTrashed = $derived(this.assets.every((asset) => asset.isTrashed));
  isAllArchived = $derived(this.assets.every((asset) => asset.visibility === AssetVisibility.Archive));
  isAllFavorite = $derived(this.assets.every((asset) => asset.isFavorite));
  isAllUserOwned = $derived(
    authManager.authenticated && this.assets.every((asset) => asset.ownerId === authManager.user.id),
  );

  #unsubscribe?: () => void;

  constructor(options?: AssetMultiSelectOptions) {
    const { resetOnNavigate = false } = options ?? {};
    if (resetOnNavigate) {
      this.#unsubscribe = eventManager.on({ AppNavigate: () => this.clear() });
    }
  }

  destroy() {
    this.#unsubscribe?.();
  }

  getOwnedAssets() {
    return authManager.authenticated
      ? this.assets.filter((asset) => asset.ownerId === authManager.user.id)
      : this.assets;
  }

  hasSelectedAsset(assetId: string) {
    return this.#selectedMap.has(assetId);
  }

  hasSelectionCandidate(assetId: string) {
    return this.candidates.some((asset) => asset.id === assetId);
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
    this.candidates = assets;
  }

  clearCandidates() {
    this.candidates = [];
  }

  clear() {
    this.selectAll = false;

    // Multi-selection
    this.#selectedMap.clear();
    this.selectedGroup.clear();

    // Range selection
    this.candidates = [];
    this.startAsset = null;
  }
}

export const assetMultiSelectManager = new AssetMultiSelectManager({ resetOnNavigate: true });
