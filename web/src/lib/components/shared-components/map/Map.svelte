<script lang="ts" module>
  import mapboxRtlUrl from '@mapbox/mapbox-gl-rtl-text?url';
  import { addProtocol, setRTLTextPlugin } from 'maplibre-gl';
  import { Protocol } from 'pmtiles';

  let protocol = new Protocol();
  void addProtocol('pmtiles', protocol.tile);
  void setRTLTextPlugin(mapboxRtlUrl, true);
</script>

<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
  import MapSettingsModal from '$lib/modals/MapSettingsModal.svelte';
  import { mapSettings, mapShowHeatmap } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl, handlePromiseError } from '$lib/utils';
  import { getMapMarkers, type MapMarkerResponseDto } from '@immich/sdk';
  import { Icon, modalManager, Theme, themeManager } from '@immich/ui';
  import {
    mdiCog,
    mdiCrosshairsGps,
    mdiImageMultiple,
    mdiEarth,
    mdiMap,
    mdiMapMarker,
    mdiMinus,
    mdiPlus,
  } from '@mdi/js';
  import type { Feature, Point } from 'geojson';
  import { isEqual } from 'lodash-es';
  import { DateTime, Duration } from 'luxon';
  import {
    LngLat,
    LngLatBounds,
    Marker,
    type ExpressionSpecification,
    type GeoJSONSource,
    type LngLatLike,
    type ProjectionSpecification,
    type Map,
    type MapMouseEvent,
  } from 'maplibre-gl';
  import { onDestroy, onMount, untrack } from 'svelte';
  import { t } from 'svelte-i18n';
  import {
    GeoJSON,
    HeatmapLayer,
    MapLibre,
    MarkerLayer,
    Popup,
    Control,
    ControlGroup,
    ControlButton,
  } from 'svelte-maplibre';
  import type { SelectionBBox } from './types';

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
    onClusterSelect?: (assetIds: string[], bbox: SelectionBBox) => void;
    onClickPoint?: ({ lat, lng }: { lat: number; lng: number }) => void;
    popup?: import('svelte').Snippet<[{ marker: MapMarkerResponseDto }]>;
    rounded?: boolean;
    isTimelineOpen?: boolean;
    onToggleTimeline?: () => void;
    showSimpleControls?: boolean;
    autoFitBounds?: boolean;
  }

  let {
    mapMarkers = $bindable(),
    showSettings = true,
    zoom = undefined,
    center = $bindable(undefined),
    hash = false,
    simplified = false,
    clickable = false,
    useLocationPin = false,
    onOpenInMapView = undefined,
    onSelect = () => {},
    onClusterSelect,
    onClickPoint = () => {},
    popup,
    rounded = false,
    isTimelineOpen = false,
    onToggleTimeline,
    showSimpleControls = true,
    autoFitBounds = true,
  }: Props = $props();

  // Calculate initial bounds from markers once during initialization
  const initialBounds = (() => {
    if (!autoFitBounds || center || zoom !== undefined || !mapMarkers || mapMarkers.length === 0) {
      return undefined;
    }

    const bounds = new LngLatBounds();
    for (const marker of mapMarkers) {
      bounds.extend([marker.lon, marker.lat]);
    }
    return bounds;
  })();

  let map: Map | undefined = $state.raw();
  let marker: Marker | null = null;
  let abortController: AbortController;
  let isGlobeView = $state(false);

  const mapTheme = $derived(themeManager.value);
  const styleUrl = $derived(
    mapTheme === Theme.Dark ? serverConfigManager.value.mapDarkStyleUrl : serverConfigManager.value.mapLightStyleUrl,
  );
  const mapProjection = $derived<ProjectionSpecification>({
    type: isGlobeView ? 'globe' : 'mercator',
  });

  export function addClipMapMarker(lng: number, lat: number) {
    if (map) {
      if (marker) {
        marker.remove();
      }

      center = { lng, lat };
      marker = new Marker().setLngLat([lng, lat]).addTo(map);
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

    const mapSource = map.getSource('geojson') as GeoJSONSource;
    const leaves = await mapSource.getClusterLeaves(clusterId, 10_000, 0);
    const ids = leaves.map((leaf) => leaf.properties?.id as string);

    if (onClusterSelect && ids.length > 1) {
      const [firstLongitude, firstLatitude] = (leaves[0].geometry as Point).coordinates;
      let west = firstLongitude;
      let south = firstLatitude;
      let east = firstLongitude;
      let north = firstLatitude;

      for (const leaf of leaves.slice(1)) {
        const [longitude, latitude] = (leaf.geometry as Point).coordinates;
        west = Math.min(west, longitude);
        south = Math.min(south, latitude);
        east = Math.max(east, longitude);
        north = Math.max(north, latitude);
      }

      const bbox = { west, south, east, north };
      onClusterSelect(ids, bbox);
      return;
    }

    onSelect(ids);
  }

  function handleMapClick(event: MapMouseEvent) {
    if (clickable) {
      const { lng, lat } = event.lngLat;
      onClickPoint({ lng, lat });

      if (marker) {
        marker.remove();
      }

      if (map) {
        marker = new Marker().setLngLat([lng, lat]).addTo(map);
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

  const asMarker = (feature: Feature): MapMarkerResponseDto => {
    const featurePoint = feature as FeaturePoint;
    const coords = LngLat.convert(featurePoint.geometry.coordinates as [number, number]);
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
        fileCreatedAfter: duration.isValid ? DateTime.now().minus(duration).toUTC().toISO() : undefined,
      };
    }

    return {
      fileCreatedAfter: dateAfter,
      fileCreatedBefore: dateBefore,
    };
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
        isArchived: includeArchived || undefined,
        isFavorite: onlyFavorites || undefined,
        fileCreatedAfter,
        fileCreatedBefore,
        withPartners: withPartners || undefined,
        withSharedAlbums: withSharedAlbums || undefined,
      },
      {
        signal: abortController.signal,
      },
    );
  }

  const handleSettingsClick = () => {
    handlePromiseError(
      modalManager.show(MapSettingsModal).then(async (settings) => {
        if (settings) {
          const shouldUpdate = !isEqual(settings, $mapSettings);
          $mapSettings = settings;
          if (shouldUpdate) {
            mapMarkers = await loadMapMarkers();
          }
        }
      }),
    );
  };

  afterNavigate(() => {
    if (map) {
      map.resize();

      if (globalThis.location.hash) {
        const hashChangeEvent = new HashChangeEvent('hashchange');
        globalThis.dispatchEvent(hashChangeEvent);
      }
    }
  });

  onMount(async () => {
    if (!mapMarkers) {
      mapMarkers = await loadMapMarkers();
    }
  });

  onDestroy(() => {
    abortController?.abort();
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

  $effect(() => {
    if (!center || !zoom) {
      return;
    }

    untrack(() => map?.jumpTo({ center, zoom }));
  });

  const onAssetsDelete = () => {
    handlePromiseError(
      loadMapMarkers().then((markers) => {
        mapMarkers = markers;
      }),
    );
  };

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => map?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 15 }),
      (err) => handlePromiseError(Promise.reject(err)),
      { enableHighAccuracy: true },
    );
  };

  const toggleMapProjection = () => {
    isGlobeView = !isGlobeView;
  };
