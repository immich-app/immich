<script lang="ts" context="module">
  void maplibregl.setRTLTextPlugin(mapboxRtlUrl, true);
</script>

<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute, AssetGridOptionsValues, QueryParameter, Theme } from '$lib/constants';
  import { colorTheme, mapSettings } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl, getKey, handlePromiseError } from '$lib/utils';
  import { getMapStyle, MapTheme, type MapMarkerResponseDto } from '@immich/sdk';
  import mapboxRtlUrl from '@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min.js?url';
  import { mdiArrowDown, mdiArrowUp, mdiCog, mdiMap, mdiMapMarker, mdiOpenInNew } from '@mdi/js';
  import type { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
  import type { GeoJSONSource, LngLatLike, StyleSpecification } from 'maplibre-gl';
  import maplibregl from 'maplibre-gl';
  import { createEventDispatcher, onMount } from 'svelte';
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
  import { t } from 'svelte-i18n';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import { AssetStore } from '$lib/stores/assets.store';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';

  export let mapMarkers: MapMarkerResponseDto[];
  export let showSettingsModal: boolean | undefined = undefined;
  export let zoom: number | undefined = undefined;
  export let center: LngLatLike | undefined = undefined;
  export let hash = false;
  export let simplified = false;
  export let clickable = false;
  export let useLocationPin = false;

  // if you want to have the assetGrid with the map
  export let showAssetGrid = false;

  // to open the assetGrid on pageLoad
  export let isAssetGridOpenedOnInit = false;

  onMount(() => {
    if (isAssetGridOpenedOnInit) {
      handleOpenAssetGird();
    }
  });

  export function addClipMapMarker(lng: number, lat: number) {
    if (map) {
      if (marker) {
        marker.remove();
      }

      center = { lng, lat };
      marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
      map.setZoom(15);
    }
  }

  export let onOpenInMapView: (() => Promise<void> | void) | undefined = undefined;

  let map: maplibregl.Map;
  let marker: maplibregl.Marker | null = null;

  let x1: number | undefined = undefined;
  let x2: number | undefined = undefined;
  let y1: number | undefined = undefined;
  let y2: number | undefined = undefined;
  let currentAssets: MapMarkerResponseDto[] = [];
  let previousUrl: string | undefined = undefined;
  let isAssetGridOpened: boolean = false;
  let numberOfAssets: number | undefined = undefined;

  let timelineStore: AssetStore | undefined = undefined;
  const timelineInteractionStore = createAssetInteractionStore();

  $: {
    let url = `${AppRoute.PHOTOS}?${QueryParameter.COORDINATESX1}=${x1}&${QueryParameter.COORDINATESX2}=${x2}&${QueryParameter.COORDINATESY1}=${y1}&${QueryParameter.COORDINATESY2}=${y2}&${QueryParameter.PREVIOUS_ROUTE}=${encodeURIComponent(`${AppRoute.MAP}?${QueryParameter.IS_TIMELINE_OPENED}=${isAssetGridOpened}${location.hash}`)}`;
    let options: string[] = [];
    if ($mapSettings.withPartners) {
      options.push(AssetGridOptionsValues.withPartners);
    }
    if ($mapSettings.onlyFavorites) {
      options.push(AssetGridOptionsValues.onlyFavorites);
    }
    if (options.length > 0) {
      url += `&${QueryParameter.ASSET_GRID_OPTIONS}=${options.join(',')}`;
    }

    previousUrl = url;
  }

  $: style = (() =>
    getMapStyle({
      theme: ($mapSettings.allowDarkMode ? $colorTheme.value : Theme.LIGHT) as unknown as MapTheme,
      key: getKey(),
    }) as Promise<StyleSpecification>)();

  const dispatch = createEventDispatcher<{
    selected: string[];
    clickedPoint: { lat: number; lng: number };
  }>();

  function handleAssetClick(assetId: string, map: Map | null) {
    if (!map) {
      return;
    }
    dispatch('selected', [assetId]);
  }

  async function handleClusterClick(clusterId: number, map: Map | null) {
    if (!map) {
      return;
    }

    const mapSource = map?.getSource('geojson') as GeoJSONSource;
    const leaves = await mapSource.getClusterLeaves(clusterId, 10_000, 0);
    const ids = leaves.map((leaf) => leaf.properties?.id);
    dispatch('selected', ids);
  }

  function handleMapClick(event: maplibregl.MapMouseEvent) {
    if (clickable) {
      const { lng, lat } = event.lngLat;
      dispatch('clickedPoint', { lng, lat });

      if (marker) {
        marker.remove();
      }

      marker = new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
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
</script>

{#await style then style}
  <MapLibre
    {hash}
    {style}
    class="h-full"
    {center}
    {zoom}
    attributionControl={false}
    diffStyleUpdates={true}
    let:map
    on:load={(event) => event.detail.setMaxZoom(18)}
    on:load={(event) => event.detail.on('click', handleMapClick)}
    bind:map
    on:moveend={changeBounds}
  >
    <NavigationControl position="top-left" showCompass={!simplified} />

    {#if !simplified}
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <ScaleControl />
      <AttributionControl compact={false} />
    {/if}

    {#if showSettingsModal !== undefined}
      <Control>
        <ControlGroup>
          <ControlButton on:click={() => (showSettingsModal = true)}><Icon path={mdiCog} size="100%" /></ControlButton>
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
        let:feature
        on:click={(event) => handlePromiseError(handleClusterClick(event.detail.feature.properties?.cluster_id, map))}
      >
        <div
          class="rounded-full w-[40px] h-[40px] bg-immich-primary text-immich-gray flex justify-center items-center font-mono font-bold shadow-lg hover:bg-immich-dark-primary transition-all duration-200 hover:text-immich-dark-bg opacity-90"
        >
          {feature.properties?.point_count}
        </div>
      </MarkerLayer>
      <MarkerLayer
        applyToClusters={false}
        asButton
        let:feature
        on:click={(event) => {
          if (!$$slots.popup) {
            handleAssetClick(event.detail.feature.properties?.id, map);
          }
        }}
      >
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
        {#if $$slots.popup}
          <Popup offset={[0, -30]} openOn="click" closeOnClickOutside>
            <slot name="popup" marker={asMarker(feature)} />
          </Popup>
        {/if}
      </MarkerLayer>
    </GeoJSON>

    {#if showAssetGrid && !$mapSettings.withSharedAlbums && !$mapSettings.includeArchived}
      <div
        class="absolute transition ease-in-out inset-x-0 bottom-0 px-2 rounded-t-lg rounded-x-lg z-50 {isAssetGridOpened
          ? 'h-[50%] bg-immich-bg dark:bg-immich-dark-bg border-t-2 border-x-2 dark:border-immich-dark-gray'
          : ''}"
      >
        <div class="grid grid-cols-3 gap-4 py-2 w-full content-start dark:text-immich-dark-primary">
          <div>
            {#if isAssetGridOpened}
              <div
                title={$t('number_of_assets')}
                class="bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-gray text-center h-8 w-8 p-2 rounded-full"
              >
                {numberOfAssets}
              </div>
            {/if}
          </div>
          <div class=" text-white text-center">
            <Button class="h-14 w-14 p-2" rounded="full" size="tiny" on:click={handleOpenAssetGird}>
              <Icon path={isAssetGridOpened ? mdiArrowDown : mdiArrowUp} size="36" />
            </Button>
          </div>
          <div class="text-right">
            {#if isAssetGridOpened && numberOfAssets && previousUrl}
              <a href={previousUrl}>
                <Button class="h-8 w-8 p-2 " rounded="full" size="tiny" on:click={handleOpenAssetGird}>
                  <Icon path={mdiOpenInNew} size="12" />
                </Button>
              </a>
            {/if}
          </div>
        </div>
        {#if isAssetGridOpened && timelineStore}
          {#key timelineStore}
            <AssetGrid
              enableRouting={false}
              isSelectionMode={false}
              assetStore={timelineStore}
              assetInteractionStore={timelineInteractionStore}
            />
          {/key}
        {/if}
      </div>
    {/if}
  </MapLibre>
  <style>
    .location-pin {
      transform: translate(0, -50%);
      filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.3));
    }
  </style>
{/await}
