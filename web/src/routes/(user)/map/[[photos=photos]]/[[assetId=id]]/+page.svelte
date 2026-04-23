<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import ActiveFiltersBar from '$lib/components/filter-panel/active-filters-bar.svelte';
  import FilterPanel from '$lib/components/filter-panel/filter-panel.svelte';
  import { clearFilters, createFilterState, getActiveFilterCount } from '$lib/components/filter-panel/filter-panel';
  import type { FilterState } from '$lib/components/filter-panel/filter-panel';
  import { handlePhotosRemoveFilter } from '$lib/utils/photos-filter-options';
  import { buildMapMarkerOptions, buildMapTimeBucketOptions } from '$lib/utils/map-filter-options';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import MapTimelinePanel from './MapTimelinePanel.svelte';
  import type { SelectionBBox } from '$lib/components/shared-components/map/types';
  import { QueryParameter, timeToLoadTheMap } from '$lib/constants';
  import Portal from '$lib/elements/Portal.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { handlePromiseError } from '$lib/utils';
  import { delay } from '$lib/utils/asset-utils';
  import { buildMapFilterConfig } from '$lib/utils/map-filter-config';
  import { navigate } from '$lib/utils/navigation';
  import { getFilteredMapMarkers, getTimeBuckets, type MapMarkerResponseDto } from '@immich/sdk';
  import { Icon, IconButton } from '@immich/ui';
  import { SvelteMap } from 'svelte/reactivity';
  import { mdiArrowLeft, mdiFilterVariant } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';
  import LoadingSpinner from '$lib/components/shared-components/LoadingSpinner.svelte';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  const spaceId = $derived($page.url.searchParams.get(QueryParameter.SPACE_ID) || undefined);

  let selectedClusterIds = $state.raw(new Set<string>());
  let selectedClusterBBox = $state.raw<SelectionBBox>();
  let isTimelinePanelVisible = $state(false);
  let showMobileFilters = $state(false);
  let isMobile = $state(false);

  function checkMobile() {
    isMobile = window.innerWidth < 640;
    if (!isMobile) {
      showMobileFilters = false;
    }
  }

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  // Filter state
  let filters = $state<FilterState>(createFilterState());
  let mapMarkers = $state<MapMarkerResponseDto[]>([]);
  let timeBuckets = $state<Array<{ timeBucket: string; count: number }>>([]);
  let personNames = new SvelteMap<string, string>();
  let tagNames = new SvelteMap<string, string>();

  const filterConfig = $derived.by(() => {
    const base = buildMapFilterConfig(spaceId);
    const originalProvider = base.suggestionsProvider!;
    return {
      ...base,
      suggestionsProvider: async (f: FilterState) => {
        const result = await originalProvider(f);
        for (const p of result.people) {
          personNames.set(p.id, p.name);
        }
        for (const t of result.tags) {
          tagNames.set(t.id, t.name);
        }
        return result;
      },
    };
  });
  const hasActiveFilters = $derived(getActiveFilterCount(filters) > 0);
  const noResults = $derived(mapMarkers.length === 0 && hasActiveFilters);
  const timeBucketOptions = $derived.by(() => buildMapTimeBucketOptions(filters, spaceId));
  const mapMarkerOptions = $derived.by(() => buildMapMarkerOptions(filters, spaceId));

  // Fetch time buckets for the temporal picker
  $effect(() => {
    void getTimeBuckets(timeBucketOptions).then((buckets) => {
      timeBuckets = buckets.map((b) => ({ timeBucket: b.timeBucket, count: b.count }));
    });
  });

  // Debounced marker fetch when filters change
  let fetchTimeout: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    // Read the derived options before the debounce callback so filter changes
    // are tracked as dependencies of this effect.
    const options = mapMarkerOptions;

    clearTimeout(fetchTimeout);
    fetchTimeout = setTimeout(() => {
      void getFilteredMapMarkers(options)
        .then((result) => {
          mapMarkers = result;
        })
        .catch((error: unknown) => {
          console.error('Failed to fetch filtered map markers:', error);
        });
    }, 200);

    return () => clearTimeout(fetchTimeout);
  });

  function closeTimelinePanel() {
    isTimelinePanelVisible = false;
    selectedClusterBBox = undefined;
    selectedClusterIds = new Set();
  }

  onDestroy(() => {
    assetViewerManager.showAssetViewer(false);
  });

  if (!featureFlagsManager.value.map) {
    handlePromiseError(goto(Route.photos()));
  }

  async function onViewAssets(assetIds: string[]) {
    await assetViewerManager.setAssetId(assetIds[0]);
    closeTimelinePanel();
  }

  function onClusterSelect(assetIds: string[], bbox: SelectionBBox) {
    selectedClusterIds = new Set(assetIds);
    selectedClusterBBox = bbox;
    isTimelinePanelVisible = true;
    assetViewerManager.showAssetViewer(false);
    handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
  }
