import { user } from '$lib/stores/user.store';
import type { AssetResponseDto, UserAdminResponseDto } from '@immich/sdk';
import { SvelteSet } from 'svelte/reactivity';
import { fromStore } from 'svelte/store';

export class AssetInteraction {
  readonly selectedAssets = new SvelteSet<AssetResponseDto>();
  readonly selectedGroup = new SvelteSet<string>();
  assetSelectionCandidates = $state(new SvelteSet<AssetResponseDto>());
  assetSelectionStart = $state<AssetResponseDto | null>(null);
  focussedAssetId = $state<string | null>(null);

  selectionActive = $derived(this.selectedAssets.size > 0);
  selectedAssetsArray = $derived([...this.selectedAssets]);

  private user = fromStore<UserAdminResponseDto | undefined>(user);
  private userId = $derived(this.user.current?.id);

  isAllTrashed = $derived(this.selectedAssetsArray.every((asset) => asset.isTrashed));
  isAllArchived = $derived(this.selectedAssetsArray.every((asset) => asset.isArchived));
  isAllFavorite = $derived(this.selectedAssetsArray.every((asset) => asset.isFavorite));
  isAllUserOwned = $derived(this.selectedAssetsArray.every((asset) => asset.ownerId === this.userId));

  selectAsset(asset: AssetResponseDto) {
    this.selectedAssets.add(asset);
  }

  selectAssets(assets: AssetResponseDto[]) {
    for (const asset of assets) {
      this.selectedAssets.add(asset);
    }
  }

  removeAssetFromMultiselectGroup(asset: AssetResponseDto) {
    this.selectedAssets.delete(asset);
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
    this.assetSelectionCandidates = new SvelteSet(assets);
  }

  clearAssetSelectionCandidates() {
    this.assetSelectionCandidates.clear();
  }

  clearMultiselect() {
    // Multi-selection
    this.selectedAssets.clear();
    this.selectedGroup.clear();

    // Range selection
    this.assetSelectionCandidates.clear();
    this.assetSelectionStart = null;
  }

  isFocussedAsset(asset: AssetResponseDto) {
    return this.focussedAssetId === asset.id;
  }
}
