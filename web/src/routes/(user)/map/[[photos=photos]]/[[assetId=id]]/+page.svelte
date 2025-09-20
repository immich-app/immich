<script lang="ts">
  import { run } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import { AppRoute } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, setAssetId } = assetViewingStore;

  let viewingAssets: string[] = $state([]);
  let viewingAssetCursor = 0;

  onDestroy(() => {
    assetViewingStore.showAssetViewer(false);
  });

  run(() => {
    if (!$featureFlags.map) {
      handlePromiseError(goto(AppRoute.PHOTOS));
    }
  });

  async function onViewAssets(assetIds: string[]) {
    viewingAssets = assetIds;
    viewingAssetCursor = 0;
    await setAssetId(assetIds[0]);
  }

  async function navigateNext() {
    if (viewingAssetCursor < viewingAssets.length - 1) {
      await setAssetId(viewingAssets[++viewingAssetCursor]);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      return true;
    }
    return false;
  }

  async function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      await setAssetId(viewingAssets[--viewingAssetCursor]);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      return true;
    }
    return false;
  }

  async function navigateRandom() {
    if (viewingAssets.length <= 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * viewingAssets.length);
    const asset = await setAssetId(viewingAssets[index]);
    await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
    return asset;
  }
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate h-full w-full">
      <Map hash onSelect={onViewAssets} />
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if $showAssetViewer}
      {#await import('../../../../../lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          asset={$viewingAsset}
          showNavigation={viewingAssets.length > 1}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onRandom={navigateRandom}
          onClose={() => {
            assetViewingStore.showAssetViewer(false);
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>
{/if}
