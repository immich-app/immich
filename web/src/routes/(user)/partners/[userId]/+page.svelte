<script lang="ts">
  import { goto } from '$app/navigation';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import { AppRoute } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';
  import { mdiPlus, mdiArrowLeft } from '@mdi/js';
  import UpdatePanel from '$lib/components/shared-components/update-panel.svelte';

  export let data: PageData;

  const assetStore = new AssetStore({ userId: data.partner.id, isArchived: false, withStacked: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets, clearMultiselect } = assetInteractionStore;

  onDestroy(() => {
    assetInteractionStore.clearMultiselect();
  });
</script>

<main class="grid h-screen bg-immich-bg pt-18 dark:bg-immich-dark-bg">
  {#if $isMultiSelectState}
    <AssetSelectControlBar assets={$selectedAssets} clearSelect={clearMultiselect}>
      <CreateSharedLink />
      <AssetSelectContextMenu icon={mdiPlus} title="Add">
        <AddToAlbum />
        <AddToAlbum shared />
      </AssetSelectContextMenu>
      <DownloadAction />
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton backIcon={mdiArrowLeft} on:close={() => goto(AppRoute.SHARING)}>
      <svelte:fragment slot="leading">
        <p class="whitespace-nowrap text-immich-fg dark:text-immich-dark-fg">
          {data.partner.name}'s photos
        </p>
      </svelte:fragment>
    </ControlAppBar>
  {/if}
  <AssetGrid {assetStore} {assetInteractionStore} />
  <UpdatePanel {assetStore} />
</main>
