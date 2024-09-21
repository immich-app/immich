<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { intersectionObserver } from '$lib/actions/intersection-observer';
  import { resizeObserver } from '$lib/actions/resize-observer';
  import { shortcuts } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { type Viewport } from '$lib/stores/assets.store';
  import { memoryStore } from '$lib/stores/memory.store';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl, handlePromiseError, memoryLaneTitle } from '$lib/utils';
  import { fromLocalDateTime } from '$lib/utils/timeline-util';
  import { AssetMediaSize, getMemoryLane, type AssetResponseDto, type MemoryLaneResponseDto } from '@immich/sdk';
  import {
    mdiChevronDown,
    mdiChevronLeft,
    mdiChevronRight,
    mdiChevronUp,
    mdiDotsVertical,
    mdiImageSearch,
    mdiPause,
    mdiPlay,
    mdiPlus,
    mdiSelectAll,
  } from '@mdi/js';
  import type { NavigationTarget } from '@sveltejs/kit';
  import { DateTime } from 'luxon';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { tweened } from 'svelte/motion';
  import { derived } from 'svelte/store';
  import { fade } from 'svelte/transition';

  type MemoryIndex = {
    memoryIndex: number;
    assetIndex: number;
  };

  type MemoryAsset = MemoryIndex & {
    memory: MemoryLaneResponseDto;
    asset: AssetResponseDto;
    previousMemory?: MemoryLaneResponseDto;
    previous?: MemoryAsset;
    next?: MemoryAsset;
    nextMemory?: MemoryLaneResponseDto;
  };

  let memoryGallery: HTMLElement;
  let memoryWrapper: HTMLElement;
  let galleryInView = false;
  let paused = false;
  let selectedAssets: Set<AssetResponseDto> = new Set();
  let current: MemoryAsset | undefined = undefined;
  // let memories: MemoryAsset[] = [];
  let resetPromise = Promise.resolve();

  const { isViewing } = assetViewingStore;
  const viewport: Viewport = { width: 0, height: 0 };
  const progress = tweened<number>(0, { duration: (from: number, to: number) => (to ? 5000 * (to - from) : 0) });
  const memories = derived(memoryStore, (memories) => {
    memories = memories ?? [];
    const memoryAssets: MemoryAsset[] = [];
    let previous: MemoryAsset | undefined;
    for (const [memoryIndex, memory] of memories.entries()) {
      for (const [assetIndex, asset] of memory.assets.entries()) {
        const current = {
          memory,
          memoryIndex,
          previousMemory: memories[memoryIndex - 1],
          nextMemory: memories[memoryIndex + 1],
          asset,
          assetIndex,
          previous,
        };

        memoryAssets.push(current);

        if (previous) {
          previous.next = current;
        }

        previous = current;
      }
    }

    return memoryAssets;
  });

  $: isMultiSelectionMode = selectedAssets.size > 0;
  $: isAllArchived = [...selectedAssets].every((asset) => asset.isArchived);
  $: isAllFavorite = [...selectedAssets].every((asset) => asset.isFavorite);
  $: selectedAssets = galleryInView ? selectedAssets : new Set();
  $: handlePromiseError(handleProgress($progress));
  $: handlePromiseError(handleAction(galleryInView ? 'pause' : 'play'));

  const loadFromParams = (memories: MemoryAsset[], page: typeof $page | NavigationTarget | null) => {
    const assetId = page?.params?.assetId ?? page?.url.searchParams.get(QueryParameter.ID) ?? undefined;
    handlePromiseError(handleAction($isViewing ? 'pause' : 'reset'));
    return memories.find((memory) => memory.asset.id === assetId) ?? memories[0];
  };
  const asHref = (asset: AssetResponseDto) => `?${QueryParameter.ID}=${asset.id}`;
  const handleNavigate = async (asset?: AssetResponseDto) => {
    if ($isViewing) {
      return asset;
    }

    await handleAction('reset');
    if (!asset) {
      return;
    }

    await goto(asHref(asset));
  };
  const handleNextAsset = () => handleNavigate(current?.next?.asset);
  const handlePreviousAsset = () => handleNavigate(current?.previous?.asset);
  const handleNextMemory = () => handleNavigate(current?.nextMemory?.assets[0]);
  const handlePreviousMemory = () => handleNavigate(current?.previousMemory?.assets[0]);
  const handleEscape = async () => goto(AppRoute.PHOTOS);
  const handleSelectAll = () => (selectedAssets = new Set(current?.memory.assets || []));
  const handleAction = async (action: 'reset' | 'pause' | 'play') => {
    switch (action) {
      case 'play': {
        paused = false;
        await progress.set(1);
        break;
      }

      case 'pause': {
        paused = true;
        await progress.set($progress);
        break;
      }

      case 'reset': {
        paused = false;
        resetPromise = progress.set(0);
        break;
      }
    }
  };
  const handleProgress = async (progress: number) => {
    if (progress === 0 && !paused) {
      await handleAction('play');
      return;
    }

    if (progress === 1) {
      await (current?.next ? handleNextAsset() : handleAction('pause'));
    }
  };
  const handleUpdate = () => {
    if (!current) {
      return;
    }
    current.memory.assets = current.memory.assets;
  };
  const handleRemove = (ids: string[]) => {
    if (!current) {
      return;
    }
    const idSet = new Set(ids);
    current.memory.assets = current.memory.assets.filter((asset) => !idSet.has(asset.id));
    init();
  };

  const init = () => {
    $memoryStore = $memoryStore.filter((memory) => memory.assets.length > 0);
    if ($memoryStore.length === 0) {
      return handlePromiseError(goto(AppRoute.PHOTOS));
    }

    current = loadFromParams($memories, $page);
  };

  onMount(async () => {
    if (!$memoryStore) {
      const localTime = new Date();
      $memoryStore = await getMemoryLane({
        month: localTime.getMonth() + 1,
        day: localTime.getDate(),
      });
    }

    init();
  });

  afterNavigate(({ from, to }) => {
    let target = null;
    if (to?.params?.assetId) {
      target = to;
    } else if (from?.params?.assetId) {
      target = from;
    } else {
      target = $page;
    }

    current = loadFromParams($memories, target);
  });
