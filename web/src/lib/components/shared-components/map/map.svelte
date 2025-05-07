<script lang="ts" module>
  import { Protocol } from 'pmtiles';

  let protocol = new Protocol();
  void maplibregl.addProtocol('pmtiles', protocol.tile);
  void maplibregl.setRTLTextPlugin(mapboxRtlUrl, true);
</script>

<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { Theme } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { themeManager } from '$lib/managers/theme-manager.svelte';
  import MapSettingsModal from '$lib/modals/MapSettingsModal.svelte';
  import { mapSettings } from '$lib/stores/preferences.store';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { getAssetThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { getMapMarkers, type MapMarkerResponseDto } from '@immich/sdk';
  import mapboxRtlUrl from '@mapbox/mapbox-gl-rtl-text/mapbox-gl-rtl-text.min.js?url';
  import { mdiCog, mdiMap, mdiMapMarker } from '@mdi/js';
  import type { Feature, GeoJsonProperties, Geometry, Point } from 'geojson';
  import { isEqual, omit } from 'lodash-es';
  import { DateTime, Duration } from 'luxon';
  import maplibregl, { GlobeControl, type GeoJSONSource, type LngLatLike } from 'maplibre-gl';
  import { onDestroy, onMount } from 'svelte';
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

  interface Props {
    mapMarkers?: MapMarkerResponseDto[];
    showSettings?: boolean;
    zoom?: number | undefined;
    center?: LngLatLike | undefined;
    hash?: boolean;
    simplified?: boolean;
    clickable?: boolean;
    useLocationPin?: boolean;
    onOpenInMapView?: (() => Promise<void> | void) | undefined;
    onSelect?: (assetIds: string[]) => void;
    onClickPoint?: ({ lat, lng }: { lat: number; lng: number }) => void;
    popup?: import('svelte').Snippet<[{ marker: MapMarkerResponseDto }]>;
  }

  let {
    mapMarkers = $bindable([]),
    showSettings = true,
    zoom = undefined,
    center = $bindable(undefined),
    hash = false,
    simplified = false,
    clickable = false,
    useLocationPin = false,
    onOpenInMapView = undefined,
    onSelect = () => {},
    onClickPoint = () => {},
    popup,
  }: Props = $props();

  let map: maplibregl.Map | undefined = $state();
  let marker: maplibregl.Marker | null = null;
  let abortController: AbortController;

  const theme = $derived($mapSettings.allowDarkMode ? themeManager.value : Theme.LIGHT);
  const styleUrl = $derived(theme === Theme.DARK ? $serverConfig.mapDarkStyleUrl : $serverConfig.mapLightStyleUrl);

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

  const handleSettingsClick = async () => {
    const settings = await modalManager.show(MapSettingsModal, { settings: { ...$mapSettings } });
    if (settings) {
      const shouldUpdate = !isEqual(omit(settings, 'allowDarkMode'), omit($mapSettings, 'allowDarkMode'));
      $mapSettings = settings;

      if (shouldUpdate) {
        mapMarkers = await loadMapMarkers();
      }
    }
  };

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController.abort();
  });

  $effect(() => {
    map?.setStyle(styleUrl, {
      transformStyle: (previousStyle, nextStyle) => {
        if (previousStyle) {
          // Preserves the custom map markers from the previous style when the theme is switched
          // Required until https://github.com/dimfeld/svelte-maplibre/issues/146 is fixed
          const customLayers = previousStyle.layers.filter((l) => l.type == 'fill' && l.source == 'geojson');
          const layers = nextStyle.layers.concat(customLayers);
          const sources = nextStyle.sources;

          for (const [key, value] of Object.entries(previousStyle.sources || {})) {
            if (key.startsWith('geojson')) {
              sources[key] = value;
            }
          }

          return {
            ...nextStyle,
            sources,
            layers,
          };
        }
        return nextStyle;
      },
    });
  });
</script>

<!--  We handle style loading ourselves so we set style blank here -->
<MapLibre
  {hash}
  style=""
  class="h-full rounded-2xl"
  {center}
  {zoom}
  attributionControl={false}
  diffStyleUpdates={true}
  onload={(event) => {
    event.setMaxZoom(18);
    event.on('click', handleMapClick);
    if (!simplified) {
      event.addControl(new GlobeControl(), 'top-left');
    }
  }}
  bind:map
>
  {#snippet children({ map }: { map: maplibregl.Map })}
    <NavigationControl position="top-left" showCompass={!simplified} />

    {#if !simplified}
      <GeolocateControl position="top-left" />
      <FullscreenControl position="top-left" />
      <ScaleControl />
      <AttributionControl compact={false} />
    {/if}

    {#if showSettings}
      <Control>
        <ControlGroup>
          <ControlButton onclick={handleSettingsClick}><Icon path={mdiCog} size="100%" /></ControlButton>
        </ControlGroup>
      </Control>
    {/if}

    {#if onOpenInMapView}
      <Control position="top-right">
        <ControlGroup>
          <ControlButton onclick={() => onOpenInMapView()}>
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
      cluster={{ radius: 35, maxZoom: 17 }}
    >
      <MarkerLayer
        applyToClusters
        asButton
        onclick={(event) => handlePromiseError(handleClusterClick(event.feature.properties?.cluster_id, map))}
      >
        {#snippet children({ feature })}
          <div
            class="rounded-full w-[40px] h-[40px] bg-immich-primary text-white flex justify-center items-center font-mono font-bold shadow-lg hover:bg-immich-dark-primary transition-all duration-200 hover:text-immich-dark-bg opacity-90"
          >
            {feature.properties?.point_count}
          </div>
        {/snippet}
      </MarkerLayer>
      <MarkerLayer
        applyToClusters={false}
        asButton
        onclick={(event) => {
          if (!popup) {
            handleAssetClick(event.feature.properties?.id, map);
          }
        }}
      >
        {#snippet children({ feature }: { feature: Feature<Geometry, GeoJsonProperties> })}
          {#if useLocationPin}
            <Icon
              path={mdiMapMarker}
              size="50px"
              class="dark:text-immich-dark-primary text-immich-primary -translate-y-[50%]"
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
  {/snippet}
</MapLibre>
