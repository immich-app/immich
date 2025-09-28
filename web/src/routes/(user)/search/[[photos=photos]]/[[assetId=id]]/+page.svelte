<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { shortcut } from '$lib/actions/shortcut';
  import SearchResults from '$lib/components/search/SearchResults.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import SearchBar from '$lib/components/shared-components/search-bar/search-bar.svelte';
  import AddToAlbum from '$lib/components/timeline/actions/AddToAlbumAction.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import AssetJobActions from '$lib/components/timeline/actions/AssetJobActions.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescriptionAction from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';

  import { AppRoute, QueryParameter } from '$lib/constants';
  import type {
    PhotostreamSegment,
    SegmentIdentifier,
  } from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
  import { SearchResultsManager } from '$lib/managers/searchresults-manager/SearchResultsManager.svelte';
  import type { TimelineAsset, Viewport } from '$lib/managers/timeline-manager/types';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { locale } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { preferences } from '$lib/stores/user.store';
  import { cancelMultiselect } from '$lib/utils/asset-utils';
  import { parseUtcDate } from '$lib/utils/date-time';
  import { getPerson, getTagById, type MetadataSearchDto, type SmartSearchDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiArrowLeft, mdiDotsVertical, mdiPlus, mdiSelectAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  let { isViewing: showAssetViewer } = assetViewingStore;
  const viewport: Viewport = $state({ width: 0, height: 0 });

  let previousRoute = $state(AppRoute.EXPLORE as string);

  const assetInteraction = new AssetInteraction();

  type SearchTerms = MetadataSearchDto & Pick<SmartSearchDto, 'query' | 'queryAssetId'>;
  let searchQuery = $derived(page.url.searchParams.get(QueryParameter.QUERY));
  let isSmartSearchEnabled = $derived($featureFlags.loaded && $featureFlags.smartSearch);
  let terms = $derived(searchQuery ? JSON.parse(searchQuery) : {});

  const searchResultsManager = new SearchResultsManager();

  $effect(() => {
    void searchResultsManager.updateOptions({ isSmartSearchEnabled, searchTerms: terms });
  });

  const onEscape = () => {
    if ($showAssetViewer) {
      return;
    }

    if (assetInteraction.selectionActive) {
      assetInteraction.selectedAssets = [];
      return;
    }
  };

  const restoreMap = new SvelteMap<string, SegmentIdentifier>();

  const onAssetDelete = async (assetIds: string[]) => {
    for (const id of assetIds) {
      const segment = await searchResultsManager.findSegmentForAssetId(id);
      if (segment) {
        restoreMap.set(id, segment.identifier);
      }
    }
    searchResultsManager.removeAssets(assetIds);
  };

  const onUndoDelete = (assets: TimelineAsset[]) => {
    const segments: PhotostreamSegment[] = [];
    for (const asset of assets) {
      const segmentIdentifier = restoreMap.get(asset.id);
      if (segmentIdentifier) {
        const segment = searchResultsManager.getSegmentByIdentifier(segmentIdentifier);
        if (segment) {
          segments.push(segment);
        }
      }
    }
    for (const segment of segments) {
      void segment.reload(false);
    }
  };

  const handleSetVisibility = (assetIds: string[]) => {
    searchResultsManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };

  const handleSelectAll = () => {
    const allAssets = searchResultsManager.months.flatMap((segment) => segment.assets);
    assetInteraction.selectAssets(allAssets);
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
      originalFileName: $t('file_name'),
      description: $t('description'),
      queryAssetId: $t('query_asset_id'),
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

  const onAddToAlbum = (assetIds: string[]) => {
    cancelMultiselect(assetInteraction);

    if (terms.isNotInAlbum.toString() == 'true') {
      searchResultsManager.removeAssets(assetIds);
    }
  };

  function getObjectKeys<T extends object>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
  }
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Escape' }, onShortcut: onEscape }} />

<section>
  {#if assetInteraction.selectionActive}
    <div class="fixed z-1 top-0 start-0 w-full">
      <AssetSelectControlBar
        assets={assetInteraction.selectedAssets}
        clearSelect={() => cancelMultiselect(assetInteraction)}
      >
        <CreateSharedLink />
        <IconButton
          shape="round"
          color="secondary"
          variant="ghost"
          aria-label={$t('select_all')}
          icon={mdiSelectAll}
          onclick={handleSelectAll}
        />
        <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
          <AddToAlbum {onAddToAlbum} />
          <AddToAlbum shared {onAddToAlbum} />
        </ButtonContextMenu>
        <FavoriteAction removeFavorite={assetInteraction.isAllFavorite} />

        <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
          <DownloadAction menuItem />
          <ChangeDate menuItem />
          <ChangeLocation menuItem />
          <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} />
          {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
            <TagAction menuItem />
          {/if}
          <DeleteAssets menuItem {onAssetDelete} {onUndoDelete} />
          <hr />
          <AssetJobActions />
        </ButtonContextMenu>
      </AssetSelectControlBar>
    </div>
  {:else}
    <div class="fixed z-1 top-0 start-0 w-full">
      <ControlAppBar onClose={() => goto(previousRoute)} backIcon={mdiArrowLeft}>
        <div class="absolute bg-light"></div>
        <div class="w-full flex-1 ps-4">
          <SearchBar grayTheme={false} value={terms?.query ?? ''} searchQuery={terms} />
        </div>
      </ControlAppBar>
    </div>
  {/if}
</section>

<section
  class="absolute top-0 right-0 left-0 bottom-0 mb-0 bg-immich-bg dark:bg-immich-dark-bg max-h-screen"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
>
  <SearchResults {searchResultsManager} {assetInteraction} stylePaddingHorizontalPx={16}>
    {#if terms}
      <section
        id="search-chips"
        class="md:mt-[94px] mt-[72px] mb-4 text-center w-full flex gap-5 place-content-center place-items-center flex-wrap"
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
  </SearchResults>

  <section>
    {#if assetInteraction.selectionActive}
      <div class="fixed z-1 top-0 start-0 w-full">
        <AssetSelectControlBar
          assets={assetInteraction.selectedAssets}
          clearSelect={() => cancelMultiselect(assetInteraction)}
        >
          <CreateSharedLink />
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            aria-label={$t('select_all')}
            icon={mdiSelectAll}
            onclick={handleSelectAll}
          />
          <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
            <AddToAlbum {onAddToAlbum} />
            <AddToAlbum shared {onAddToAlbum} />
          </ButtonContextMenu>
          <FavoriteAction removeFavorite={assetInteraction.isAllFavorite} />

          <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
            <DownloadAction menuItem />
            <ChangeDate menuItem />
            <ChangeDescriptionAction menuItem />
            <ChangeLocation menuItem />
            <ArchiveAction menuItem unarchive={assetInteraction.isAllArchived} />
            {#if assetInteraction.isAllUserOwned}
              <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
            {/if}
            {#if $preferences.tags.enabled && assetInteraction.isAllUserOwned}
              <TagAction menuItem />
            {/if}
            <DeleteAssets menuItem {onAssetDelete} {onUndoDelete} />
            <hr />
            <AssetJobActions />
          </ButtonContextMenu>
        </AssetSelectControlBar>
      </div>
    {:else}
      <div class="fixed z-1 top-0 start-0 w-full">
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