</script>

{#if featureFlagsManager.value.map}
  <UserPageLayout title={data.meta.title}>
    {#snippet leading()}
      {#if spaceId}
        <IconButton
          variant="ghost"
          shape="round"
          color="secondary"
          aria-label={$t('back')}
          onclick={() => goto(`/spaces/${spaceId}`)}
          icon={mdiArrowLeft}
        />
      {/if}
      {#if isMobile}
        <button type="button" onclick={() => (showMobileFilters = !showMobileFilters)}>
          <Icon icon={mdiFilterVariant} size="24" />
        </button>
      {/if}
    {/snippet}
    <OnEvents
      onAssetsDelete={() => {
        filters = { ...filters };
      }}
    />
    <div class="isolate flex h-full w-full">
      {#if !isMobile}
        <FilterPanel
          bind:filters
          config={filterConfig}
          {timeBuckets}
          storageKey="gallery-filter-visible-sections-map"
        />
      {/if}
      {#if isMobile && showMobileFilters}
        <div class="fixed inset-0 z-30">
          <button
            type="button"
            class="absolute inset-0 bg-black/50"
            aria-label="Close filters"
            onclick={() => (showMobileFilters = false)}
          ></button>
          <div class="absolute inset-y-0 left-0 w-72 bg-light shadow-xl dark:bg-immich-dark-bg">
            <FilterPanel
              bind:filters
              config={filterConfig}
              {timeBuckets}
              storageKey="gallery-filter-visible-sections-map"
              persistCollapsed={false}
            />
          </div>
        </div>
      {/if}
      <div class="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row">
        {#if hasActiveFilters}
          <div class="absolute top-0 right-0 left-0 z-10 sm:left-[280px]">
            <ActiveFiltersBar
              {filters}
              resultCount={mapMarkers.length}
              {personNames}
              {tagNames}
              onRemoveFilter={(type, id) => {
                filters = handlePhotosRemoveFilter(filters, type, id);
              }}
              onClearAll={() => {
                filters = clearFilters(filters);
              }}
            />
          </div>
        {/if}
        <div
          class={[
            'relative min-h-0',
            isTimelinePanelVisible ? 'h-1/2 w-full pb-2 sm:h-full sm:w-2/3 sm:pe-2 sm:pb-0' : 'h-full w-full',
          ]}
        >
          {#await import('$lib/components/shared-components/map/map.svelte')}
            {#await delay(timeToLoadTheMap) then}
              <div class="flex items-center justify-center h-full w-full">
                <LoadingSpinner />
              </div>
            {/await}
          {:then { default: Map }}
            <Map hash onSelect={onViewAssets} {onClusterSelect} {spaceId} showSettings={false} {mapMarkers} />
          {/await}
          {#if noResults}
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                class="pointer-events-auto rounded-lg bg-white/90 px-4 py-3 text-sm text-gray-600 shadow dark:bg-gray-800/90 dark:text-gray-300"
              >
                No matching photos
              </div>
            </div>
          {/if}
        </div>

        {#if isTimelinePanelVisible && selectedClusterBBox}
          <div class="h-1/2 min-h-0 w-full pt-2 sm:h-full sm:w-1/3 sm:ps-2 sm:pt-0">
            <MapTimelinePanel
              bbox={selectedClusterBBox}
              {selectedClusterIds}
              assetCount={selectedClusterIds.size}
              onClose={closeTimelinePanel}
              {spaceId}
              {filters}
            />
          </div>
        {/if}
      </div>
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if assetViewerManager.isViewing}
      {#await import('$lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          cursor={{ current: assetViewerManager.asset! }}
          showNavigation={false}
          onClose={() => {
            assetViewerManager.showAssetViewer(false);
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>
{/if}
