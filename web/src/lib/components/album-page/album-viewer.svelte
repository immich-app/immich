<script lang="ts">
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { AlbumResponseDto, SharedLinkResponseDto, UserResponseDto } from '@immich/sdk';
  import { createAssetInteractionStore } from '../../stores/asset-interaction.store';
  import { AssetStore } from '../../stores/assets.store';
  import { downloadAlbum } from '../../utils/asset-utils';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import AssetGrid from '../photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import ThemeButton from '../shared-components/theme-button.svelte';
  import { shortcut } from '$lib/utils/shortcut';
  import { mdiFileImagePlusOutline, mdiFolderDownloadOutline } from '@mdi/js';
  import { handlePromiseError } from '$lib/utils';
  import AlbumSummary from './album-summary.svelte';

  export let sharedLink: SharedLinkResponseDto;
  export let user: UserResponseDto | undefined = undefined;

  const album = sharedLink.album as AlbumResponseDto;
  let innerWidth: number;

  let { isViewing: showAssetViewer } = assetViewingStore;

  const assetStore = new AssetStore({ albumId: album.id });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

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
      if (!$showAssetViewer && $isMultiSelectState) {
        assetInteractionStore.clearMultiselect();
      }
    },
  }}
  bind:innerWidth
/>

<header>
  {#if $isMultiSelectState}
    <AssetSelectControlBar
      ownerId={user?.id}
      assets={$selectedAssets}
      clearSelect={() => assetInteractionStore.clearMultiselect()}
    >
      <SelectAllAssets {assetStore} {assetInteractionStore} />
      {#if sharedLink.allowDownload}
        <DownloadAction filename="{album.albumName}.zip" />
      {/if}
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton={false}>
      <svelte:fragment slot="leading">
        <a data-sveltekit-preload-data="hover" class="ml-4" href="/">
          <ImmichLogo class="h-[24px] w-[24px] max-w-none md:w-auto md:h-10 md:max-w-full" noText={innerWidth < 768} />
        </a>
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        {#if sharedLink.allowUpload}
          <CircleIconButton
            title="Add Photos"
            on:click={() => openFileUploadDialog(album.id)}
            icon={mdiFileImagePlusOutline}
          />
        {/if}

        {#if album.assetCount > 0 && sharedLink.allowDownload}
          <CircleIconButton title="Download" on:click={() => downloadAlbum(album)} icon={mdiFolderDownloadOutline} />
        {/if}

        <ThemeButton />
      </svelte:fragment>
    </ControlAppBar>
  {/if}
</header>

<main class="relative h-screen overflow-hidden bg-immich-bg px-6 pt-[var(--navbar-height)] dark:bg-immich-dark-bg">
  <AssetGrid {album} {assetStore} {assetInteractionStore}>
    <section class="pt-24">
      <!-- ALBUM TITLE -->
      <h1
        class="bg-immich-bg text-6xl text-immich-primary outline-none transition-all dark:bg-immich-dark-bg dark:text-immich-dark-primary"
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
