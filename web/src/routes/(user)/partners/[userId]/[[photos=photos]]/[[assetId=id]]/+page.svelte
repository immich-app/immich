<script lang="ts">
  import { goto } from '$app/navigation';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import { AppRoute } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { AssetVisibility } from '@immich/sdk';
  import { mdiArrowLeft, mdiPlus } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const timelineManager = new TimelineManager();
  $effect(
    () =>
      void timelineManager.updateOptions({
        userId: data.partner.id,
        visibility: AssetVisibility.Timeline,
        withStacked: true,
      }),
  );
  onDestroy(() => timelineManager.destroy());
  const assetInteraction = new AssetInteraction();

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };
</script>

<main class="grid h-dvh pt-18">
  <AssetGrid enableRouting={true} {timelineManager} {assetInteraction} onEscape={handleEscape} />

  {#if assetInteraction.selectionActive}
    <AssetSelectControlBar
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
      <CreateSharedLink />
      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
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
</main>