</script>

<svelte:window
  use:shortcuts={$isViewing
    ? []
    : [
        { shortcut: { key: 'ArrowRight' }, onShortcut: () => handleNextAsset() },
        { shortcut: { key: 'd' }, onShortcut: () => handleNextAsset() },
        { shortcut: { key: 'ArrowLeft' }, onShortcut: () => handlePreviousAsset() },
        { shortcut: { key: 'a' }, onShortcut: () => handlePreviousAsset() },
        { shortcut: { key: 'Escape' }, onShortcut: () => handleEscape() },
      ]}
/>

{#if isMultiSelectionMode}
  <div class="sticky top-0 z-[90]">
    <AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
      <CreateSharedLink />
      <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} on:click={handleSelectAll} />

      <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
        <AddToAlbum />
        <AddToAlbum shared />
      </ButtonContextMenu>

      <FavoriteAction removeFavorite={isAllFavorite} onFavorite={handleUpdate} />

      <ButtonContextMenu icon={mdiDotsVertical} title={$t('add')}>
        <DownloadAction menuItem />
        <ChangeDate menuItem />
        <ChangeLocation menuItem />
        <ArchiveAction menuItem unarchive={isAllArchived} onArchive={handleRemove} />
        <DeleteAssets menuItem onAssetDelete={handleRemove} />
      </ButtonContextMenu>
    </AssetSelectControlBar>
  </div>
{/if}

