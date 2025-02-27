<script lang="ts" module>
  void maplibregl.setRTLTextPlugin(mapboxRtlUrl, true);
</script>

<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, mapSettings } from '$lib/stores/preferences.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { type MapMarkerResponseDto } from '@immich/sdk';
  import mapboxRtlUrl from '@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min.js?url';
  import { mdiArrowDown, mdiArrowUp, mdiCog, mdiMap, mdiMapMarker } from '@mdi/js';
  import type { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
  import type { GeoJSONSource, LngLatLike } from 'maplibre-gl';
  import maplibregl from 'maplibre-gl';
  import { t } from 'svelte-i18n';
  import {
    AttributionControl,
    Control,
    ControlButton,
    ControlGroup,
    FullscreenControl,
    GeoJSON,
    GeolocateControl,
    MapLibre,
    MarkerLayer,
    NavigationControl,
    Popup,
    ScaleControl,
    type Map,
  } from 'svelte-maplibre';
  import { onMount } from 'svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import { AssetStore } from '$lib/stores/assets.store';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

  interface Props {
    mapMarkers: MapMarkerResponseDto[];
    showSettingsModal?: boolean | undefined;
    zoom?: number | undefined;
    center?: LngLatLike | undefined;
    hash?: boolean;
    simplified?: boolean;
    clickable?: boolean;
    useLocationPin?: boolean;
    // if you want to have the assetGrid with the map
    showAssetGrid: boolean;
    // to open the assetGrid on pageLoad
    isAssetGridOpenedOnInit: boolean;
    onOpenInMapView?: (() => Promise<void> | void) | undefined;
    onSelect?: (assetIds: string[]) => void;
    onClickPoint?: ({ lat, lng }: { lat: number; lng: number }) => void;
    popup?: import('svelte').Snippet<[{ marker: MapMarkerResponseDto }]>;
  }

  let {
    mapMarkers = $bindable(),
    showSettingsModal = $bindable(undefined),
    zoom = undefined,
    center = $bindable(undefined),
    hash = false,
    simplified = false,
    clickable = false,
    useLocationPin = false,
    showAssetGrid = false,
    isAssetGridOpenedOnInit = false,
    onOpenInMapView = undefined,
    onSelect = () => {},
    onClickPoint = () => {},
    popup,
  }: Props = $props();

  let map: maplibregl.Map | undefined = $state();
  let marker: maplibregl.Marker | null = null;

  const theme = $derived($mapSettings.allowDarkMode ? $colorTheme.value : Theme.LIGHT);
  const styleUrl = $derived(theme === Theme.DARK ? $serverConfig.mapDarkStyleUrl : $serverConfig.mapLightStyleUrl);
  const style = $derived(fetch(styleUrl).then((response) => response.json()));

  onMount(() => {
    if (isAssetGridOpenedOnInit) {
      handleOpenAssetGird();
    }
  });

  let x1: number | undefined = undefined;
  let x2: number | undefined = undefined;
  let y1: number | undefined = undefined;
  let y2: number | undefined = undefined;

  let currentAssets: MapMarkerResponseDto[] = [];
  // let previousUrl: string | undefined = $state(undefined);
  let isAssetGridOpened: boolean = $state(false);
  let numberOfAssets: number | undefined = $state(undefined);
  let timelineStore: AssetStore | undefined = $state(undefined);

  const timelineInteraction = new AssetInteraction();

  let mapContainer: HTMLElement | undefined = $state(undefined);

  const isAssetinBounds = (mapMarker: MapMarkerResponseDto, x1: number, x2: number, y1: number, y2: number) => {
    // if x1 is before the international date line, and x2 after it, you want to check if the asset is after x1 OR after x2
    const isLonWithinBounds =
      x1 > x2 ? mapMarker.lon >= x1 || mapMarker.lon <= x2 : mapMarker.lon >= x1 && mapMarker.lon <= x2;
    const isLatWithinBounds = mapMarker.lat >= y2 && mapMarker.lat <= y1;
    return isLonWithinBounds && isLatWithinBounds;
  };

  const changeBounds = () => {
    if (!showAssetGrid) {
      return;
    }

    if (map) {
      const bounds = map.getBounds();

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

      [x1, x2, y1, y2] = [lng_e, lng_w, lat_e, lat_w];

      // refresh only if the assets displayed on screen has changed to avoid refresh the AssetGrid when nothing has changed on screen
      if (currentAssets.length === 0 || assetsInBounds.toString() !== currentAssets.toString()) {
        newGrid();
        currentAssets = assetsInBounds;
      }
    }
  };

  const newGrid = () => {
    // TODO: missing includeArchived and withSharedAlbums
    const isFavorite = $mapSettings.onlyFavorites ? true : undefined;
    timelineStore = new AssetStore({
      isArchived: false,
      withPartners: $mapSettings.withPartners,
      isFavorite,
      x1,
      x2,
      y1,
      y2,
    });
  };

  const handleOpenAssetGird = () => {
    isAssetGridOpened = !isAssetGridOpened;
    if (isAssetGridOpened) {
      changeBounds();
      newGrid();
    }
  };

  export function addClipMapMarker(lng: number, lat: number) {
    if (map) {
      if (marker) {
        marker.remove();
      }

      center = { lng, lat };
      marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
    }
  }

  function handleAssetClick(assetId: string, map: Map | null) {
    if (!map) {
      return;
    }
    onSelect([assetId]);
  }

  async function handleClusterClick(clusterId: number, map: Map | null) {
    if (!map) {
      return;
    }

    const mapSource = map?.getSource('geojson') as GeoJSONSource;
    const leaves = await mapSource.getClusterLeaves(clusterId, 10_000, 0);
    const ids = leaves.map((leaf) => leaf.properties?.id);
    onSelect(ids);
  }

  function handleMapClick(event: maplibregl.MapMouseEvent) {
    if (clickable) {
      const { lng, lat } = event.lngLat;
      onClickPoint({ lng, lat });

      if (marker) {
        marker.remove();
      }

      if (map) {
        marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
      }
    }
  }

  type FeaturePoint = Feature<Point, { id: string; city: string | null; state: string | null; country: string | null }>;

  const asFeature = (marker: MapMarkerResponseDto): FeaturePoint => {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
      properties: {
        id: marker.id,
        city: marker.city,
        state: marker.state,
        country: marker.country,
      },
    };
  };

  const asMarker = (feature: Feature<Geometry, GeoJsonProperties>): MapMarkerResponseDto => {
    const featurePoint = feature as FeaturePoint;
    const coords = maplibregl.LngLat.convert(featurePoint.geometry.coordinates as [number, number]);
    return {
      lat: coords.lat,
      lon: coords.lng,
      id: featurePoint.properties.id,
      city: featurePoint.properties.city,
      state: featurePoint.properties.state,
      country: featurePoint.properties.country,
    };
  };
