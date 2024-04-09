<script lang="ts">
  import { page } from '$app/stores';
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  let { isViewing: showAssetViewer, setAsset } = assetViewingStore;
  // This block takes care of opening the viewer.
  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  $: {
    if ($page.data.asset) {
      setAsset($page.data.asset);
    } else {
      $showAssetViewer = false;
    }
  }
</script>

<main>
  <slot />
</main>

<UploadCover />
