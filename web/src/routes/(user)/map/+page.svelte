<script lang="ts">
  import { goto } from '$app/navigation';
  import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MapSettingsModal from '$lib/components/map-page/map-settings-modal.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AppRoute } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { mapSettings } from '$lib/stores/preferences.store';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { MapMarkerResponseDto, api } from '@api';
  import { isEqual, omit } from 'lodash-es';
  import { DateTime, Duration } from 'luxon';
  import { onDestroy, onMount } from 'svelte';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import type { PageData } from './$types';

  export let data: PageData;

  let { isViewing: showAssetViewer, asset: viewingAsset } = assetViewingStore;

  let leaflet: typeof import('$lib/components/shared-components/leaflet');
  let mapMarkers: MapMarkerResponseDto[] = [];
  let abortController: AbortController;
  let viewingAssets: string[] = [];
  let viewingAssetCursor = 0;
  let showSettingsModal = false;

  onMount(() => {
    loadMapMarkers().then((data) => (mapMarkers = data));
    import('$lib/components/shared-components/leaflet').then((data) => (leaflet = data));
  });

  onDestroy(() => {
    abortController?.abort();
    assetViewingStore.showAssetViewer(false);
  });

  $: $featureFlags.map || goto(AppRoute.PHOTOS);

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    const { onlyFavorites } = $mapSettings;
    const { fileCreatedAfter, fileCreatedBefore } = getFileCreatedDates();

    const { data } = await api.assetApi.getMapMarkers(
      {
        isFavorite: onlyFavorites || undefined,
        fileCreatedAfter: fileCreatedAfter || undefined,
        fileCreatedBefore,
      },
      {
        signal: abortController.signal,
      },
    );
    return data;
  }

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

  function onViewAssets(assetIds: string[], activeAssetIndex: number) {
    assetViewingStore.setAssetId(assetIds[activeAssetIndex]);
    viewingAssets = assetIds;
    viewingAssetCursor = activeAssetIndex;
  }

  function navigateNext() {
    if (viewingAssetCursor < viewingAssets.length - 1) {
      assetViewingStore.setAssetId(viewingAssets[++viewingAssetCursor]);
    }
  }

  function navigatePrevious() {
    if (viewingAssetCursor > 0) {
      assetViewingStore.setAssetId(viewingAssets[--viewingAssetCursor]);
    }
  }
</script>

{#if $featureFlags.loaded && $featureFlags.map}
  <UserPageLayout user={data.user} title={data.meta.title}>
    <div class="isolate h-full w-full">
      {#if leaflet}
        {@const { Map, TileLayer, AssetMarkerCluster, Control } = leaflet}
        <Map
          center={[30, 0]}
          zoom={3}
          allowDarkMode={$mapSettings.allowDarkMode}
          options={{
            maxBounds: [
              [-90, -180],
              [90, 180],
            ],
            minZoom: 2,
          }}
        >
          <TileLayer
            urlTemplate={$serverConfig.mapTileUrl}
            options={{
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }}
          />
          <AssetMarkerCluster
            markers={mapMarkers}
            on:view={({ detail }) => onViewAssets(detail.assetIds, detail.activeAssetIndex)}
          />
          <Control>
            <button
              class="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-black/20 bg-white font-bold text-black/70 hover:bg-gray-50 focus:bg-gray-50"
              title="Open map settings"
              on:click={() => (showSettingsModal = true)}
            >
              <Cog size="100%" class="p-1" />
            </button>
          </Control>
        </Map>
      {/if}
    </div>
  </UserPageLayout>

  <Portal target="body">
    {#if $showAssetViewer}
      <AssetViewer
        asset={$viewingAsset}
        showNavigation={viewingAssets.length > 1}
        on:next={navigateNext}
        on:previous={navigatePrevious}
        on:close={() => assetViewingStore.showAssetViewer(false)}
      />
    {/if}
  </Portal>

  {#if showSettingsModal}
    <MapSettingsModal
      settings={{ ...$mapSettings }}
      on:close={() => (showSettingsModal = false)}
      on:save={async ({ detail }) => {
        const shouldUpdate = !isEqual(omit(detail, 'allowDarkMode'), omit($mapSettings, 'allowDarkMode'));
        showSettingsModal = false;
        $mapSettings = detail;

        if (shouldUpdate) {
          mapMarkers = await loadMapMarkers();
        }
      }}
    />
  {/if}
{/if}
