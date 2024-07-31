<script lang="ts">
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import { page } from '$app/stores';

  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  let { isViewing: showAssetViewer, setAsset, gridScrollTarget } = assetViewingStore;

  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  $: {
    if ($page.data.asset) {
      setAsset($page.data.asset);
    } else {
      $showAssetViewer = false;
    }
    const asset = $page.url.searchParams.get('at');
    $gridScrollTarget = { at: asset };
  }
</script>

<div class:display-none={$showAssetViewer}>
  <slot />
</div>
<UploadCover />

<style>
  .display-none {
    display: none;
  }
</style>
