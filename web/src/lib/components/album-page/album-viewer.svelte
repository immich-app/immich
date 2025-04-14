<script lang="ts">
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { AlbumResponseDto, SharedLinkResponseDto, UserResponseDto } from '@immich/sdk';
  import { AssetStore } from '$lib/stores/assets-store.svelte';
  import { cancelMultiselect, downloadAlbum } from '$lib/utils/asset-utils';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import AssetGrid from '../photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import ImmichLogoSmallLink from '../shared-components/immich-logo-small-link.svelte';
  import ThemeButton from '../shared-components/theme-button.svelte';
  import { shortcut } from '$lib/actions/shortcut';
  import { mdiFileImagePlusOutline, mdiFolderDownloadOutline } from '@mdi/js';
  import { handlePromiseError } from '$lib/utils';
  import AlbumSummary from './album-summary.svelte';
  import { t } from 'svelte-i18n';
  import { onDestroy } from 'svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    user?: UserResponseDto | undefined;
  }

  let { sharedLink, user = undefined }: Props = $props();

  const album = sharedLink.album as AlbumResponseDto;

  let { isViewing: showAssetViewer } = assetViewingStore;

  const assetStore = new AssetStore();
  $effect(() => void assetStore.updateOptions({ albumId: album.id, order: album.order }));
  onDestroy(() => assetStore.destroy());

  const assetInteraction = new AssetInteraction();

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      handlePromiseError(fileUploadHandler(value.files, album.id));
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });
</script>

<svelte:window
  use:shortcut={{
    shortcut: { key: 'Escape' },
    onShortcut: () => {
      if (!$showAssetViewer && assetInteraction.selectionActive) {
        cancelMultiselect(assetInteraction);
      }
    },
  }}
/>

<header>
  {#if assetInteraction.selectionActive}
    <AssetSelectControlBar
      ownerId={user?.id}
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
      <SelectAllAssets {assetStore} {assetInteraction} />
      {#if sharedLink.allowDownload}
        <DownloadAction filename="{album.albumName}.zip" />
      {/if}
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton={false}>
      {#snippet leading()}
        <ImmichLogoSmallLink />
      {/snippet}

      {#snippet trailing()}
        {#if sharedLink.allowUpload}
          <CircleIconButton
            title={$t('add_photos')}
            onclick={() => openFileUploadDialog({ albumId: album.id })}
            icon={mdiFileImagePlusOutline}
          />
        {/if}

        {#if album.assetCount > 0 && sharedLink.allowDownload}
          <CircleIconButton
            title={$t('download')}
            onclick={() => downloadAlbum(album)}
            icon={mdiFolderDownloadOutline}
          />
        {/if}

        <ThemeButton />
      {/snippet}
    </ControlAppBar>
  {/if}
</header>

<main
  class="relative h-dvh overflow-hidden bg-immich-bg px-2 md:px-6 max-md:pt-[var(--navbar-height-md)] pt-[var(--navbar-height)] dark:bg-immich-dark-bg"
>
  <AssetGrid enableRouting={true} {album} {assetStore} {assetInteraction}>
    <section class="pt-8 md:pt-24 px-2 md:px-0">
      <!-- ALBUM TITLE -->
      <h1
        class="bg-immich-bg text-2xl md:text-4xl lg:text-6xl text-immich-primary outline-none transition-all dark:bg-immich-dark-bg dark:text-immich-dark-primary"
      >
        {album.albumName}
      </h1>

      {#if album.assetCount > 0}
        <AlbumSummary {album} />
      {/if}

      <!-- ALBUM DESCRIPTION -->
      {#if album.description}
        <p
          class="whitespace-pre-line mb-12 mt-6 w-full pb-2 text-left font-medium text-base text-black dark:text-gray-300"
        >
          {album.description}
        </p>
      {/if}
    </section>
  </AssetGrid>
</main>
