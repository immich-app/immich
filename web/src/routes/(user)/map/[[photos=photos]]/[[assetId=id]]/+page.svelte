<script lang="ts">
  import { run } from 'svelte/legacy';

  import { goto } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MapSettingsModal from '$lib/components/map-page/map-settings-modal.svelte';
  import Map from '$lib/components/shared-components/map/map.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { MapSettings } from '$lib/stores/preferences.store';
  import { mapSettings } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getMapMarkers, type MapMarkerResponseDto } from '@immich/sdk';
  import { isEqual } from 'lodash-es';
  import { DateTime, Duration } from 'luxon';
  import { onDestroy, onMount } from 'svelte';
  import type { PageData } from './$types';
  import { handlePromiseError } from '$lib/utils';
  import { navigate } from '$lib/utils/navigation';
  import { AssetStore } from '$lib/stores/assets.store';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import { page } from '$app/stores';
  import { t } from 'svelte-i18n';
  import { mdiArrowDown, mdiArrowUp } from '@mdi/js';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { MapBounds } from '$lib/models/map';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, setAssetId } = assetViewingStore;

  let abortController: AbortController;
  let mapMarkers: MapMarkerResponseDto[] = $state([]);
  let viewingAssets: string[] = $state([]);
  let viewingAssetCursor = 0;
  let showSettingsModal = $state(false);
  let isAssetGridOpenedOnInit = data.isTimelineOpened;
  let isAssetGridOpened = $state(isAssetGridOpenedOnInit);

  let bounds: MapBounds = $state({
    boundWest: undefined,
    boundEast: undefined,
    boundSouth: undefined,
    boundNorth: undefined,
  });
  let numberOfAssets: number | undefined = $state(undefined);

  let timelineStore: AssetStore | undefined = $derived.by(() => {
    return bounds.boundWest && bounds.boundEast && bounds.boundSouth && bounds.boundNorth
      ? new AssetStore({
          isArchived: false,
          withPartners: $mapSettings.withPartners,
          isFavorite: false,
          x1: bounds.boundWest,
          x2: bounds.boundEast,
          y1: bounds.boundSouth,
          y2: bounds.boundNorth,
        })
      : undefined;
  });

  const timelineInteraction = new AssetInteraction();

  let currentAssets: MapMarkerResponseDto[] = [];

  let mapContainer: HTMLElement | undefined = $state(undefined);

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController?.abort();
    assetViewingStore.showAssetViewer(false);
  });

  run(() => {
    if (!$featureFlags.map) {
      handlePromiseError(goto(AppRoute.PHOTOS));
    }
  });
  const omit = (obj: MapSettings, key: string) => {
    return Object.fromEntries(Object.entries(obj).filter(([k]) => k !== key));
  };

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    const { includeArchived, onlyFavorites, withPartners, withSharedAlbums } = $mapSettings;
    const { fileCreatedAfter, fileCreatedBefore } = getFileCreatedDates();

    return await getMapMarkers(
      {
        isArchived: includeArchived && undefined,
        isFavorite: onlyFavorites || undefined,
        fileCreatedAfter: fileCreatedAfter || undefined,
        fileCreatedBefore,
        withPartners: withPartners || undefined,
        withSharedAlbums: withSharedAlbums || undefined,
      },
      {
        signal: abortController.signal,
      },
    );
  }

  const toggleAssetGrid = async () => {
    const currentUrl = new URL($page.url);

    isAssetGridOpened = !isAssetGridOpened;

    if (isAssetGridOpened) {
      currentUrl.searchParams.set(QueryParameter.IS_TIMELINE_OPENED, isAssetGridOpened.toString());
    } else {
      // for perfrormance, closed is default, therefore we can delete the query parameter
      currentUrl.searchParams.delete(QueryParameter.IS_TIMELINE_OPENED);
    }

    await goto(currentUrl, { replaceState: true });
  };

  function getFileCreatedDates() {
    const { relativeDate, dateAfter, dateBefore } = $mapSettings;

    if (relativeDate) {
      const duration = Duration.fromISO(relativeDate);
      return {
        fileCreatedAfter: duration.isValid ? DateTime.now().minus(duration).toISO() : undefined,
      };
    }

    try {
      return {
        fileCreatedAfter: dateAfter ? new Date(dateAfter).toISOString() : undefined,
        fileCreatedBefore: dateBefore ? new Date(dateBefore).toISOString() : undefined,
      };
    } catch {
      $mapSettings.dateAfter = '';
      $mapSettings.dateBefore = '';
      return {};
    }
  }

  async function onViewAssets(assetIds: string[]) {
    viewingAssets = assetIds;
    viewingAssetCursor = 0;
    await setAssetId(assetIds[0]);
  }

  async function navigateNext() {
    if (viewingAssetCursor < viewingAssets.length - 1) {
      await setAssetId(viewingAssets[++viewingAssetCursor]);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      return true;
    }
    return false;
  }

  async function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      await setAssetId(viewingAssets[--viewingAssetCursor]);
      await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
      return true;
    }
    return false;
  }

  async function navigateRandom() {
    if (viewingAssets.length <= 0) {
      return null;
    }
    const index = Math.floor(Math.random() * viewingAssets.length);
    const asset = await setAssetId(viewingAssets[index]);
    await navigate({ targetRoute: 'current', assetId: $viewingAsset.id });
    return asset;
  }

  function onChangeBounds(newBounds: MapBounds) {
    const { boundWest, boundEast, boundSouth, boundNorth } = newBounds;

    if (!boundWest || !boundEast || !boundSouth || !boundNorth) {
      return;
    }

    // TODO: get the number of assets from the server?
    let assetsInBounds = mapMarkers.filter((mapMarker) =>
      isAssetInBounds(mapMarker, boundWest!, boundEast!, boundSouth!, boundNorth!),
    );
    numberOfAssets = assetsInBounds.length;

    // refresh only if the assets displayed on screen has changed to avoid refresh the AssetGrid when nothing has changed on screen
    if (currentAssets.length === 0 || assetsInBounds.toString() !== currentAssets.toString()) {
      bounds = newBounds;
      currentAssets = assetsInBounds;
    }
  }

  const isAssetInBounds = (
    mapMarker: MapMarkerResponseDto,
    boundWest: number,
    boundEast: number,
    boundSouth: number,
    boundNorth: number,
  ) => {
    // if part of the map contains the international date line
    // => boundWest is positive, boundEast is negative => boundWest >= boundEast
    // you want to check if the longitude of marker is after boundWest OR after boundEast
    // longitude of marker is normalized to -180 to 180
    const isLonWithinBounds =
      boundWest >= boundEast
        ? boundWest <= mapMarker.lon || mapMarker.lon <= boundEast
        : boundWest <= mapMarker.lon && mapMarker.lon <= boundEast;

    // lat of marker is larger southern bound and smaller than northern bound
    const isLatWithinBounds = boundSouth <= mapMarker.lat && mapMarker.lat <= boundNorth;

    return isLonWithinBounds && isLatWithinBounds;
  };
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout title={data.meta.title}>
    <div class="isolate h-full w-full" id="map-container" bind:this={mapContainer}>
      <div class={`${isAssetGridOpened ? 'h-1/2' : 'h-full'} w-full`}>
        <Map hash bind:mapMarkers bind:showSettingsModal onSelect={onViewAssets} {onChangeBounds} bind:mapContainer />
      </div>

      <!-- Toggle button and number of assets-->
      <div
        class="absolute left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4"
        style={`top: ${isAssetGridOpened ? 'calc(50% - 4rem)' : 'calc(100% - 5rem)'}`}
      >
        <div
          id="number-of-assets"
          title={$t('number_of_assets')}
          class="bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray flex justify-center items-center font-mono font-bold w-[40px] h-[40px] rounded-full"
        >
          {numberOfAssets}
        </div>
        <Button class="h-14 w-14 p-2 !ml-0" rounded="full" size="tiny" onclick={toggleAssetGrid}>
          <Icon path={isAssetGridOpened ? mdiArrowDown : mdiArrowUp} size="36" />
        </Button>
      </div>

      <!-- AssetsGrid -->
      {#if isAssetGridOpened && timelineStore}
        <div
          class="relative w-full overflow-hidden transition ease-in-out bottom-0 px-2 z-50
          h-1/2 bg-immich-bg dark:bg-immich-dark-bg
          "
        >
          <div class="absolute h-full w-full">
            {#key timelineStore}
              <AssetGrid
                enableRouting={false}
                isSelectionMode={false}
                assetStore={timelineStore}
                assetInteraction={timelineInteraction}
              />
            {/key}
          </div>
        </div>
      {/if}
    </div>
  </UserPageLayout>
  <Portal target="body">
    {#if $showAssetViewer}
      {#await import('../../../../../lib/components/asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
        <AssetViewer
          asset={$viewingAsset}
          showNavigation={viewingAssets.length > 1}
          onNext={navigateNext}
          onPrevious={navigatePrevious}
          onRandom={navigateRandom}
          onClose={() => {
            assetViewingStore.showAssetViewer(false);
            handlePromiseError(navigate({ targetRoute: 'current', assetId: null }));
          }}
          isShared={false}
        />
      {/await}
    {/if}
  </Portal>

  {#if showSettingsModal}
    <MapSettingsModal
      settings={{ ...$mapSettings }}
      onClose={() => (showSettingsModal = false)}
      onSave={async (settings) => {
        const shouldUpdate = !isEqual(omit(settings, 'allowDarkMode'), omit($mapSettings, 'allowDarkMode'));
        showSettingsModal = false;
        $mapSettings = settings;

        if (shouldUpdate) {
          mapMarkers = await loadMapMarkers();
        }
      }}
    />
  {/if}
{/if}
