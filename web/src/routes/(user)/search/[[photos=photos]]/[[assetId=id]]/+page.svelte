<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/ButtonContextMenu.svelte';
  import ControlAppBar from '$lib/components/shared-components/ControlAppBar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/GalleryViewer.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/SearchBar.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { QueryParameter } from '$lib/constants';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import type { Viewport } from '$lib/managers/timeline-manager/types';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import type { SearchQuery } from '$lib/types';
  import { lang, locale } from '$lib/stores/preferences.store';
  import { handlePromiseError } from '$lib/utils';
  import { parseUtcDate } from '$lib/utils/date-time';
  import { handleError } from '$lib/utils/handle-error';
  import { isAlbumsRoute, isPeopleRoute } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    type AlbumResponseDto,
    type AssetResponseDto,
    AssetVisibility,
    getPerson,
    getTagById,
    type SearchFilter,
    searchAssets,
    searchSmart,
  } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, Icon, IconButton, LoadingSpinner } from '@immich/ui';
  import { isEmpty } from 'lodash-es';
  import { mdiArrowLeft, mdiClose, mdiDotsVertical, mdiImageOffOutline, mdiSelectAll } from '@mdi/js';
  import { onMount, tick, untrack } from 'svelte';
  import { t } from 'svelte-i18n';

  const viewport: Viewport = $state({ width: 0, height: 0 });
  let searchResultsElement: HTMLElement | undefined = $state();

  // The GalleryViewer pushes it's own history state, which causes weird
  // behavior for history.back(). To prevent that we store the previous page
  // manually and navigate back to that.
  let previousRoute = $state<string>(Route.explore());

  // undefined before the first page, null once the results are exhausted
  let nextCursor = $state<string | null>();
  let searchResultAlbums: AlbumResponseDto[] = $state([]);
  let searchResultAssets: AssetResponseDto[] = $state([]);
  let isLoading = $state(true);
  let scrollY = $state(0);
  let scrollYHistory = 0;

  let searchQuery = $derived(page.url.searchParams.get(QueryParameter.QUERY));
  let smartSearchEnabled = $derived(featureFlagsManager.value.smartSearch);
  let terms = $derived<SearchQuery>(searchQuery ? JSON.parse(searchQuery) : {});

  // takenAt is split into one chip per bound so each can be removed on its own
  type SearchTermKey = 'query' | 'queryAssetId' | 'takenAfter' | 'takenBefore' | keyof SearchFilter;
  let searchTermKeys = $derived<SearchTermKey[]>([
    ...(['query', 'queryAssetId'] as const).filter((key) => terms[key] !== undefined),
    ...getObjectKeys(terms.filter ?? {}).flatMap((key) => (key === 'takenAt' ? getDateKeys() : [key])),
  ]);

  function getDateKeys(): SearchTermKey[] {
    const { gte, lte } = terms.filter?.takenAt ?? {};
    const keys: SearchTermKey[] = [];
    if (gte) {
      keys.push('takenAfter');
    }
    if (lte) {
      keys.push('takenBefore');
    }
    return keys.length > 0 ? keys : ['takenAt'];
  }

  $effect(() => {
    // we want this to *only* be reactive on `terms`
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    terms;
    untrack(() => handlePromiseError(onSearchQueryUpdate()));
  });

  $effect(() => {
    if (scrollY) {
      scrollYHistory = scrollY;
    }
  });

  afterNavigate(({ from }) => {
    // Prevent setting previousRoute to the current page.
    if (from?.url && from.route.id !== page.route.id) {
      previousRoute = from.url.href;
    }
    const route = from?.route?.id;

    if (isPeopleRoute(route)) {
      previousRoute = Route.photos();
    }

    if (isAlbumsRoute(route)) {
      previousRoute = Route.explore();
    }

    tick()
      .then(() => {
        window.scrollTo(0, scrollYHistory);
      })
      .catch(() => {
        // do nothing
      });
  });

  const onAssetDelete = (assetIds: string[]) => {
    const assetIdSet = new Set(assetIds);
    searchResultAssets = searchResultAssets.filter((asset: AssetResponseDto) => !assetIdSet.has(asset.id));
  };

  const handleSetVisibility = (assetIds: string[]) => {
    assetMultiSelectManager.clear();
    onAssetDelete(assetIds);
  };

  const handleSelectAll = () => {
    assetMultiSelectManager.selectAssets(searchResultAssets.map((asset) => toTimelineAsset(asset)));
  };

  async function onSearchQueryUpdate() {
    nextCursor = undefined;
    searchResultAssets = [];
    searchResultAlbums = [];
    await loadNextPage(true);
  }

  // eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
  export const loadNextPage = async (force?: boolean) => {
    if (nextCursor === null || (isLoading && !force)) {
      return;
    }
    isLoading = true;

    const { query, queryAssetId, filter } = terms;
    const searchDto = {
      filter: { visibility: { eq: AssetVisibility.Timeline }, trashedAt: { eq: null }, ...filter },
      cursor: nextCursor,
      withExif: true,
    };

    try {
      const { albums, assets } =
        (query || queryAssetId) && smartSearchEnabled
          ? await searchSmart({ smartSearchDto: { ...searchDto, query, queryAssetId, language: $lang } })
          : await searchAssets({ metadataSearchDto: searchDto });

      searchResultAlbums.push(...albums.items);
      searchResultAssets.push(...assets.items);

      nextCursor = assets.nextCursor;
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

  function getHumanReadableSearchKey(key: SearchTermKey): string {
    const keyMap: Partial<Record<SearchTermKey, string>> = {
      takenAfter: $t('start_date'),
      takenBefore: $t('end_date'),
      visibility: $t('in_archive'),
      isFavorite: $t('favorite'),
      hasAlbums: $t('not_in_any_album'),
      type: $t('media_type'),
      query: $t('context'),
      city: $t('city'),
      country: $t('country'),
      state: $t('state'),
      make: $t('camera_brand'),
      model: $t('camera_model'),
      lensModel: $t('lens_model'),
      personIds: $t('people'),
      tagIds: $t('tags'),
      hasTags: $t('tags'),
      originalFileName: $t('file_name_text'),
      originalPath: $t('full_path_or_folder'),
      description: $t('description'),
      queryAssetId: $t('query_asset_id'),
      ocr: $t('ocr'),
    };
    return keyMap[key] || key;
  }

  async function getPersonName(personIds: string[]) {
    const personNames = await Promise.all(
      personIds.map(async (personId) => {
        const person = await getPerson({ id: personId });

        if (person.name === '') {
          return $t('no_name');
        }

        return person.name;
      }),
    );

    return personNames.join(', ');
  }

  async function getTagNames(tagIds: string[]) {
    const tagNames = await Promise.all(
      tagIds.map(async (tagId) => {
        const tag = await getTagById({ id: tagId });

        return tag.value;
      }),
    );

    return tagNames.join(', ');
  }

  const onAlbumAddAssets = ({ assetIds }: { assetIds: string[] }) => {
    assetMultiSelectManager.clear();

    if (terms.filter?.hasAlbums?.eq === false) {
      const assetIdSet = new Set(assetIds);
      searchResultAssets = searchResultAssets.filter((asset) => !assetIdSet.has(asset.id));
    }
  };

  function getObjectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }

  function getSearchTermValue(key: SearchTermKey): string | Promise<string> | undefined {
    const filter = terms.filter ?? {};
    switch (key) {
      case 'query':
      case 'queryAssetId': {
        return terms[key];
      }
      case 'takenAfter': {
        return filter.takenAt?.gte ? getHumanReadableDate(filter.takenAt.gte) : undefined;
      }
      case 'takenBefore': {
        return filter.takenAt?.lte ? getHumanReadableDate(filter.takenAt.lte) : undefined;
      }
      case 'personIds': {
        return getPersonName(filter.personIds?.all ?? []);
      }
      case 'tagIds': {
        return getTagNames(filter.tagIds?.all ?? []);
      }
      case 'hasTags': {
        return $t('untagged');
      }
      case 'rating': {
        return $t('rating_count', { values: { count: filter.rating?.eq ?? 0 } });
      }
      case 'isFavorite':
      case 'hasAlbums': {
        return;
      }
      default: {
        const condition = filter[key] as { eq?: unknown; like?: string; matches?: string } | undefined;
        if (condition?.eq === null) {
          return $t('unknown');
        }
        const value = condition?.eq ?? condition?.like ?? condition?.matches;
        return value === undefined ? undefined : String(value);
      }
    }
  }

  function removeFilter(key: SearchTermKey) {
    if (key === 'query' || key === 'queryAssetId') {
      delete terms[key];
    } else if (key === 'takenAfter' || key === 'takenBefore') {
      const takenAt = terms.filter?.takenAt;
      delete takenAt?.[key === 'takenAfter' ? 'gte' : 'lte'];
      if (terms.filter && isEmpty(takenAt)) {
        delete terms.filter.takenAt;
      }
    } else {
      delete terms.filter?.[key];
    }
    assetMultiSelectManager.clear();
    void goto(Route.search(terms));
    searchManager.setQuery(terms);
  }

  onMount(() => searchManager.setQuery(terms));
</script>

<svelte:window bind:scrollY />

<OnEvents {onAlbumAddAssets} />

{#if searchTermKeys.length > 0}
  <section id="search-chips" class="mx-auto mt-24 w-full max-w-7xl px-4 sm:px-8 lg:px-12">
    <div class="flex w-full flex-wrap place-content-center place-items-center gap-2.5 sm:gap-3">
      {#each searchTermKeys as searchKey (searchKey)}
        {@const value = getSearchTermValue(searchKey)}
        <div
          class="inline-flex max-w-full items-center rounded-full bg-primary/10 py-1 ps-1 pe-1 text-xs text-primary ring-1 ring-primary/15 transition-shadow hover:ring-primary/25 dark:bg-immich-dark-primary/15 dark:text-immich-dark-primary dark:ring-immich-dark-primary/20 dark:hover:ring-immich-dark-primary/30"
        >
          <span
            class="shrink-0 rounded-full bg-primary px-3 py-1.5 font-medium text-light dark:bg-immich-dark-primary dark:text-immich-dark-gray"
          >
            {getHumanReadableSearchKey(searchKey)}
          </span>

          {#if value !== undefined}
            <span class="max-w-[min(36rem,55vw)] min-w-0 truncate px-3 py-1.5 text-immich-fg dark:text-immich-dark-fg">
              {#await value then text}
                {text}
              {/await}
            </span>
          {/if}

          <button
            type="button"
            class="ms-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-primary outline-offset-2 outline-immich-primary transition-colors hover:bg-primary/15 focus-visible:outline-2 dark:text-immich-dark-primary dark:outline-immich-dark-primary dark:hover:bg-immich-dark-primary/20"
            aria-label={$t('remove_filter')}
            title={$t('remove_filter')}
            onclick={() => removeFilter(searchKey)}
          >
            <Icon icon={mdiClose} size="14" />
          </button>
        </div>
      {/each}
    </div>
  </section>
{/if}

<section
  class="m-4 mb-12 max-h-screen bg-immich-bg dark:bg-immich-dark-bg"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
  bind:this={searchResultsElement}
>
  <section id="search-content">
    {#if searchResultAssets.length > 0}
      <GalleryViewer
        assets={searchResultAssets}
        assetInteraction={assetMultiSelectManager}
        onEndReached={loadNextPage}
        showArchiveIcon={true}
        {viewport}
        onReload={onSearchQueryUpdate}
        slidingWindowOffset={searchResultsElement.offsetTop}
      />
    {:else if !isLoading}
      <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
        <div class="flex flex-col content-center items-center text-center">
          <Icon icon={mdiImageOffOutline} size="3.5em" />
          <p class="mt-5 text-3xl font-medium">{$t('no_results')}</p>
          <p class="text-base font-normal">{$t('no_results_description')}</p>
        </div>
      </div>
    {/if}

    {#if isLoading}
      <div class="flex items-center justify-center py-16">
        <LoadingSpinner size="giant" />
      </div>
    {/if}
  </section>

  <section>
    {#if assetMultiSelectManager.selectionActive}
      <div class="fixed inset-s-0 top-0 z-2 w-full">
        <AssetSelectControlBar>
          {@const Actions = getAssetBulkActions($t)}
          <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />

          <ActionButton action={Actions.CreateSharedLink} />
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={$t('select_all')}
            icon={mdiSelectAll}
            onclick={handleSelectAll}
          />
          <ActionButton action={Actions.AddToAlbum} />
          {#if assetMultiSelectManager.isAllUserOwned}
            <FavoriteAction
              removeFavorite={assetMultiSelectManager.isAllFavorite}
              onFavorite={(ids, isFavorite) => {
                for (const id of ids) {
                  const asset = searchResultAssets.find((asset) => asset.id === id);
                  if (asset) {
                    asset.isFavorite = isFavorite;
                  }
                }
              }}
            />

            <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
              <ActionMenuItem action={Actions.AddToAlbum} />
              <DownloadAction menuItem />
              <ChangeDate menuItem />
              <ChangeDescription menuItem />
              <ChangeLocation menuItem />
              <ArchiveAction menuItem unarchive={assetMultiSelectManager.isAllArchived} />
              <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
              <ActionMenuItem action={Actions.Tag} />
              <DeleteAssets menuItem {onAssetDelete} onUndoDelete={onSearchQueryUpdate} />
              <hr />
              <ActionMenuItem action={Actions.RegenerateThumbnailJob} />
              <ActionMenuItem action={Actions.RefreshMetadataJob} />
              <ActionMenuItem action={Actions.TranscodeVideoJob} />
            </ButtonContextMenu>
          {:else}
            <DownloadAction />
          {/if}
        </AssetSelectControlBar>
      </div>
    {:else}
      <div class="fixed inset-s-0 top-0 z-2 w-full">
        <ControlAppBar onClose={() => goto(previousRoute)} backIcon={mdiArrowLeft}>
          <div class="mx-auto w-full max-w-2xl pe-2">
            <SearchBar grayTheme={false} />
          </div>
        </ControlAppBar>
      </div>
    {/if}
  </section>
</section>
