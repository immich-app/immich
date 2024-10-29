<script lang="ts" context="module">
  void maplibregl.setRTLTextPlugin(mapboxRtlUrl, true);
</script>

<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { Theme } from '$lib/constants';
  import { colorTheme, mapSettings } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { getServerConfig, type MapMarkerResponseDto } from '@immich/sdk';
  import mapboxRtlUrl from '@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min.js?url';
  import { mdiCog, mdiMap, mdiMapMarker } from '@mdi/js';
  import type { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
  import type { GeoJSONSource, LngLatLike, StyleSpecification } from 'maplibre-gl';
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

  export let mapMarkers: MapMarkerResponseDto[];
  export let showSettingsModal: boolean | undefined = undefined;
  export let zoom: number | undefined = undefined;
  export let center: LngLatLike | undefined = undefined;
  export let hash = false;
  export let simplified = false;
  export let clickable = false;
  export let useLocationPin = false;
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
  export let onSelect: (assetIds: string[]) => void = () => {};
  export let onClickPoint: ({ lat, lng }: { lat: number; lng: number }) => void = () => {};

  let map: maplibregl.Map;
  let marker: maplibregl.Marker | null = null;

  $: style = (async () => {
    const config = await getServerConfig();
    const theme = $mapSettings.allowDarkMode ? $colorTheme.value : Theme.LIGHT;
    const styleUrl = theme === Theme.DARK ? config.mapDarkStyleUrl : config.mapLightStyleUrl;
    const style = await fetch(styleUrl).then((response) => response.json());
    return style as StyleSpecification;
  })();

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
  </MapLibre>
  <style>
    .location-pin {
      transform: translate(0, -50%);
      filter: drop-shadow(0 3px 3px rgb(0 0 0 / 0.3));
    }
  </style>
{/await}
