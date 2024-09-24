<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
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
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { preventRaceConditionSearchBar } from '$lib/stores/search.store';
  import { shortcut } from '$lib/actions/shortcut';
  import {
    type AssetResponseDto,
    searchSmart,
    searchMetadata,
    getPerson,
    type SmartSearchDto,
    type MetadataSearchDto,
    type AlbumResponseDto,
  } from '@immich/sdk';
  import { mdiArrowLeft, mdiDotsVertical, mdiImageOffOutline, mdiPlus, mdiSelectAll } from '@mdi/js';
  import type { Viewport } from '$lib/stores/assets.store';
  import { locale } from '$lib/stores/preferences.store';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { parseUtcDate } from '$lib/utils/date-time';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handleError } from '$lib/utils/handle-error';
  import AlbumCardGroup from '$lib/components/album-page/album-card-group.svelte';
  import { isAlbumsRoute, isPeopleRoute } from '$lib/utils/navigation';
  import { t } from 'svelte-i18n';
  import { afterUpdate, tick } from 'svelte';

  const MAX_ASSET_COUNT = 5000;
  let { isViewing: showAssetViewer } = assetViewingStore;
  const viewport: Viewport = { width: 0, height: 0 };

  // The GalleryViewer pushes it's own history state, which causes weird
  // behavior for history.back(). To prevent that we store the previous page
  // manually and navigate back to that.
  let previousRoute = AppRoute.EXPLORE as string;

  let nextPage: number | null = 1;
  let searchResultAlbums: AlbumResponseDto[] = [];
  let searchResultAssets: AssetResponseDto[] = [];
  let isLoading = true;
  let scrollY = 0;
  let scrollYHistory = 0;

  const onEscape = () => {
    if ($showAssetViewer) {
      return;
    }

    if (isMultiSelectionMode) {
      selectedAssets = new Set();
      return;
    }
    if (!$preventRaceConditionSearchBar) {
      handlePromiseError(goto(previousRoute));
    }
    $preventRaceConditionSearchBar = false;
  };

  // save and restore scroll position
  afterUpdate(() => {
    if (scrollY) {
      scrollYHistory = scrollY;
    }
  });

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from?.url && from.route.id !== $page.route.id) {
      previousRoute = from.url.href;
    }
    const route = from?.route?.id;

    if (isPeopleRoute(route)) {
      previousRoute = AppRoute.PHOTOS;
    }

    if (isAlbumsRoute(route)) {
      previousRoute = AppRoute.EXPLORE;
    }

    tick()
      .then(() => {
        window.scrollTo(0, scrollYHistory);
      })
      .catch(() => {
        // do nothing
      });
  });

  let selectedAssets: Set<AssetResponseDto> = new Set();
  $: isMultiSelectionMode = selectedAssets.size > 0;
  $: isAllArchived = [...selectedAssets].every((asset) => asset.isArchived);
  $: isAllFavorite = [...selectedAssets].every((asset) => asset.isFavorite);

  const onAssetDelete = (assetIds: string[]) => {
    const assetIdSet = new Set(assetIds);
    searchResultAssets = searchResultAssets.filter((a: AssetResponseDto) => !assetIdSet.has(a.id));
  };
  const handleSelectAll = () => {
    selectedAssets = new Set(searchResultAssets);
  };

  type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query'>;

  $: searchQuery = $page.url.searchParams.get(QueryParameter.QUERY);
  let terms: SearchTerms;
  $: terms = searchQuery ? JSON.parse(searchQuery) : {};

  $: if (terms && $featureFlags.loaded) {
    handlePromiseError(onSearchQueryUpdate());
  }

  async function onSearchQueryUpdate() {
    nextPage = 1;
    searchResultAssets = [];
    searchResultAlbums = [];
    await loadNextPage();
  }

  export const loadNextPage = async () => {
    if (!nextPage || searchResultAssets.length >= MAX_ASSET_COUNT) {
      return;
    }
    isLoading = true;

    const searchDto: SearchTerms = {
      page: nextPage,
      withExif: true,
      isVisible: true,
      ...terms,
    };

    try {
      const { albums, assets } =
        'query' in searchDto && $featureFlags.smartSearch
          ? await searchSmart({ smartSearchDto: searchDto })
          : await searchMetadata({ metadataSearchDto: searchDto });

      searchResultAlbums.push(...albums.items);
      searchResultAssets.push(...assets.items);
      searchResultAlbums = searchResultAlbums;
      searchResultAssets = searchResultAssets;

      nextPage = assets.nextPage ? Number(assets.nextPage) : null;
    } catch (error) {
      handleError(error, $t('loading_search_results_failed'));
    } finally {
      isLoading = false;
    }
  };

  function getHumanReadableDate(dateString: string) {
    const date = parseUtcDate(dateString).startOf('day');
    return date.toLocaleString(
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
      { locale: $locale },
    );
  }

  function getHumanReadableSearchKey(key: keyof SearchTerms): string {
    const keyMap: Partial<Record<keyof SearchTerms, string>> = {
      takenAfter: $t('start_date'),
      takenBefore: $t('end_date'),
      isArchived: $t('in_archive'),
      isFavorite: $t('favorite'),
      isNotInAlbum: $t('not_in_any_album'),
      type: $t('media_type'),
      query: $t('context'),
      city: $t('city'),
      country: $t('country'),
      state: $t('state'),
      make: $t('camera_brand'),
      model: $t('camera_model'),
      personIds: $t('people'),
      originalFileName: $t('file_name'),
    };
    return keyMap[key] || key;
  }

  async function getPersonName(personIds: string[]) {
    const personNames = await Promise.all(
      personIds.map(async (personId) => {
        const person = await getPerson({ id: personId });

        if (person.name == '') {
          return $t('no_name');
        }

        return person.name;
      }),
    );

    return personNames.join(', ');
  }

  const triggerAssetUpdate = () => (searchResultAssets = searchResultAssets);

  function getObjectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onEscape }} bind:scrollY />

