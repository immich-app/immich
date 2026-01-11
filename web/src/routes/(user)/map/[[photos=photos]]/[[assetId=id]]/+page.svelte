<script lang="ts">
  import { goto } from '$app/navigation';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { AppRoute, timeToLoadTheMap } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { delay } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { LoadingSpinner } from '@immich/ui';
  import { onDestroy, untrack } from 'svelte';
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

  if (!featureFlagsManager.value.map) {
    handlePromiseError(goto(AppRoute.PHOTOS));
  }

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

  const getNextAsset = async (currentAsset: AssetResponseDto | undefined, preload: boolean = true) => {
    if (!currentAsset) {
      return;
    }
    const cursor = viewingAssets.indexOf(currentAsset.id);
    if (cursor < viewingAssets.length - 1) {
      const id = viewingAssets[cursor + 1];
      const asset = await getAssetInfo({ ...authManager.params, id });
      if (preload) {
        void getNextAsset(asset, false);
      }
      return asset;
    }
  };

  const getPreviousAsset = async (currentAsset: AssetResponseDto | undefined, preload: boolean = true) => {
    if (!currentAsset) {
      return;
    }
    const cursor = viewingAssets.indexOf(currentAsset.id);
    if (cursor <= 0) {
      return;
    }
    const id = viewingAssets[cursor - 1];
    const asset = await getAssetInfo({ ...authManager.params, id });
    if (preload) {
      void getPreviousAsset(asset, false);
    }
    return asset;
  };

  let assetCursor = $state<AssetCursor>({
    current: $viewingAsset,
    previousAsset: undefined,
    nextAsset: undefined,
  });

  const loadCloseAssets = async (currentAsset: AssetResponseDto) => {
    const [nextAsset, previousAsset] = await Promise.all([getNextAsset(currentAsset), getPreviousAsset(currentAsset)]);
    assetCursor = {
      current: currentAsset,
      nextAsset,
      previousAsset,
    };
  };

  //TODO: replace this with async derived in svelte 6
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    $viewingAsset;
    untrack(() => void loadCloseAssets($viewingAsset));
  });
</script>

{#if featureFlagsManager.value.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate h-full w-full">
      {#await import('$lib/components/shared-components/map/map.svelte')}
        {#await delay(timeToLoadTheMap) then}
          <!-- show the loading spinner only if loading the map takes too much time -->
          <div class="flex items-center justify-center h-full w-full">
            <LoadingSpinner />
          </div>
        {/await}
      {:then { default: Map }}
        <Map hash onSelect={onViewAssets} />
      {/await}
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if $showAssetViewer}
      {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          cursor={assetCursor}
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