<section id="memory-viewer" class="w-full bg-immich-dark-gray" bind:this={memoryWrapper}>
  {#if current && current.memory.assets.length > 0}
    <ControlAppBar onClose={() => goto(AppRoute.PHOTOS)} forceDark>
      <svelte:fragment slot="leading">
        <p class="text-lg">
          {$memoryLaneTitle(current.memory.yearsAgo)}
        </p>
      </svelte:fragment>

      <div class="flex place-content-center place-items-center gap-2 overflow-hidden">
        <CircleIconButton
          title={paused ? $t('play_memories') : $t('pause_memories')}
          icon={paused ? mdiPlay : mdiPause}
          on:click={() => handleAction(paused ? 'play' : 'pause')}
          class="hover:text-black"
        />

        {#each current.memory.assets as asset, index}
          <a class="relative w-full py-2" href={asHref(asset)}>
            <span class="absolute left-0 h-[2px] w-full bg-gray-500" />
            {#await resetPromise}
              <span class="absolute left-0 h-[2px] bg-white" style:width={`${index < current.assetIndex ? 100 : 0}%`} />
            {:then}
              <span
                class="absolute left-0 h-[2px] bg-white"
                style:width={`${index < current.assetIndex ? 100 : index > current.assetIndex ? 0 : $progress * 100}%`}
              />
            {/await}
          </a>
        {/each}

        <div>
          <p class="text-small">
            {(current.assetIndex + 1).toLocaleString($locale)}/{current.memory.assets.length.toLocaleString($locale)}
          </p>
        </div>
      </div>
    </ControlAppBar>

    {#if galleryInView}
      <div
        class="fixed top-20 z-30 left-1/2 -translate-x-1/2 transition-opacity"
        class:opacity-0={!galleryInView}
        class:opacity-100={galleryInView}
      >
        <button
          type="button"
          on:click={() => memoryWrapper.scrollIntoView({ behavior: 'smooth' })}
          disabled={!galleryInView}
        >
          <CircleIconButton title={$t('hide_gallery')} icon={mdiChevronUp} color="light" />
        </button>
      </div>
    {/if}
    <!-- Viewer -->
    <section class="overflow-hidden pt-20">
      <div
        class="ml-[-100%] box-border flex h-[calc(100vh_-_180px)] w-[300%] items-center justify-center gap-10 overflow-hidden"
      >
        <!-- PREVIOUS MEMORY -->
        <div class="h-1/2 w-[20vw] rounded-2xl {current.previousMemory ? 'opacity-25 hover:opacity-70' : 'opacity-0'}">
          <button
            type="button"
            class="relative h-full w-full rounded-2xl"
            disabled={!current.previousMemory}
            on:click={handlePreviousMemory}
          >
            {#if current.previousMemory && current.previousMemory.assets.length > 0}
              <img
                class="h-full w-full rounded-2xl object-cover"
                src={getAssetThumbnailUrl({ id: current.previousMemory.assets[0].id, size: AssetMediaSize.Preview })}
                alt={$t('previous_memory')}
                draggable="false"
              />
            {:else}
              <enhanced:img
                class="h-full w-full rounded-2xl object-cover"
                src="$lib/assets/no-thumbnail.png"
                sizes="min(271px,186px)"
                alt={$t('previous_memory')}
                draggable="false"
              />
            {/if}

            {#if current.previousMemory}
              <div class="absolute bottom-4 right-4 text-left text-white">
                <p class="text-xs font-semibold text-gray-200">{$t('previous').toUpperCase()}</p>
                <p class="text-xl">{$memoryLaneTitle(current.previousMemory.yearsAgo)}</p>
              </div>
            {/if}
          </button>
        </div>

        <!-- CURRENT MEMORY -->
        <div
          class="main-view relative flex h-full w-[70vw] place-content-center place-items-center rounded-2xl bg-black"
        >
          <div class="relative h-full w-full rounded-2xl bg-black">
            {#key current.asset.id}
              <img
                transition:fade
                class="h-full w-full rounded-2xl object-contain transition-all"
                src={getAssetThumbnailUrl({ id: current.asset.id, size: AssetMediaSize.Preview })}
                alt={current.asset.exifInfo?.description}
                draggable="false"
              />
            {/key}

            <div
              class="absolute bottom-6 right-6 transition-all"
              class:opacity-0={galleryInView}
              class:opacity-100={!galleryInView}
            >
              <CircleIconButton
                href="{AppRoute.PHOTOS}?at={current.asset.id}"
                icon={mdiImageSearch}
                title={$t('view_in_timeline')}
                color="light"
              />
            </div>
            <!-- CONTROL BUTTONS -->
            {#if current.previous}
              <div class="absolute top-1/2 left-0 ml-4">
                <CircleIconButton
                  title={$t('previous_memory')}
                  icon={mdiChevronLeft}
                  color="dark"
                  on:click={handlePreviousAsset}
                />
              </div>
            {/if}

            {#if current.next}
              <div class="absolute top-1/2 right-0 mr-4">
                <CircleIconButton
                  title={$t('next_memory')}
                  icon={mdiChevronRight}
                  color="dark"
                  on:click={handleNextAsset}
                />
              </div>
            {/if}

            <div class="absolute left-8 top-4 text-sm font-medium text-white">
              <p>
                {fromLocalDateTime(current.memory.assets[0].localDateTime).toLocaleString(DateTime.DATE_FULL)}
              </p>
              <p>
                {current.asset.exifInfo?.city || ''}
                {current.asset.exifInfo?.country || ''}
              </p>
            </div>
          </div>
        </div>

        <!-- NEXT MEMORY -->
        <div class="h-1/2 w-[20vw] rounded-2xl {current.nextMemory ? 'opacity-25 hover:opacity-70' : 'opacity-0'}">
          <button
            type="button"
            class="relative h-full w-full rounded-2xl"
            on:click={handleNextMemory}
            disabled={!current.nextMemory}
          >
            {#if current.nextMemory && current.nextMemory.assets.length > 0}
              <img
                class="h-full w-full rounded-2xl object-cover"
                src={getAssetThumbnailUrl({ id: current.nextMemory.assets[0].id, size: AssetMediaSize.Preview })}
                alt={$t('next_memory')}
                draggable="false"
              />
            {:else}
              <enhanced:img
                class="h-full w-full rounded-2xl object-cover"
                src="$lib/assets/no-thumbnail.png"
                sizes="min(271px,186px)"
                alt={$t('next_memory')}
                draggable="false"
              />
            {/if}

            {#if current.nextMemory}
              <div class="absolute bottom-4 left-4 text-left text-white">
                <p class="text-xs font-semibold text-gray-200">{$t('up_next').toUpperCase()}</p>
                <p class="text-xl">{$memoryLaneTitle(current.nextMemory.yearsAgo)}</p>
              </div>
            {/if}
          </button>
        </div>
      </div>
    </section>

    <!-- GALLERY VIEWER -->
    <section class="bg-immich-dark-gray p-4">
      <div
        class="sticky mb-10 flex place-content-center place-items-center transition-all"
        class:opacity-0={galleryInView}
        class:opacity-100={!galleryInView}
      >
        <CircleIconButton
          title={$t('show_gallery')}
          icon={mdiChevronDown}
          color="light"
          on:click={() => memoryGallery.scrollIntoView({ behavior: 'smooth' })}
        />
      </div>

      <div
        id="gallery-memory"
        use:intersectionObserver={{
          onIntersect: () => (galleryInView = true),
          onSeparate: () => (galleryInView = false),
          bottom: '-200px',
        }}
        use:resizeObserver={({ height, width }) => ((viewport.height = height), (viewport.width = width))}
        bind:this={memoryGallery}
      >
        <GalleryViewer
          onNext={handleNextAsset}
          onPrevious={handlePreviousAsset}
          assets={current.memory.assets}
          {viewport}
          bind:selectedAssets
        />
      </div>
    </section>
  {/if}
</section>

<style>
  .main-view {
    box-shadow:
      0 4px 4px 0 rgba(0, 0, 0, 0.3),
      0 8px 12px 6px rgba(0, 0, 0, 0.15);
  }
</style>
