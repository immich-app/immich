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
  import { AssetStore } from '$lib/stores/assets.store';
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';
  import { mdiPlus, mdiArrowLeft } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const assetStore = new AssetStore({ userId: data.partner.id, isArchived: false, withStacked: true });
  const assetInteraction = new AssetInteraction();

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  onDestroy(() => {
    assetStore.destroy();
  });
</script>

<main class="grid h-screen bg-immich-bg pt-18 dark:bg-immich-dark-bg">
  {#if assetInteraction.selectionActive}
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
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
  <AssetGrid enableRouting={true} {assetStore} {assetInteraction} onEscape={handleEscape} />
</main>