<section>
  {#if isMultiSelectionMode}
    <div class="fixed z-[100] top-0 left-0 w-full">
      <AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
        <CreateSharedLink />
        <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} on:click={handleSelectAll} />
        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum />
          <AddToAlbum shared />
        </ButtonContextMenu>
        <FavoriteAction removeFavorite={isAllFavorite} onFavorite={triggerAssetUpdate} />

        <ButtonContextMenu icon={mdiDotsVertical} title={$t('add')}>
          <DownloadAction menuItem />
          <ChangeDate menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction menuItem unarchive={isAllArchived} onArchive={triggerAssetUpdate} />
          <DeleteAssets menuItem {onAssetDelete} />
        </ButtonContextMenu>
      </AssetSelectControlBar>
    </div>
  {:else}
    <div class="fixed z-[100] top-0 left-0 w-full">
      <ControlAppBar onClose={() => goto(previousRoute)} backIcon={mdiArrowLeft}>
        <div class="w-full flex-1 pl-4">
          <SearchBar grayTheme={false} value={terms.query ?? ''} searchQuery={terms} />
        </div>
      </ControlAppBar>
    </div>
  {/if}
</section>

<section
  id="search-chips"
  class="mt-24 text-center w-full flex gap-5 place-content-center place-items-center flex-wrap px-24"
>
  {#each getObjectKeys(terms) as key (key)}
    {@const value = terms[key]}
    <div class="flex place-content-center place-items-center text-xs">
      <div
        class="bg-immich-primary py-2 px-4 text-white dark:text-black dark:bg-immich-dark-primary
          {value === true ? 'rounded-full' : 'rounded-tl-full rounded-bl-full'}"
      >
        {getHumanReadableSearchKey(key)}
      </div>

      {#if value !== true}
        <div class="bg-gray-300 py-2 px-4 dark:bg-gray-800 dark:text-white rounded-tr-full rounded-br-full">
          {#if (key === 'takenAfter' || key === 'takenBefore') && typeof value === 'string'}
            {getHumanReadableDate(value)}
          {:else if key === 'personIds' && Array.isArray(value)}
            {#await getPersonName(value) then personName}
              {personName}
            {/await}
          {:else if value === null || value === ''}
            {$t('unknown')}
          {:else}
            {value}
          {/if}
        </div>
      {/if}
    </div>
  {/each}
</section>

<section
  class="relative mb-12 bg-immich-bg dark:bg-immich-dark-bg m-4"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
>
  <section class="immich-scrollbar relative overflow-y-auto">
    {#if searchResultAlbums.length > 0}
      <section>
        <div class="ml-6 text-4xl font-medium text-black/70 dark:text-white/80">{$t('albums').toUpperCase()}</div>
        <AlbumCardGroup albums={searchResultAlbums} showDateRange showItemCount />

        <div class="m-6 text-4xl font-medium text-black/70 dark:text-white/80">
          {$t('photos_and_videos').toUpperCase()}
        </div>
      </section>
    {/if}
    <section id="search-content" class="relative bg-immich-bg dark:bg-immich-dark-bg">
      {#if searchResultAssets.length > 0}
        <GalleryViewer
          assets={searchResultAssets}
          bind:selectedAssets
          onIntersected={loadNextPage}
          showArchiveIcon={true}
          {viewport}
        />
      {:else if !isLoading}
        <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
          <div class="flex flex-col content-center items-center text-center">
            <Icon path={mdiImageOffOutline} size="3.5em" />
            <p class="mt-5 text-3xl font-medium">{$t('no_results')}</p>
            <p class="text-base font-normal">{$t('no_results_description')}</p>
          </div>
        </div>
      {/if}

      {#if isLoading}
        <div class="flex justify-center py-16 items-center">
          <LoadingSpinner size="48" />
        </div>
      {/if}
    </section>
  </section>
</section>
