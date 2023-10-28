<script lang="ts">
  import {
    MapLibre,
    GeoJSON,
    MarkerLayer,
    AttributionControl,
    ControlButton,
    Control,
    ControlGroup,
  } from 'svelte-maplibre';
  import { mapSettings } from '$lib/stores/preferences.store';
  import { MapMarkerResponseDto, api } from '@api';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import type { LngLatLike, StyleSpecification } from 'maplibre-gl';

  export let mapMarkers: MapMarkerResponseDto[];
  export let showSettingsModal: boolean | undefined = undefined;
  export let zoom: number | undefined = undefined;
  export let center: LngLatLike | undefined = undefined;

  $: style = (async () => {
    const { data } = await api.systemConfigApi.getMapStyle({ theme: $mapSettings.allowDarkMode ? 'dark' : 'light' });
    return data as StyleSpecification;
  })();
</script>

{#await style then style}
  <MapLibre {style} class="h-full" {center} {zoom} standardControls attributionControl={false}>
    <AttributionControl compact={false} customAttribution={'Thanks to Cofractal for providing their tile servers!'} />
    {#if showSettingsModal !== undefined}
      <Control>
        <ControlGroup>
          <ControlButton on:click={() => (showSettingsModal = true)}><Cog size="100%" /></ControlButton>
        </ControlGroup>
      </Control>
    {/if}
    <GeoJSON
      data={{
        type: 'FeatureCollection',
        features: mapMarkers.map((marker) => {
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [marker.lon, marker.lat] },
            properties: {
              id: marker.id,
            },
          };
        }),
      }}
      cluster={{ maxZoom: 14, radius: 500 }}
    >
      <MarkerLayer applyToClusters interactive let:feature>
        <div class="rounded-full w-[40px] h-[40px] bg-blue-200 flex justify-center items-center">
          {feature.properties?.point_count}
        </div>
      </MarkerLayer>
      <MarkerLayer applyToClusters={false} let:feature>
        <img
          src={api.getAssetFileUrl(feature.properties?.id)}
          class="rounded-full w-[60px] h-[60px]"
          alt={`Image with id ${feature.properties?.id}`}
        />
      </MarkerLayer>
    </GeoJSON>
    <!-- {#each mapMarkers as { id, lat, lon }}
    <Marker
      lngLat={{ lng: lon, lat }}
      class="w-[60px] h-[60px] flex justify-center items-center"
      on:click={() => assetViewingStore.setAssetId(id)}
    >
      <img src={api.getAssetFileUrl(id)} class="rounded-full w-[60px] h-[60px]" />
    </Marker>
  {/each} -->
  </MapLibre>
{/await}
