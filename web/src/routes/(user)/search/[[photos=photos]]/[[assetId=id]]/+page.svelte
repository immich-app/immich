<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import { page } from '$app/state';
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { QueryParameter } from '$lib/constants';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import type { Viewport } from '$lib/managers/timeline-manager/types';
  import { Route } from '$lib/route';
  import { getAssetBulkActions } from '$lib/services/asset.service';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { lang, locale } from '$lib/stores/preferences.store';
  import { preferences, user } from '$lib/stores/user.store';
  import { handlePromiseError } from '$lib/utils';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { parseUtcDate } from '$lib/utils/date-time';
  import { handleError } from '$lib/utils/handle-error';
  import { isAlbumsRoute, isPeopleRoute } from '$lib/utils/navigation';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    type AlbumResponseDto,
    type AssetResponseDto,
    getPerson,
    getTagById,
    type MetadataSearchDto,
    searchAssets,
    searchSmart,
    type SmartSearchDto,
  } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, Icon, IconButton, LoadingSpinner } from '@immich/ui';
  import { mdiArrowLeft, mdiDotsVertical, mdiImageOffOutline, mdiSelectAll } from '@mdi/js';
  import { tick, untrack } from 'svelte';
  import { t } from 'svelte-i18n';

  const viewport: Viewport = $state({ width: 0, height: 0 });
  let searchResultsElement: HTMLElement | undefined = $state();

  // The GalleryViewer pushes it's own history state, which causes weird
  // behavior for history.back(). To prevent that we store the previous page
  // manually and navigate back to that.
  let previousRoute = $state<string>(Route.explore());

  let nextPage = $state(1);
  let searchResultAlbums: AlbumResponseDto[] = $state([]);
  let searchResultAssets: AssetResponseDto[] = $state([]);
  let isLoading = $state(true);
  let scrollY = $state(0);
  let scrollYHistory = 0;

  const assetInteraction = new AssetInteraction();

  type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query' | 'queryAssetId'>;
  let searchQuery = $derived(page.url.searchParams.get(QueryParameter.QUERY));
  let smartSearchEnabled = $derived(featureFlagsManager.value.smartSearch);
  let terms = $derived(searchQuery ? JSON.parse(searchQuery) : {});

  const isAllUserOwned = $derived(
    $user && assetInteraction.selectedAssets.every((asset) => asset.ownerId === $user.id),
  );

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
    assetInteraction.clearMultiselect();
    onAssetDelete(assetIds);
  };

  const handleSelectAll = () => {
    assetInteraction.selectAssets(searchResultAssets.map((asset) => toTimelineAsset(asset)));
  };

  async function onSearchQueryUpdate() {
    nextPage = 1;
    searchResultAssets = [];
    searchResultAlbums = [];
    await loadNextPage(true);
  }

  // eslint-disable-next-line svelte/valid-prop-names-in-kit-pages
  export const loadNextPage = async (force?: boolean) => {
    if (!nextPage || (isLoading && !force)) {
      return;
    }
    isLoading = true;

    const searchDto: SearchTerms = {
      page: nextPage,
      withExif: true,
      isVisible: true,
      language: $lang,
      ...terms,
    };

    try {
      const { albums, assets } =
        ('query' in searchDto || 'queryAssetId' in searchDto) && smartSearchEnabled
          ? await searchSmart({ smartSearchDto: searchDto })
          : await searchAssets({ metadataSearchDto: searchDto });

      searchResultAlbums.push(...albums.items);
      searchResultAssets.push(...assets.items);

      nextPage = Number(assets.nextPage) || 0;
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
      visibility: $t('in_archive'),
      isFavorite: $t('favorite'),
      isNotInAlbum: $t('not_in_any_album'),
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
      originalFileName: $t('file_name_text'),
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

        if (person.name == '') {
          return $t('no_name');
        }

        return person.name;
      }),
    );

    return personNames.join(', ');
  }

  async function getTagNames(tagIds: string[] | null) {
    if (tagIds === null) {
      return $t('untagged');
    }
    const tagNames = await Promise.all(
      tagIds.map(async (tagId) => {
        const tag = await getTagById({ id: tagId });

        return tag.value;
      }),
    );

    return tagNames.join(', ');
  }

  const onAlbumAddAssets = ({ assetIds }: { assetIds: string[] }) => {
    cancelMultiselect(assetInteraction);

    if (terms.isNotInAlbum.toString() == 'true') {
      const assetIdSet = new Set(assetIds);
      searchResultAssets = searchResultAssets.filter((asset) => !assetIdSet.has(asset.id));
    }
  };

  function getObjectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }
