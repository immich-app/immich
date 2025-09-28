<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { SearchResultsManager } from '$lib/managers/searchresults-manager/SearchResultsManager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { navigate } from '$lib/utils/navigation';
  let { asset: viewingAsset, setAssetId, preloadAssets } = assetViewingStore;

  interface Props {
    timelineManager: SearchResultsManager;

    onViewerClose?: (asset: { id: string }) => Promise<void>;
  }

  let { timelineManager, onViewerClose = () => Promise.resolve(void 0) }: Props = $props();

  const handleNext = async (): Promise<boolean> => {
    const next = timelineManager.findNextAsset($viewingAsset.id);
    if (next) {
      await navigateToAsset(next);
      return true;
    }
    return false;
  };

  const handleRandom = async (): Promise<{ id: string } | undefined> => {
    const next = timelineManager.findRandomAsset();
    if (next) {
      await navigateToAsset(next);
      return { id: next.id };
    }
  };

  const handlePrevious = async (): Promise<boolean> => {
    const next = timelineManager.findPreviousAsset($viewingAsset.id);
    if (next) {
      await navigateToAsset(next);
      return true;
    }
    return false;
  };

  const navigateToAsset = async (asset?: { id: string }) => {
    if (asset && asset.id !== $viewingAsset.id) {
      await setAssetId(asset.id);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
    }
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        timelineManager.removeAssets([action.asset.id]);
        if (!(await handlePrevious())) {
          await goto(AppRoute.PHOTOS);
        }
        break;
      }
    }
  };
</script>

{#await import('../asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
  <AssetViewer
    asset={$viewingAsset}
    preloadAssets={$preloadAssets}
    onAction={handleAction}
    onPrevious={handlePrevious}
    onNext={handleNext}
    onRandom={handleRandom}
    onClose={onViewerClose}
  />
{/await}
