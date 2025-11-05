<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LargeAssetData from '$lib/components/utilities-page/large-assets/large-asset-data.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let assets = $derived(data.assets);
  const { isViewing: showAssetViewer, asset: viewingAsset, setAsset } = assetViewingStore;
  const getAssetIndex = (id: string) => assets.findIndex((asset) => asset.id === id);

  const onNext = () => {
    const index = getAssetIndex($viewingAsset.id) + 1;
    if (index >= assets.length) {
      return Promise.resolve(false);
    }
    setAsset(assets[index]);
    return Promise.resolve(true);
  };

  const onPrevious = () => {
    const index = getAssetIndex($viewingAsset.id) - 1;
    if (index < 0) {
      return Promise.resolve(false);
    }
    setAsset(assets[index]);
    return Promise.resolve(true);
  };

  const onRandom = () => {
    if (assets.length <= 0) {
      return Promise.resolve(undefined);
    }
    const index = Math.floor(Math.random() * assets.length);
    const asset = assets[index];
    setAsset(asset);
    return Promise.resolve(asset);
  };

  const onAction = (payload: Action) => {
    if (payload.type == 'trash') {
      assets = assets.filter((a) => a.id != payload.asset.id);
      $showAssetViewer = false;
    }
  };
</script>

<UserPageLayout title={data.meta.title} scrollbar={true}>
  <div class="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
    {#if assets && data.assets.length > 0}
      {#each assets as asset (asset.id)}
        <LargeAssetData {asset} onViewAsset={(asset) => setAsset(asset)} />
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
        asset={$viewingAsset}
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
