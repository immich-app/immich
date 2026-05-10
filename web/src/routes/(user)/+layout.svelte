<script lang="ts">
  import { page } from '$app/state';
  import UploadCover from './DragAndDropUploadOverlay.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import type { Snippet } from 'svelte';
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  $effect.pre(() => {
    // Explicitly reference the param to ensure this effect re-runs on param changes
    const assetIdParam = page.params.assetId;

    if (page.data.asset) {
      assetViewerManager.setAsset(page.data.asset);
    } else if (assetIdParam) {
      // When returning via history.back() to a route with assetId,
      // page.data.asset won't be loaded (no loader re-run).
      // Load it directly from the route params.
      assetViewerManager.setAssetId(assetIdParam).catch(() => {
        assetViewerManager.showAssetViewer(false);
      });
    } else {
      assetViewerManager.showAssetViewer(false);
    }
  });

  $effect(() => {
    const asset = page.url.searchParams.get('at');
    assetViewerManager.gridScrollTarget = { at: asset };
  });
</script>

<div class:display-none={assetViewerManager.isViewing}>
  {@render children?.()}
</div>
<UploadCover />

<style>
  :root {
    overscroll-behavior: none;
  }
  .display-none {
    display: none;
  }
</style>
