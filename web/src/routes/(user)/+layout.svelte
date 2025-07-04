<script lang="ts">
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import type { Snippet } from 'svelte';
  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  // page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  // $effect(() => {
  //   TODO: navigation to the asset grid.
  //   const asset = page.url.searchParams.get('at');
  //   gridScrollTarget = { at: asset };
  // });
</script>

<!-- display-none is based on assetManager.showAssetViewer -->
<div class:display-none={false}>
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
