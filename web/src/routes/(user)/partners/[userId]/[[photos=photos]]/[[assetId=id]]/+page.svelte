<script lang="ts">
  import { goto } from '$app/navigation';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import { AppRoute } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';
  import { mdiPlus, mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetStore = new AssetStore({ userId: data.partner.id, isArchived: false, withStacked: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets, clearMultiselect } = assetInteractionStore;

  onDestroy(() => {
    assetInteractionStore.clearMultiselect();
    assetStore.destroy();
  });
</script>

<main class="grid h-screen bg-immich-bg pt-18 dark:bg-immich-dark-bg">
  {#if $isMultiSelectState}
    <AssetSelectControlBar assets={$selectedAssets} clearSelect={clearMultiselect}>
      <CreateSharedLink />
      <ButtonContextMenu icon={mdiPlus} title={$t('add')}>
        <AddToAlbum />
        <AddToAlbum shared />
      </ButtonContextMenu>
      <DownloadAction />
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton backIcon={mdiArrowLeft} onClose={() => goto(AppRoute.SHARING)}>
      {#snippet leading()}
        <p class="whitespace-nowrap text-immich-fg dark:text-immich-dark-fg">
          {data.partner.name}'s photos
        </p>
      {/snippet}
    </ControlAppBar>
  {/if}
  <AssetGrid enableRouting={true} {assetStore} {assetInteractionStore} showUserThumbnailsinViewer={false} />
</main>
