<script lang="ts">
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { handlePromiseError } from '#lib/utils.ts';
  import { undoLastDelete } from '#lib/utils/actions.ts';
  import { shortcuts } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import UploadCover from './DragAndDropUploadOverlay.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();

  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  $effect.pre(() => {
    if (page.data.asset) {
      assetViewerManager.setAsset(page.data.asset);
    } else {
      assetViewerManager.showAssetViewer(false);
    }
    const asset = page.url.searchParams.get('at');
    assetViewerManager.gridScrollTarget = { at: asset };
  });
</script>

<svelte:document
  {@attach shortcuts([
    { shortcut: { key: 'z', ctrl: true }, onShortcut: () => handlePromiseError(undoLastDelete()) },
    { shortcut: { key: 'z', meta: true }, onShortcut: () => handlePromiseError(undoLastDelete()) },
  ])}
/>

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
