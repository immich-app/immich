import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
import { tick } from 'svelte';

export function startViewerTransition(
  heroAssetId: string,
  openViewer: () => void,
  activateHeroAsset: (assetId: string) => void,
  deactivateHeroAsset: () => void,
) {
  void viewTransitionManager.startTransition({
    types: ['viewer'],
    prepareOldSnapshot: () => {
      activateHeroAsset(heroAssetId);
    },
    performUpdate: async (signal) => {
      deactivateHeroAsset();
      const ready = assetViewerManager.untilNext('ViewerOpenTransitionReady', { signal });
      openViewer();
      await ready;
      assetViewerManager.emit('ViewerOpenTransition');
      await tick();
    },
  });
}
