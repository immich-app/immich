<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import LargeAssetData from '$lib/components/utilities-page/large-assets/large-asset-data.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();
  const { isViewing: showAssetViewer, asset: viewingAsset, setAsset } = assetViewingStore;
  const getAssetIndex = (id: string) => data.assets.findIndex((asset) => asset.id === id);

  const onNext = () => {
    const index = getAssetIndex($viewingAsset.id) + 1;
    if (index >= data.assets.length) {
      return Promise.resolve(false);
    }
    setAsset(data.assets[index]);
    return Promise.resolve(true);
  };

  const onPrevious = () => {
    const index = getAssetIndex($viewingAsset.id) - 1;
    if (index < 0) {
      return Promise.resolve(false);
    }
    setAsset(data.assets[index]);
    return Promise.resolve(true);
  };

  const onRandom = () => {
    if (data.assets.length <= 0) {
      return Promise.resolve(undefined);
    }
    const index = Math.floor(Math.random() * data.assets.length);
    const asset = data.assets[index];
    setAsset(asset);
    return Promise.resolve(asset);
  };
</script>

<UserPageLayout title={data.meta.title} scrollbar={true}>
  <div class="flex gap-2 flex-wrap">
    {#if data.assets && data.assets.length > 0}
      {#each data.assets as asset (asset.id)}
        <LargeAssetData {asset} onViewAsset={(asset) => setAsset(asset)} />
      {/each}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_assets_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>

{#if $showAssetViewer}
  {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
    <Portal target="body">
      <AssetViewer
        asset={$viewingAsset}
        showNavigation={data.assets.length > 1}
        {onNext}
        {onPrevious}
        {onRandom}
        onClose={() => {
          assetViewingStore.showAssetViewer(false);
          handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
        }}
      />
    </Portal>
  {/await}
{/if}
