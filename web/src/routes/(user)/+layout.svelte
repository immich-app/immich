<script lang="ts">
  import OnEvents from '#lib/components/OnEvents.svelte';
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { privateSessionManager } from '#lib/managers/private-session-manager.svelte.ts';
  import { getAuthStatusQuery } from '#lib/queries/auth.query.ts';
  import { createQuery } from '@tanstack/svelte-query';
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import UploadCover from './DragAndDropUploadOverlay.svelte';

  interface Props {
    children?: Snippet;
  }

  let { children }: Props = $props();
  let sessionLockCount = $state(0);
  const session = createQuery(() => ({
    ...getAuthStatusQuery(),
    enabled: authManager.authenticated && !authManager.isSharedLink,
  }));

  $effect(() => privateSessionManager.observe(session.data));

  const onSessionLocked = () => {
    assetMultiSelectManager.clear();
    assetViewerManager.showAssetViewer(false);
    sessionLockCount++;
  };

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

<OnEvents {onSessionLocked} />
<div class:display-none={assetViewerManager.isViewing}>
  {#key sessionLockCount}
    {@render children?.()}
  {/key}
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
