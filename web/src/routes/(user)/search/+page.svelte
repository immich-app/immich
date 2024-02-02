<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import AssetSelectContextMenu from '$lib/components/photos-page/asset-select-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
  import type { AssetResponseDto } from '@api';
  import type { PageData } from './$types';
  import Icon from '$lib/components/elements/icon.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import { flip } from 'svelte/animate';
  import { onDestroy, onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { preventRaceConditionSearchBar } from '$lib/stores/search.store';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';
  import { mdiArrowLeft, mdiDotsVertical, mdiImageOffOutline, mdiPlus, mdiSelectAll } from '@mdi/js';

  export let data: PageData;

  let { isViewing: showAssetViewer } = assetViewingStore;

  // The GalleryViewer pushes it's own history state, which causes weird
  // behavior for history.back(). To prevent that we store the previous page
  // manually and navigate back to that.
  let previousRoute = AppRoute.EXPLORE as string;
  $: albums = data.results?.albums.items;

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
          if (isMultiSelectionMode) {
            selectedAssets = new Set();
            return;
          }
          if (!$preventRaceConditionSearchBar) {
            goto(previousRoute);
          }
          $preventRaceConditionSearchBar = false;
          return;
        }
      }
    }
  };

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from?.url && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }

    if (from?.route.id === '/(user)/people/[personId]') {
      previousRoute = AppRoute.PHOTOS;
    }

    if (from?.route.id === '/(user)/albums/[albumId]') {
      previousRoute = AppRoute.EXPLORE;
    }
  });

  $: term = (() => {
    let term = $page.url.searchParams.get(QueryParameter.SEARCH_TERM) || data.term || '';
    const isMetadataSearch = $page.url.searchParams.get(QueryParameter.SMART_SEARCH) === 'false';
    if (isMetadataSearch && term !== '') {
      term = `m:${term}`;
    }
    return term;
  })();

  let selectedAssets: Set<AssetResponseDto> = new Set();
  $: isMultiSelectionMode = selectedAssets.size > 0;
  $: isAllArchived = [...selectedAssets].every((asset) => asset.isArchived);
  $: isAllFavorite = [...selectedAssets].every((asset) => asset.isFavorite);
  $: searchResultAssets = data.results?.assets.items;

  const onAssetDelete = (assetId: string) => {
    searchResultAssets = searchResultAssets?.filter((a: AssetResponseDto) => a.id !== assetId);
  };
  const handleSelectAll = () => {
    selectedAssets = new Set(searchResultAssets);
  };
</script>

<section>
  {#if isMultiSelectionMode}
    <div class="fixed z-[100] top-0 left-0 w-full">
      <AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
        <CreateSharedLink />
        <CircleIconButton title="Select all" icon={mdiSelectAll} on:click={handleSelectAll} />
        <AssetSelectContextMenu icon={mdiPlus} title="Add">
          <AddToAlbum />
          <AddToAlbum shared />
        </AssetSelectContextMenu>
        <DeleteAssets {onAssetDelete} />

        <AssetSelectContextMenu icon={mdiDotsVertical} title="Add">
          <DownloadAction menuItem />
          <FavoriteAction menuItem removeFavorite={isAllFavorite} />
          <ArchiveAction menuItem unarchive={isAllArchived} />
          <ChangeDate menuItem />
          <ChangeLocation menuItem />
        </AssetSelectContextMenu>
      </AssetSelectControlBar>
    </div>
  {:else}
    <ControlAppBar on:close={() => goto(previousRoute)} backIcon={mdiArrowLeft}>
      <div class="w-full flex-1 pl-4">
        <SearchBar grayTheme={false} value={term} />
      </div>
    </ControlAppBar>
  {/if}
</section>

<section class="relative mb-12 bg-immich-bg pt-32 dark:bg-immich-dark-bg">
  <section class="immich-scrollbar relative overflow-y-auto">
    {#if albums && albums.length > 0}
      <section>
        <div class="ml-6 text-4xl font-medium text-black/70 dark:text-white/80">ALBUMS</div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
          {#each albums as album, index (album.id)}
            <a data-sveltekit-preload-data="hover" href={`albums/${album.id}`} animate:flip={{ duration: 200 }}>
              <AlbumCard
                preload={index < 20}
                {album}
                isSharingView={false}
                showItemCount={false}
                showContextMenu={false}
              />
            </a>
          {/each}
        </div>

        <div class="m-6 text-4xl font-medium text-black/70 dark:text-white/80">PHOTOS & VIDEOS</div>
      </section>
    {/if}
    <section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
      {#if searchResultAssets && searchResultAssets.length > 0}
        <div class="pl-4">
          <GalleryViewer assets={searchResultAssets} bind:selectedAssets showArchiveIcon={true} />
        </div>
      {:else}
        <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
          <div class="flex flex-col content-center items-center text-center">
            <Icon path={mdiImageOffOutline} size="3.5em" />
            <p class="mt-5 text-3xl font-medium">No results</p>
            <p class="text-base font-normal">Try a synonym or more general keyword</p>
          </div>
        </div>
      {/if}
    </section>
  </section>
</section>
