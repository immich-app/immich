<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
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
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { preventRaceConditionSearchBar, searchQuery } from '$lib/stores/search.store';
  import { authenticate } from '$lib/utils/auth';
  import { shouldIgnoreShortcut } from '$lib/utils/shortcut';
  import { type AssetResponseDto, type SearchResponseDto, searchSmart, searchMetadata, getPerson } from '@immich/sdk';
  import { mdiArrowLeft, mdiDotsVertical, mdiImageOffOutline, mdiPlus, mdiSelectAll } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import type { PageData } from './$types';
  import type { Viewport } from '$lib/stores/assets.store';
  import { locale } from '$lib/stores/preferences.store';

  export let data: PageData;

  const MAX_ASSET_COUNT = 5000;
  let { isViewing: showAssetViewer } = assetViewingStore;
  const viewport: Viewport = { width: 0, height: 0 };

  // The GalleryViewer pushes it's own history state, which causes weird
  // behavior for history.back(). To prevent that we store the previous page
  // manually and navigate back to that.
  let previousRoute = AppRoute.EXPLORE as string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let terms: any;
  $: currentPage = data.results?.assets.nextPage;
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

    updateInformationChip();
  });

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

  function updateInformationChip() {
    let query = $page.url.searchParams.get(QueryParameter.SEARCH_TERM) || data.term || '';
    terms = JSON.parse(query);
  }

  export const loadNextPage = async () => {
    if (currentPage == null || !terms || (searchResultAssets && searchResultAssets.length >= MAX_ASSET_COUNT)) {
      return;
    }

    await authenticate();
    let results: SearchResponseDto | null = null;
    $page.url.searchParams.set(QueryParameter.PAGE, currentPage.toString());
    const payload = $searchQuery;
    let responses: SearchResponseDto;

    responses =
      payload && 'query' in payload
        ? await searchSmart({
            smartSearchDto: { ...payload, page: Number.parseInt(currentPage), withExif: true },
          })
        : await searchMetadata({
            metadataSearchDto: { ...payload, page: Number.parseInt(currentPage), withExif: true },
          });

    if (searchResultAssets) {
      searchResultAssets.push(...responses.assets.items);
    } else {
      searchResultAssets = responses.assets.items;
    }

    const assets = {
      ...responses.assets,
      items: searchResultAssets,
    };
    results = {
      assets,
      albums: responses.albums,
    };

    data.results = results;
  };

  function getHumanReadableDate(date: string) {
    const d = new Date(date);
    return d.toLocaleDateString($locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getHumanReadableSearchKey(key: string): string {
    switch (key) {
      case 'takenAfter': {
        return 'Start date';
      }
      case 'takenBefore': {
        return 'End date';
      }
      case 'isArchived': {
        return 'In archive';
      }
      case 'isFavorite': {
        return 'Favorite';
      }
      case 'isNotInAlbum': {
        return 'Not in any album';
      }
      case 'type': {
        return 'Media type';
      }
      case 'query': {
        return 'Context';
      }
      case 'city': {
        return 'City';
      }
      case 'country': {
        return 'Country';
      }
      case 'state': {
        return 'State';
      }
      case 'make': {
        return 'Camera brand';
      }
      case 'model': {
        return 'Camera model';
      }
      case 'personIds': {
        return 'People';
      }
      default: {
        return key;
      }
    }
  }

  async function getPersonName(personIds: string[]) {
    const personNames = await Promise.all(
      personIds.map(async (personId) => {
        const person = await getPerson({ id: personId });

        if (person.name == '') {
          return 'No Name';
        }

        return person.name;
      }),
    );

    return personNames.join(', ');
  }
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
    <div class="fixed z-[100] top-0 left-0 w-full">
      <ControlAppBar on:close={() => goto(previousRoute)} backIcon={mdiArrowLeft}>
        <div class="w-full flex-1 pl-4">
          <SearchBar grayTheme={false} />
        </div>
      </ControlAppBar>
    </div>
  {/if}
</section>

{#if terms}
  <section
    id="search-chips"
    class="mt-24 text-center w-full flex gap-5 place-content-center place-items-center flex-wrap px-24"
  >
    {#each Object.keys(terms) as key, index (index)}
      <div class="flex place-content-center place-items-center text-xs">
        <div
          class="bg-immich-primary py-2 px-4 text-white dark:text-black dark:bg-immich-dark-primary
          {terms[key] === true ? 'rounded-full' : 'rounded-tl-full rounded-bl-full'}"
        >
          {getHumanReadableSearchKey(key)}
        </div>

        {#if terms[key] !== true}
          <div class="bg-gray-300 py-2 px-4 dark:bg-gray-800 dark:text-white rounded-tr-full rounded-br-full">
            {#if key === 'takenAfter' || key === 'takenBefore'}
              {getHumanReadableDate(terms[key])}
            {:else if key === 'personIds'}
              {#await getPersonName(terms[key]) then personName}
                {personName}
              {/await}
            {:else}
              {terms[key]}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </section>
{/if}

<section
  class="relative mb-12 bg-immich-bg dark:bg-immich-dark-bg m-4"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
>
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
        <GalleryViewer
          assets={searchResultAssets}
          bind:selectedAssets
          on:intersected={loadNextPage}
          showArchiveIcon={true}
          {viewport}
        />
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
