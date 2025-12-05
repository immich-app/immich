<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import type { AssetCursor } from '$lib/components/asset-viewer/asset-viewer.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LargeAssetData from '$lib/components/utilities-page/large-assets/large-asset-data.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { getAssetInfo, type AssetResponseDto } from '@immich/sdk';
  import { untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let assets = $derived(data.assets);
  let asset = $derived(data.asset);
  const { isViewing: showAssetViewer, asset: viewingAsset, setAsset } = assetViewingStore;
  const getAssetIndex = (id: string) => assets.findIndex((asset) => asset.id === id);

  $effect(() => {
    if (asset) {
      setAsset(asset);
    }
  });

  const onNext = async () => {
    const index = getAssetIndex($viewingAsset.id) + 1;
    if (index >= assets.length) {
      return false;
    }
    await onViewAsset(assets[index]);
    return true;
  };

  const onPrevious = async () => {
    const index = getAssetIndex($viewingAsset.id) - 1;
    if (index < 0) {
      return false;
    }
    await onViewAsset(assets[index]);
    return true;
  };

  const onRandom = async () => {
    if (assets.length <= 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * assets.length);
    const asset = assets[index];
    await onViewAsset(asset);
    return asset;
  };

  const onAction = (payload: Action) => {
    if (payload.type == 'trash') {
      assets = assets.filter((a) => a.id != payload.asset.id);
      $showAssetViewer = false;
    }
  };

  const onViewAsset = async (asset: AssetResponseDto) => {
    await navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const getNextAsset = async (currentAsset: AssetResponseDto | undefined, preload: boolean = true) => {
    if (!currentAsset) {
      return;
    }
    const cursor = assets.indexOf(currentAsset);
    if (cursor < assets.length - 1) {
      const id = assets[cursor + 1].id;
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
    const cursor = assets.indexOf(currentAsset);
    if (cursor <= 0) {
      return;
    }
    const id = assets[cursor - 1].id;
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

<UserPageLayout title={data.meta.title} scrollbar={true}>
  <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
    {#if assets && data.assets.length > 0}
      {#each assets as asset (asset.id)}
        <LargeAssetData {asset} {onViewAsset} />
      {/each}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_assets_to_show')}
      </p>
    {/if}
  </div>
</UserPageLayout>

{#if $showAssetViewer}
  {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        cursor={assetCursor}
        showNavigation={assets.length > 1}
        {onNext}
        {onPrevious}
        {onRandom}
        {onAction}
        onClose={() => {
          assetViewingStore.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    </Portal>
  {/await}
{/if}
