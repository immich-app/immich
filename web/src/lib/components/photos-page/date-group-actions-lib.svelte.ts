import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
import { searchStore } from '$lib/stores/search.svelte';

/** Glue functions that update the assetInteraction (asset selection) in response to AssetDateGroup UI
 *
 */
export class DateGroupActionLib {
  onSelect: (asset: TimelineAsset) => void = () => void 0;
  scrollTop: (top: number) => void = () => void 0;
  assetInteraction: AssetInteraction = $state(new AssetInteraction());
  timelineManager: TimelineManager = $state(new TimelineManager());
  singleSelect: boolean = $state(false);
  lastAssetMouseEvent: TimelineAsset | null = $state(null);
  shiftKeyIsDown = $state(false);
  isEmpty = $derived(this.timelineManager.isInitialized && this.timelineManager.months.length === 0);

  constructor() {
    $effect(() => {
      if (!this.lastAssetMouseEvent || !this.lastAssetMouseEvent) {
        this.assetInteraction.clearAssetSelectionCandidates();
      }
      if (this.shiftKeyIsDown && this.lastAssetMouseEvent) {
        void this.selectAssetCandidates(this.lastAssetMouseEvent);
      }
      if (this.isEmpty) {
        this.assetInteraction.clearMultiselect();
      }
    });
  }

  handleSelectAsset(asset: TimelineAsset) {
    if (!this.timelineManager.albumAssets.has(asset.id)) {
      this.assetInteraction.selectAsset(asset);
    }
  }

  onKeyDown = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      this.shiftKeyIsDown = true;
    }
  };

  onKeyUp = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      this.shiftKeyIsDown = false;
    }
  };

  onSelectAssetCandidates = (asset: TimelineAsset | null) => {
    if (asset) {
      void this.selectAssetCandidates(asset);
    }
    this.lastAssetMouseEvent = asset;
  };

  onDateGroupSelect = ({ title: group, assets }: { title: string; assets: TimelineAsset[] }) => {
    if (this.assetInteraction.selectedGroup.has(group)) {
      this.assetInteraction.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        this.assetInteraction.removeAssetFromMultiselectGroup(asset.id);
      }
    } else {
      this.assetInteraction.addGroupToMultiselectGroup(group);
      for (const asset of assets) {
        this.handleSelectAsset(asset);
      }
    }

    if (this.timelineManager.assetCount == this.assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  onSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    this.onSelect(asset);

    if (this.singleSelect) {
      this.scrollTop(0);

      return;
    }

    const rangeSelection = this.assetInteraction.assetSelectionCandidates.length > 0;
    const deselect = this.assetInteraction.hasSelectedAsset(asset.id);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of this.assetInteraction.assetSelectionCandidates) {
        this.assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      this.assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of this.assetInteraction.assetSelectionCandidates) {
        this.handleSelectAsset(candidate);
      }
      this.handleSelectAsset(asset);
    }

    this.assetInteraction.clearAssetSelectionCandidates();

    if (this.assetInteraction.assetSelectionStart && rangeSelection) {
      let startBucket = this.timelineManager.getMonthGroupByAssetId(this.assetInteraction.assetSelectionStart.id);
      let endBucket = this.timelineManager.getMonthGroupByAssetId(asset.id);

      if (startBucket === null || endBucket === null) {
        return;
      }

      // Select/deselect assets in range (start,end)
      let started = false;
      for (const monthGroup of this.timelineManager.months) {
        if (monthGroup === endBucket) {
          break;
        }
        if (started) {
          await this.timelineManager.loadMonthGroup(monthGroup.yearMonth);
          for (const asset of monthGroup.assetsIterator()) {
            if (deselect) {
              this.assetInteraction.removeAssetFromMultiselectGroup(asset.id);
            } else {
              this.handleSelectAsset(asset);
            }
          }
        }
        if (monthGroup === startBucket) {
          started = true;
        }
      }

      // Update date group selection in range [start,end]
      started = false;
      for (const monthGroup of this.timelineManager.months) {
        if (monthGroup === startBucket) {
          started = true;
        }
        if (started) {
          // Split month group into day groups and check each group
          for (const dayGroup of monthGroup.dayGroups) {
            const dayGroupTitle = dayGroup.groupTitle;
            if (dayGroup.getAssets().every((a) => this.assetInteraction.hasSelectedAsset(a.id))) {
              this.assetInteraction.addGroupToMultiselectGroup(dayGroupTitle);
            } else {
              this.assetInteraction.removeGroupFromMultiselectGroup(dayGroupTitle);
            }
          }
        }
        if (monthGroup === endBucket) {
          break;
        }
      }
    }

    this.assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  selectAssetCandidates = async (endAsset: TimelineAsset) => {
    if (!this.shiftKeyIsDown) {
      return;
    }

    const startAsset = this.assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    const assets = assetsSnapshot(await this.timelineManager.retrieveRange(startAsset, endAsset));
    this.assetInteraction.setAssetSelectionCandidates(assets);
  };
}
