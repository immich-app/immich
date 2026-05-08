<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import LargeAssetData from './LargeAssetData.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { getNextAsset, getPreviousAsset, navigateToAsset } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import type { AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let assets = $state(data.assets);
  let asset = $derived(data.asset);

  $effect(() => {
    if (asset) {
      assetViewerManager.setAsset(asset);
    }
  });

  const onRandom = async () => {
    if (assets.length <= 0) {
      return undefined;
    }
    const index = Math.floor(Math.random() * assets.length);
    const asset = assets[index];
    await onViewAsset(asset);
    return asset;
  };

  const preAction = async (payload: Action) => {
    if (payload.type == 'trash') {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      (await navigateToAsset(assetCursor?.nextAsset)) ||
        (await navigateToAsset(assetCursor?.previousAsset)) ||
        assetViewerManager.showAssetViewer(false);
    }
  };

  const onAssetsDelete = (assetIds: string[]) => {
    assets = assets.filter(({ id }) => !assetIds.includes(id));
  };

  const onViewAsset = async (asset: AssetResponseDto) => {
    await navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const assetCursor = $derived({
    current: assetViewerManager.asset!,
    nextAsset: getNextAsset(assets, assetViewerManager.asset),
    previousAsset: getPreviousAsset(assets, assetViewerManager.asset),
  });
</script>

<OnEvents {onAssetsDelete} />

<UserPageLayout title={data.meta.title} scrollbar={true}>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
    {#if assets && assets.length > 0}
      {#each assets as asset (asset.id)}
        <LargeAssetData {asset} {onViewAsset} />
      {/each}
    {:else}
      <p class="flex place-content-center place-items-center text-center text-lg dark:text-white">
        {$t('no_assets_to_show')}
      </p>
    {/if}
  </div>
</UserPageLayout>

{#if assetViewerManager.isViewing}
  {#await import('$lib/components/asset-viewer/AssetViewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        cursor={assetCursor}
        showNavigation={assets.length > 1}
        {onRandom}
        {preAction}
        onClose={() => {
          assetViewerManager.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    </Portal>
  {/await}
{/if}
