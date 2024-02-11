<script lang="ts">
  import {
    MapLibre,
    GeoJSON,
    MarkerLayer,
    AttributionControl,
    ControlButton,
    Control,
    ControlGroup,
    type Map,
    FullscreenControl,
    GeolocateControl,
    NavigationControl,
    ScaleControl,
    Popup,
  } from 'svelte-maplibre';
  import { colorTheme, mapSettings } from '$lib/stores/preferences.store';
  import { type MapMarkerResponseDto, api } from '@api';
  import maplibregl from 'maplibre-gl';
  import type { GeoJSONSource, LngLatLike, StyleSpecification } from 'maplibre-gl';
  import type { Feature, Geometry, GeoJsonProperties, Point } from 'geojson';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCog, mdiMapMarker } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { Theme } from '$lib/constants';

  export let mapMarkers: MapMarkerResponseDto[];
  export let showSettingsModal: boolean | undefined = undefined;
  export let zoom: number | undefined = undefined;
  export let center: LngLatLike | undefined = undefined;
  export let simplified = false;
  export let clickable = false;
  export let useLocationPin = false;

  let map: maplibregl.Map;
  let marker: maplibregl.Marker | null = null;

  // eslint-disable-next-line unicorn/prefer-top-level-await
  $: style = (async () => {
    const { data } = await api.systemConfigApi.getMapStyle({
      theme: $mapSettings.allowDarkMode ? $colorTheme.value : Theme.LIGHT,
    });
    return data as StyleSpecification;
  })();

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

  function handleClusterClick(clusterId: number, map: Map | null) {
    if (!map) {
      return;
    }

    const mapSource = map?.getSource('geojson') as GeoJSONSource;
    mapSource.getClusterLeaves(clusterId, 10_000, 0, (error, leaves) => {
      if (error) {
        return;
      }

      if (leaves) {
        const ids = leaves.map((leaf) => leaf.properties?.id);
        dispatch('selected', ids);
      }
    });
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

  type FeaturePoint = Feature<Point, { id: string }>;

  const asFeature = (marker: MapMarkerResponseDto): FeaturePoint => {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
      properties: {
        id: marker.id,
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
    };
  };
</script>

{#await style then style}
  <MapLibre
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
    <GeoJSON
      data={{
        type: 'FeatureCollection',
        features: mapMarkers.map((marker) => {
          return asFeature(marker);
        }),
      }}
      id="geojson"
      cluster={{ radius: 500, maxZoom: 24 }}
    >
      <MarkerLayer
        applyToClusters
        asButton
        let:feature
        on:click={(event) => {
          handleClusterClick(event.detail.feature.properties.cluster_id, map);
        }}
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
          $$slots.popup || handleAssetClick(event.detail.feature.properties.id, map);
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
            src={api.getAssetThumbnailUrl(feature.properties?.id)}
            class="rounded-full w-[60px] h-[60px] border-2 border-immich-primary shadow-lg hover:border-immich-dark-primary transition-all duration-200 hover:scale-150 object-cover bg-immich-primary"
            alt={`Image with id ${feature.properties?.id}`}
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
