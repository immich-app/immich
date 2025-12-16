<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CastButton from '$lib/cast/cast-button.svelte';
  import AlbumMap from '$lib/components/album-page/album-map.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { handleDownloadAlbum } from '$lib/services/album.service';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { handlePromiseError } from '$lib/utils';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import type { AlbumResponseDto, SharedLinkResponseDto, UserResponseDto } from '@immich/sdk';
  import { IconButton, Logo } from '@immich/ui';
  import { mdiDownload, mdiFileImagePlusOutline, mdiPresentationPlay } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import ThemeButton from '../shared-components/theme-button.svelte';
  import AlbumSummary from './album-summary.svelte';
  import { SlideshowNavigation, SlideshowState, slideshowStore } from '$lib/stores/slideshow.store';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    user?: UserResponseDto | undefined;
  }

  let { sharedLink, user = undefined }: Props = $props();

  const album = sharedLink.album as AlbumResponseDto;

  let { isViewing: showAssetViewer, setAssetId } = assetViewingStore;
  let { slideshowState, slideshowNavigation } = slideshowStore;

  const options = $derived({ albumId: album.id, order: album.order });
  let timelineManager = $state<TimelineManager>() as TimelineManager;

  const assetInteraction = new AssetInteraction();

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      handlePromiseError(fileUploadHandler({ files: value.files, albumId: album.id }));
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });

  const handleStartSlideshow = async () => {
    const asset =
      $slideshowNavigation === SlideshowNavigation.Shuffle
        ? await timelineManager.getRandomAsset()
        : timelineManager.months[0]?.dayGroups[0]?.viewerAssets[0]?.asset;
    if (asset) {
      handlePromiseError(setAssetId(asset.id).then(() => ($slideshowState = SlideshowState.PlaySlideshow)));
    }
  };
</script>

<svelte:document
  use:shortcut={{
    shortcut: { key: 'Escape' },
    onShortcut: () => {
      if (!$showAssetViewer && assetInteraction.selectionActive) {
        cancelMultiselect(assetInteraction);
      }
    },
  }}
/>

<main class="relative h-dvh overflow-hidden px-2 md:px-6 max-md:pt-(--navbar-height-md) pt-(--navbar-height)">
  <Timeline enableRouting={true} {album} bind:timelineManager {options} {assetInteraction}>
    <section class="pt-8 md:pt-24 px-2 md:px-0">
      <!-- ALBUM TITLE -->
      <h1 class="text-2xl md:text-4xl lg:text-6xl text-primary outline-none transition-all">
        {album.albumName}
      </h1>

      {#if album.assetCount > 0}
        <AlbumSummary {album} />
      {/if}

      <!-- ALBUM DESCRIPTION -->
      {#if album.description}
        <p
          class="whitespace-pre-line mb-12 mt-6 w-full pb-2 text-start font-medium text-base text-black dark:text-gray-300"
        >
          {album.description}
        </p>
      {/if}
    </section>
  </Timeline>
</main>

<header>
  {#if assetInteraction.selectionActive}
    <AssetSelectControlBar
      ownerId={user?.id}
      assets={assetInteraction.selectedAssets}
      clearSelect={() => assetInteraction.clearMultiselect()}
    >
      <SelectAllAssets {timelineManager} {assetInteraction} />
      {#if sharedLink.allowDownload}
        <DownloadAction filename="{album.albumName}.zip" />
      {/if}
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar showBackButton={false}>
      {#snippet leading()}
        <a data-sveltekit-preload-data="hover" class="ms-4" href="/">
          <Logo variant="inline" class="min-w-min" />
        </a>
      {/snippet}

      {#snippet trailing()}
        <CastButton />

        {#if sharedLink.allowUpload}
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={$t('add_photos')}
            onclick={() => openFileUploadDialog({ albumId: album.id })}
            icon={mdiFileImagePlusOutline}
          />
        {/if}

        {#if album.assetCount > 0 && sharedLink.allowDownload}
          <IconButton
            shape="round"
            variant="ghost"
            color="secondary"
            aria-label={$t('slideshow')}
            onclick={handleStartSlideshow}
            icon={mdiPresentationPlay}
          />
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={$t('download')}
            onclick={() => handleDownloadAlbum(album)}
            icon={mdiDownload}
          />
        {/if}
        {#if sharedLink.showMetadata && featureFlagsManager.value.map}
          <AlbumMap {album} />
        {/if}
        <ThemeButton />
      {/snippet}
    </ControlAppBar>
  {/if}
</header>