</script>

<OnEvents {onAssetsDelete} />

<!--  We handle style loading ourselves so we set style blank here -->
<MapLibre
  {hash}
  style=""
  class="h-full {rounded ? 'rounded-2xl' : 'rounded-none'}"
  {zoom}
  {center}
  bounds={initialBounds}
  fitBoundsOptions={{ padding: 50, maxZoom: 15 }}
  attributionControl={false}
  diffStyleUpdates={true}
  projection={mapProjection}
  onload={(event: Map) => {
    event.setMaxZoom(18);
    event.on('click', handleMapClick);
  }}
  bind:map
>
  {#snippet children({ map }: { map: Map })}
    {#if showSimpleControls}
      <Control position="top-right">
        <div class="pointer-events-auto mt-3 mr-3 flex flex-col gap-3">
          {#if showSettings}
            <ControlGroup class="m-0!">
              <ControlButton title={$t('map_settings')} onclick={handleSettingsClick}>
                <Icon icon={mdiCog} size="24" />
              </ControlButton>
            </ControlGroup>
          {/if}

          {#if !simplified}
            <ControlGroup class="m-0!">
              <ControlButton
                title={isGlobeView ? $t('switch_to_flat_map') : $t('switch_to_globe_map')}
                onclick={toggleMapProjection}
              >
                <Icon icon={isGlobeView ? mdiMap : mdiEarth} size="24" />
              </ControlButton>
            </ControlGroup>
          {/if}

          {#if onOpenInMapView}
            <ControlGroup class="m-0!">
              <ControlButton title={$t('open_in_map_view')} onclick={() => void onOpenInMapView()}>
                <Icon icon={mdiMap} size="24" />
              </ControlButton>
            </ControlGroup>
          {/if}

          {#if onToggleTimeline}
            <ControlGroup class="m-0!">
              <ControlButton title={$t('timeline')} onclick={() => onToggleTimeline?.()}>
                <Icon
                  icon={mdiImageMultiple}
                  size="24"
                  class={isTimelineOpen ? 'text-immich-primary dark:text-immich-primary' : ''}
                />
              </ControlButton>
            </ControlGroup>
          {/if}
        </div>
      </Control>

      <Control position="bottom-right">
        <div class="pointer-events-auto·mr-3·mb-3·flex·flex-col·gap-3">
          {#if !simplified}
            <ControlGroup class="m-0!">
              <ControlButton title={$t('geolocate')} onclick={handleLocate}>
                <Icon icon={mdiCrosshairsGps} size="24" />
              </ControlButton>
            </ControlGroup>
          {/if}

          <ControlGroup class="m-0!">
            <ControlButton title={$t('zoom_in')} onclick={() => map?.zoomIn()}>
              <Icon icon={mdiPlus} size="24" />
            </ControlButton>
            <ControlButton title={$t('zoom_out')} onclick={() => map?.zoomOut()}>
              <Icon icon={mdiMinus} size="24" />
            </ControlButton>
          </ControlGroup>
        </div>
      </Control>

      <Control position="bottom-left">
        <div
          class="mb-3 ml-4 rounded-sm bg-white/70 px-2 py-0.5 text-[11px] font-medium text-black/80 shadow-sm backdrop-blur-md transition-all duration-300 ease-out dark:bg-immich-dark-gray/70 dark:text-white/80"
        >
          © OpenStreetMap
        </div>
      </Control>
    {/if}
    <GeoJSON
      data={{
        type: 'FeatureCollection',
        features: mapMarkers?.map((marker) => asFeature(marker)) ?? [],
      }}
      id="geojson"
      cluster={{ radius: 35, maxZoom: 17 }}
    >
      {#if $mapShowHeatmap}
        <HeatmapLayer
          id="asset-heatmap-layer"
          paint={{
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(255, 255, 255, 0)',
              0.2,
              'rgb(255, 235, 59)',
              0.4,
              'rgb(255, 152, 0)',
              0.7,
              'rgb(244, 67, 54)',
              1,
              'rgb(183, 28, 28)',
            ] as ExpressionSpecification,
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.8, 15, 2] as ExpressionSpecification,
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 15, 40] as ExpressionSpecification,
            'heatmap-opacity': 0.8,
          }}
        />
      {:else}
        <MarkerLayer
          applyToClusters
          asButton
          onclick={(event) => handlePromiseError(handleClusterClick(event.feature.properties?.cluster_id, map))}
        >
          {#snippet children({ feature })}
            <div
              class="flex size-10 items-center justify-center rounded-full bg-immich-primary font-mono font-bold text-white opacity-90 shadow-lg transition-all duration-200 hover:bg-immich-dark-primary hover:text-immich-dark-bg"
            >
              {feature.properties?.point_count?.toLocaleString()}
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
          {#snippet children({ feature }: { feature: Feature })}
            {#if useLocationPin}
              <Icon icon={mdiMapMarker} size="50px" class="translate-y-[-50%] text-primary" />
            {:else}
              <img
                src={getAssetMediaUrl({ id: feature.properties?.id })}
                class="size-15 rounded-full border-2 border-immich-primary bg-immich-primary object-cover shadow-lg transition-all duration-200 hover:scale-150 hover:border-immich-dark-primary"
                alt={feature.properties?.city && feature.properties.country
                  ? $t('map_marker_for_image', {
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
      {/if}
    </GeoJSON>
  {/snippet}
</MapLibre>
