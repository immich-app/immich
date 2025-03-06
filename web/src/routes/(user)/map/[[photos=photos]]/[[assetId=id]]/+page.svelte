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
  import maplibregl from 'maplibre-gl';

  interface Coordinates {
    x1: number | undefined;
    x2: number | undefined;
    y1: number | undefined;
    y2: number | undefined;
  }

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

  let coordinates: Coordinates = $state({ x1: undefined, x2: undefined, y1: undefined, y2: undefined });
  let numberOfAssets: number | undefined = $state(undefined);

  let timelineStore: AssetStore | undefined = $derived.by(() => {
    return coordinates.x1 && coordinates.x2 && coordinates.y1 && coordinates.y2
      ? new AssetStore({
          isArchived: false,
          withPartners: $mapSettings.withPartners,
          isFavorite: false,
          x1: coordinates.x1,
          x2: coordinates.x2,
          y1: coordinates.y1,
          y2: coordinates.y2,
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

  function onChangeBounds(bounds: maplibregl.LngLatBounds) {
    let lng_e: number, lng_w: number, lat_e: number, lat_w: number;

    /*
    /*
    /* longitude and latitude can be >180 and <180 with maplibre
    /* that part fixes it to always have longitude coordinates -180 < x1, x2 < 180
    /*
    */
    if (Math.abs(bounds._ne.lng) + Math.abs(bounds._sw.lng) > 360) {
      lng_e = -180;
      lng_w = 180;
    } else if (Math.abs(bounds._sw.lng) > 180) {
      lng_e = bounds._sw.lng + 360;
      lng_w = bounds._ne.lng;
    } else if (Math.abs(bounds._ne.lng) > 180) {
      lng_e = bounds._sw.lng;
      lng_w = bounds._ne.lng - 360;
    } else {
      lng_e = bounds._sw.lng;
      lng_w = bounds._ne.lng;
    }

    lat_e = bounds._ne.lat;
    lat_w = bounds._sw.lat;

    // TODO: get the number of assets from the server?
    let assetsInBounds = mapMarkers.filter((mapMarker) => isAssetinBounds(mapMarker, lng_e, lng_w, lat_e, lat_w));
    numberOfAssets = assetsInBounds.length;

    // refresh only if the assets displayed on screen has changed to avoid refresh the AssetGrid when nothing has changed on screen
    if (currentAssets.length === 0 || assetsInBounds.toString() !== currentAssets.toString()) {
      coordinates = { x1: lng_e, x2: lng_w, y1: lat_e, y2: lat_w };
      currentAssets = assetsInBounds;
    }
  }

  const isAssetinBounds = (mapMarker: MapMarkerResponseDto, x1: number, x2: number, y1: number, y2: number) => {
    // if x1 is before the international date line, and x2 after it, you want to check if the asset is after x1 OR after x2
    const isLonWithinBounds =
      x1 > x2 ? mapMarker.lon >= x1 || mapMarker.lon <= x2 : mapMarker.lon >= x1 && mapMarker.lon <= x2;
    const isLatWithinBounds = mapMarker.lat >= y2 && mapMarker.lat <= y1;
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
