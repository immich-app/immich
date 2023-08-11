<script lang="ts">
  import { browser } from '$app/environment';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { locale } from '$lib/stores/preferences.store';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { AlbumResponseDto, AssetResponseDto, SharedLinkResponseDto } from '@api';
  import { onDestroy, onMount } from 'svelte';
  import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
  import FolderDownloadOutline from 'svelte-material-icons/FolderDownloadOutline.svelte';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import { dateFormats } from '../../constants';
  import { downloadArchive } from '../../utils/asset-utils';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import ThemeButton from '../shared-components/theme-button.svelte';

  export let album: AlbumResponseDto;
  export let sharedLink: SharedLinkResponseDto;

  let { isViewing: showAssetViewer } = assetViewingStore;

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      fileUploadHandler(value.files, album.id, sharedLink?.key);
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });

  let multiSelectAsset: Set<AssetResponseDto> = new Set();
  $: isMultiSelectionMode = multiSelectAsset.size > 0;

  const getDateRange = () => {
    const startDate = new Date(album.assets[0].fileCreatedAt);
    const endDate = new Date(album.assets[album.assetCount - 1].fileCreatedAt);

    const startDateString = startDate.toLocaleDateString($locale, dateFormats.album);
    const endDateString = endDate.toLocaleDateString($locale, dateFormats.album);

    // If the start and end date are the same, only show one date
    return startDateString === endDateString ? startDateString : `${startDateString} - ${endDateString}`;
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
    if (!$showAssetViewer) {
      switch (event.key) {
        case 'Escape':
          if (isMultiSelectionMode) {
            multiSelectAsset = new Set();
          }
          return;
      }
    }
  };

  const downloadAlbum = async () => {
    await downloadArchive(`${album.albumName}.zip`, { albumId: album.id }, sharedLink?.key);
  };

  const handleSelectAll = () => {
    multiSelectAsset = new Set(album.assets);
  };
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg">
  {#if isMultiSelectionMode}
    <AssetSelectControlBar assets={multiSelectAsset} clearSelect={() => (multiSelectAsset = new Set())}>
      <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
      {#if sharedLink.allowDownload}
        <DownloadAction filename="{album.albumName}.zip" sharedLinkKey={sharedLink.key} />
      {/if}
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton={false}>
      <svelte:fragment slot="leading">
        <a
          data-sveltekit-preload-data="hover"
          class="ml-6 flex place-items-center gap-2 hover:cursor-pointer"
          href="https://immich.app"
        >
          <ImmichLogo height={30} width={30} />
          <h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">IMMICH</h1>
        </a>
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        {#if sharedLink.allowUpload}
          <CircleIconButton
            title="Add Photos"
            on:click={() => openFileUploadDialog(album.id, sharedLink.key)}
            logo={FileImagePlusOutline}
          />
        {/if}

        {#if album.assetCount > 0 && sharedLink.allowDownload}
          <CircleIconButton title="Download" on:click={() => downloadAlbum()} logo={FolderDownloadOutline} />
        {/if}

        <ThemeButton />
      </svelte:fragment>
    </ControlAppBar>
  {/if}

  <section class="my-[160px] flex flex-col px-6 sm:px-12 md:px-24 lg:px-40">
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
    <p class="mb-12 mt-6 w-full pb-2 text-left text-lg font-medium dark:text-gray-300">
      {album.description}
    </p>

    <GalleryViewer assets={album.assets} {sharedLink} bind:selectedAssets={multiSelectAsset} />
  </section>
</section>
