<script lang="ts">
  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import { AssetManager } from '$lib/managers/asset-manager.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let viewingAssets: string[] = $state([]);
  let viewingAssetCursor = 0;

  const assetManager = new AssetManager();
  $effect(() => {
    if (data.assetId) {
      assetManager.showAssetViewer = true;
      void assetManager.updateOptions({ assetId: data.assetId });
    }
  });
  onDestroy(() => assetManager.destroy());

  onDestroy(() => {
    assetManager.showAssetViewer = false;
  });

  $effect(() => {
    if (!$featureFlags.map) {
      handlePromiseError(goto(AppRoute.PHOTOS));
    }
  });

  async function onViewAssets(assetIds: string[]) {
    viewingAssets = assetIds;
    viewingAssetCursor = 0;
    await navigate({ targetRoute: 'current', assetId: assetIds[0] });
  }

  async function navigateNext() {
    if (viewingAssetCursor < viewingAssets.length - 1) {
      await navigate({ targetRoute: 'current', assetId: viewingAssets[++viewingAssetCursor] });
      return true;
    }
    return false;
  }

  async function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      await navigate({ targetRoute: 'current', assetId: viewingAssets[--viewingAssetCursor] });
      return true;
    }
    return false;
  }

  async function navigateRandom() {
    if (viewingAssets.length > 0) {
      const index = Math.floor(Math.random() * viewingAssets.length);
      await navigate({ targetRoute: 'current', assetId: viewingAssets[index] });
      return true;
    }
    return false;
  }
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate h-full w-full">
      <Map hash onSelect={onViewAssets} />
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if assetManager.showAssetViewer}
      {#await import('../../../../../lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          {assetManager}
          showNavigation={viewingAssets.length > 1}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onRandom={navigateRandom}
          onClose={() => {
            assetManager.showAssetViewer = false;
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>
{/if}
