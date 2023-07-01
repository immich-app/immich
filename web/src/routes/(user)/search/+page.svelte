<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
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
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import ImageOffOutline from 'svelte-material-icons/ImageOffOutline.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import type { PageData } from './$types';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { AppRoute } from '$lib/constants';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import { flip } from 'svelte/animate';

  export let data: PageData;

  // The GalleryViewer pushes it's own history state, which causes weird
  // behavior for history.back(). To prevent that we store the previous page
  // manually and navigate back to that.
  let previousRoute = AppRoute.EXPLORE as string;
  $: albums = data.results.albums.items;

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }

    if (from?.route.id === '/(user)/albums/[albumId]') {
      previousRoute = AppRoute.EXPLORE;
    }
  });

  $: term = (() => {
    let term = $page.url.searchParams.get('q') || data.term || '';
    const isMetadataSearch = $page.url.searchParams.get('clip') === 'false';
    if (isMetadataSearch && term !== '') {
      term = `m:${term}`;
    }
    return term;
  })();

  let selectedAssets: Set<AssetResponseDto> = new Set();
  $: isMultiSelectionMode = selectedAssets.size > 0;
  $: isAllArchived = Array.from(selectedAssets).every((asset) => asset.isArchived);
  $: isAllFavorite = Array.from(selectedAssets).every((asset) => asset.isFavorite);
  $: searchResultAssets = data.results.assets.items;

  const onAssetDelete = (assetId: string) => {
    searchResultAssets = searchResultAssets.filter((a: AssetResponseDto) => a.id !== assetId);
  };
  const handleSelectAll = () => {
    selectedAssets = new Set(searchResultAssets);
  };
</script>

<section>
  {#if isMultiSelectionMode}
    <AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
      <CreateSharedLink />
      <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
      <AssetSelectContextMenu icon={Plus} title="Add">
        <AddToAlbum />
        <AddToAlbum shared />
      </AssetSelectContextMenu>
      <DeleteAssets {onAssetDelete} />

      <AssetSelectContextMenu icon={DotsVertical} title="Add">
        <DownloadAction menuItem />
        <FavoriteAction menuItem removeFavorite={isAllFavorite} />
        <ArchiveAction menuItem unarchive={isAllArchived} />
      </AssetSelectContextMenu>
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar on:close-button-click={() => goto(previousRoute)} backIcon={ArrowLeft}>
      <div class="w-full max-w-2xl flex-1 pl-4">
        <SearchBar grayTheme={false} value={term} />
      </div>
    </ControlAppBar>
  {/if}
</section>

<section class="relative pt-32 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
  <section class="overflow-y-auto relative immich-scrollbar">
    {#if albums.length}
      <section>
        <div class="text-4xl font-medium text-black/70 dark:text-white/80 ml-6">ALBUMS</div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
          {#each albums as album (album.id)}
            <a data-sveltekit-preload-data="hover" href={`albums/${album.id}`} animate:flip={{ duration: 200 }}>
              <AlbumCard {album} user={data.user} isSharingView={false} showItemCount={false} showContextMenu={false} />
            </a>
          {/each}
        </div>

        <div class="m-6 text-4xl font-medium text-black/70 dark:text-white/80">PHOTOS & VIDEOS</div>
      </section>
    {/if}
    <section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
      {#if data.results?.assets?.items.length > 0}
        <div class="pl-4">
          <GalleryViewer
            assets={searchResultAssets}
            bind:selectedAssets
            viewFrom="search-page"
            showArchiveIcon={true}
          />
        </div>
      {:else}
        <div class="flex items-center place-content-center w-full min-h-[calc(66vh_-_11rem)] dark:text-white">
          <div class="flex flex-col content-center items-center text-center">
            <ImageOffOutline size="3.5em" />
            <p class="font-medium text-3xl mt-5">No results</p>
            <p class="text-base font-normal">Try a synonym or more general keyword</p>
          </div>
        </div>
      {/if}
    </section>
  </section>
</section>
