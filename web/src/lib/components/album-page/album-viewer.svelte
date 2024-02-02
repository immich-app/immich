<script lang="ts">
  import { browser } from '$app/environment';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { locale } from '$lib/stores/preferences.store';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { AlbumResponseDto, SharedLinkResponseDto, UserResponseDto } from '@api';
  import { onDestroy, onMount } from 'svelte';
  import { dateFormats } from '../../constants';
  import { createAssetInteractionStore } from '../../stores/asset-interaction.store';
  import { AssetStore } from '../../stores/assets.store';
  import { downloadArchive } from '../../utils/asset-utils';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import AssetGrid from '../photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import ThemeButton from '../shared-components/theme-button.svelte';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';
  import { mdiFileImagePlusOutline, mdiFolderDownloadOutline } from '@mdi/js';
  import UpdatePanel from '../shared-components/update-panel.svelte';

  export let sharedLink: SharedLinkResponseDto;
  export let user: UserResponseDto | undefined = undefined;

  const album = sharedLink.album as AlbumResponseDto;

  let { isViewing: showAssetViewer } = assetViewingStore;

  const assetStore = new AssetStore({ albumId: album.id });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      fileUploadHandler(value.files, album.id);
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });

  const getDateRange = () => {
    const { startDate, endDate } = album;

    let start = '';
    let end = '';

    if (startDate) {
      start = new Date(startDate).toLocaleDateString($locale, dateFormats.album);
    }

    if (endDate) {
      end = new Date(endDate).toLocaleDateString($locale, dateFormats.album);
    }

    if (startDate && endDate && start !== end) {
      return `${start} - ${end}`;
    }

    if (start) {
      return start;
    }

    return '';
  };

  const onKeyboardPress = (event: KeyboardEvent) => handleKeyboardPress(event);

  onMount(async () => {
    document.addEventListener('keydown', onKeyboardPress);
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  });

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if (shouldIgnoreShortcut(event)) {
      return;
    }
    if (!$showAssetViewer) {
      switch (event.key) {
        case 'Escape': {
          if ($isMultiSelectState) {
            assetInteractionStore.clearMultiselect();
          }
          return;
        }
      }
    }
  };

  const downloadAlbum = async () => {
    await downloadArchive(`${album.albumName}.zip`, { albumId: album.id });
  };
</script>

<header>
  {#if $isMultiSelectState && user}
    <AssetSelectControlBar
      ownerId={user.id}
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
        <a data-sveltekit-preload-data="hover" class="ml-6 flex place-items-center gap-2 hover:cursor-pointer" href="/">
          <ImmichLogo height={30} width={30} />
          <h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">IMMICH</h1>
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
          <CircleIconButton title="Download" on:click={() => downloadAlbum()} icon={mdiFolderDownloadOutline} />
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
      <p
        class="bg-immich-bg text-6xl text-immich-primary outline-none transition-all dark:bg-immich-dark-bg dark:text-immich-dark-primary"
      >
        {album.albumName}
      </p>

      <!-- ALBUM SUMMARY -->
      {#if album.assetCount > 0}
        <span class="my-4 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
          <p class="">{getDateRange()}</p>
          <p>·</p>
          <p>{album.assetCount} items</p>
        </span>
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
  <UpdatePanel {assetStore} />
</main>
