<script lang="ts">
  import { run } from 'svelte/legacy';

  import { page } from '$app/stores';
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';

  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { Snippet } from 'svelte';
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let { isViewing: showAssetViewer, setAsset, gridScrollTarget } = assetViewingStore;

  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  run(() => {
    if ($page.data.asset) {
      setAsset($page.data.asset);
    } else {
      $showAssetViewer = false;
    }
    const asset = $page.url.searchParams.get('at');
    $gridScrollTarget = { at: asset };
  });
</script>

<div>
  {@render children?.()}
</div>
<UploadCover />

<style>
  :root {
    overscroll-behavior: none;
  }
</style>