</script>

<svelte:window bind:scrollY />

<OnEvents {onAlbumAddAssets} />

{#if terms}
  <section
    id="search-chips"
    class="mt-24 text-center w-full flex gap-5 place-content-center place-items-center flex-wrap px-24"
  >
    {#each getObjectKeys(terms) as searchKey (searchKey)}
      {@const value = terms[searchKey]}
      <div class="flex place-content-center place-items-center items-stretch text-xs">
        <div
          class="flex items-center justify-center bg-immich-primary py-2 px-4 text-white dark:text-black dark:bg-immich-dark-primary
          {value === true ? 'rounded-full' : 'rounded-s-full'}"
        >
          {getHumanReadableSearchKey(searchKey as keyof SearchTerms)}
        </div>

        {#if value !== true}
          <div class="bg-gray-300 py-2 px-4 dark:bg-gray-800 dark:text-white rounded-e-full">
            {#if (searchKey === 'takenAfter' || searchKey === 'takenBefore') && typeof value === 'string'}
              {getHumanReadableDate(value)}
            {:else if searchKey === 'personIds' && Array.isArray(value)}
              {#await getPersonName(value) then personName}
                {personName}
              {/await}
            {:else if searchKey === 'tagIds' && (Array.isArray(value) || value === null)}
              {#await getTagNames(value) then tagNames}
                {tagNames}
              {/await}
            {:else if searchKey === 'rating'}
              {$t('rating_count', { values: { count: value ?? 0 } })}
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
{/if}

<section
  class="mb-12 bg-immich-bg dark:bg-immich-dark-bg m-4 max-h-screen"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
  bind:this={searchResultsElement}
>
  <section id="search-content">
    {#if searchResultAssets.length > 0}
      <GalleryViewer
        assets={searchResultAssets}
        {assetInteraction}
        onIntersected={loadNextPage}
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
      <div class="flex justify-center py-16 items-center">
        <LoadingSpinner size="giant" />
      </div>
    {/if}
  </section>

  <section>
    {#if assetInteraction.selectionActive}
      <div class="fixed top-0 start-0 w-full z-2">
        <AssetSelectControlBar
          assets={assetInteraction.selectedAssets}
          clearSelect={() => cancelMultiselect(assetInteraction)}
        >
          {@const Actions = getAssetBulkActions($t, assetInteraction.asControlContext())}
          <CommandPaletteDefaultProvider name={$t('assets')} actions={Object.values(Actions)} />

          <CreateSharedLink />
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={$t('select_all')}
            icon={mdiSelectAll}
            onclick={handleSelectAll}
          />
          <ActionButton action={Actions.AddToAlbum} />
          {#if isAllUserOwned}
            <FavoriteAction
              removeFavorite={assetInteraction.isAllFavorite}
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
              <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} />
              {#if assetInteraction.isAllUserOwned}
                <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
              {/if}
              {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
                <TagAction menuItem />
              {/if}
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
      <div class="fixed top-0 start-0 w-full z-2">
        <ControlAppBar onClose={() => goto(previousRoute)} backIcon={mdiArrowLeft}>
          <div class="absolute bg-light"></div>
          <div class="w-full flex-1 ps-4">
            <SearchBar grayTheme={false} value={terms?.query ?? ''} searchQuery={terms} />
          </div>
        </ControlAppBar>
      </div>
    {/if}
  </section>
</section>
