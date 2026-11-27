<script lang="ts">
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { handlePromiseError } from '#lib/utils.ts';
  import { forgetUndoableDeletes, undoLastDelete } from '#lib/utils/actions.ts';
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

  // Ctrl+Z only undoes deletes made on the current page. Every navigation replaces page.route, so the
  // id is derived first: it stays the same while the page opens or closes an asset, and the cleanup
  // runs only when the user goes to another page or leaves the user pages, for example by logging out.
  const routeId = $derived(page.route.id);
  $effect(() => {
    void routeId;
    return forgetUndoableDeletes;
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