</script>

{#await style then style}
  <div bind:this={mapContainer} class="h-full w-full" id="map-container">
    <MapLibre
      {hash}
      {style}
      class={`relative w-full overflow-hidden transition ease-in-out ${isAssetGridOpened ? 'h-1/2' : 'h-full'}`}
      {center}
      {zoom}
      attributionControl={false}
      diffStyleUpdates={true}
      on:load={(event) => event.detail.setMaxZoom(18)}
      on:load={(event) => event.detail.on('click', handleMapClick)}
      bind:map
      on:moveend={changeBounds}
    >
      {#snippet children({ map }: { map: maplibregl.Map })}
        <NavigationControl position="top-left" showCompass={!simplified} />

        {#if !simplified}
          <GeolocateControl position="top-left" />
          <FullscreenControl position="top-left" container={mapContainer} />
          <ScaleControl />
          <AttributionControl compact={false} />
        {/if}

        {#if showSettingsModal !== undefined}
          <Control>
            <ControlGroup>
              <ControlButton on:click={() => (showSettingsModal = true)}
                ><Icon path={mdiCog} size="100%" /></ControlButton
              >
            </ControlGroup>
          </Control>
        {/if}

        {#if onOpenInMapView}
          <Control position="top-right">
            <ControlGroup>
              <ControlButton on:click={() => onOpenInMapView()}>
                <Icon title={$t('open_in_map_view')} path={mdiMap} size="100%" />
              </ControlButton>
            </ControlGroup>
          </Control>
        {/if}

        <GeoJSON
          data={{
            type: 'FeatureCollection',
            features: mapMarkers.map((marker) => asFeature(marker)),
          }}
          id="geojson"
          cluster={{ radius: 500, maxZoom: 24 }}
        >
          <MarkerLayer
            applyToClusters
            asButton
            on:click={(event) =>
              handlePromiseError(handleClusterClick(event.detail.feature.properties?.cluster_id, map))}
          >
            {#snippet children({ feature }: { feature: maplibregl.Feature })}
              <div
                class="rounded-full w-[40px] h-[40px] bg-immich-primary text-immich-gray flex justify-center items-center font-mono font-bold shadow-lg hover:bg-immich-dark-primary transition-all duration-200 hover:text-immich-dark-bg opacity-90"
              >
                {feature.properties?.point_count}
              </div>
            {/snippet}
          </MarkerLayer>
          <MarkerLayer
            applyToClusters={false}
            asButton
            on:click={(event) => {
              if (!popup) {
                handleAssetClick(event.detail.feature.properties?.id, map);
              }
            }}
          >
            {#snippet children({ feature }: { feature: Feature<Geometry, GeoJsonProperties> })}
              {#if useLocationPin}
                <Icon
                  path={mdiMapMarker}
                  size="50px"
                  class="location-pin dark:text-immich-dark-primary text-immich-primary"
                />
              {:else}
                <img
                  src={getAssetThumbnailUrl(feature.properties?.id)}
                  class="rounded-full w-[60px] h-[60px] border-2 border-immich-primary shadow-lg hover:border-immich-dark-primary transition-all duration-200 hover:scale-150 object-cover bg-immich-primary"
                  alt={feature.properties?.city && feature.properties.country
                    ? $t('map_marker_for_images', {
                        values: { city: feature.properties.city, country: feature.properties.country },
                      })
                    : $t('map_marker_with_image')}
                />
              {/if}
              {#if popup}
                <Popup offset={[0, -30]} openOn="click" closeOnClickOutside>
                  {@render popup?.({ marker: asMarker(feature) })}
                </Popup>
              {/if}
            {/snippet}
          </MarkerLayer>
        </GeoJSON>

        {#if showAssetGrid}
          <div
            class="absolute left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-4"
            style={`top: ${isAssetGridOpened ? 'calc(100% - 4rem)' : 'calc(100% - 4rem)'}`}
          >
            <div
              id="number-of-assets"
              title={$t('number_of_assets')}
              class="bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray flex justify-center items-center font-mono font-bold w-[40px] h-[40px] rounded-full"
            >
              {numberOfAssets}
            </div>

            <!-- Toggle button -->
            <Button class="h-14 w-14 p-2 !ml-0" rounded="full" size="tiny" onclick={handleOpenAssetGird}>
              <Icon path={isAssetGridOpened ? mdiArrowDown : mdiArrowUp} size="36" />
            </Button>
          </div>
        {/if}
      {/snippet}
    </MapLibre>

    {#if showAssetGrid && !$mapSettings.withSharedAlbums && !$mapSettings.includeArchived}
      <div
        class="relative w-full overflow-hidden transition ease-in-out bottom-0 px-2 z-50 {isAssetGridOpened
          ? 'h-1/2 bg-immich-bg dark:bg-immich-dark-bg'
          : ''}"
      >
        <div class="absolute h-full w-full">
          {#if isAssetGridOpened && timelineStore}
            {#key timelineStore}
              <AssetGrid
                enableRouting={false}
                isSelectionMode={false}
                assetStore={timelineStore}
                assetInteraction={timelineInteraction}
              />
            {/key}
          {/if}
        </div>
      </div>
    {/if}

    <style>
      .location-pin {
        transform: translate(0, -50%);
        filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.3));
      }
    </style>
  </div>
{/await}
