<script lang="ts" module>
  import mapboxRtlUrl from '@mapbox/mapbox-gl-rtl-text?url';
  import maplibregl, { addProtocol, setRTLTextPlugin } from 'maplibre-gl';
  import MaplibreWorker from 'maplibre-gl/dist/maplibre-gl-csp-worker?worker';
  import { Protocol } from 'pmtiles';

  // @ts-expect-error maplibregl types do not include workerClass, but it is required for CSP
  maplibregl.workerClass = MaplibreWorker;

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
    mdiFullscreen,
    mdiFullscreenExit,
    mdiImageMultiple,
    mdiEarth,
    mdiMap,
    mdiMapMarker,
    mdiMinus,
    mdiPlus,
  } from '@mdi/js';
  import type { Feature, Point } from 'geojson';
  import { debounce, isEqual } from 'lodash-es';
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
  import { GeoJSON, HeatmapLayer, MapLibre, MarkerLayer, Popup } from 'svelte-maplibre';
  import type { SelectionBBox } from './types';
  import { autoZoomCluster } from './utils';

  interface Props {
    mapMarkers?: MapMarkerResponseDto[];
    showSettings?: boolean;
    zoom?: number | undefined;
    center?: LngLatLike | undefined;
    simplified?: boolean;
    clickable?: boolean;
    useLocationPin?: boolean;
    onOpenInMapView?: (() => Promise<void> | void) | undefined;
    onSelect?: (assetIds: string[]) => void;
    onClusterSelect?: (assetIds: string[], bbox: SelectionBBox) => void;
    onBoundsChange?: (bbox: SelectionBBox) => void;
    visibleAssetIds?: Set<string> | undefined;
    onClickPoint?: ({ lat, lng }: { lat: number; lng: number }) => void;
    popup?: import('svelte').Snippet<[{ marker: MapMarkerResponseDto }]>;
    rounded?: boolean;
    autoFitBounds?: boolean;
    isTimelineOpen?: boolean;
    onToggleTimeline?: () => void;
    sheetHeight?: number;
    isDraggingSheet?: boolean;
  }

  let {
    mapMarkers = $bindable(),
    showSettings = true,
    zoom = undefined,
    center = $bindable(undefined),
    simplified = false,
    clickable = false,
    useLocationPin = false,
    onOpenInMapView = undefined,
    onSelect = () => {},
    onClusterSelect,
    onBoundsChange,
    visibleAssetIds,
    onClickPoint = () => {},
    popup,
    rounded = false,
    autoFitBounds = true,
    isTimelineOpen = false,
    onToggleTimeline,
    sheetHeight = 50,
    isDraggingSheet = false,
  }: Props = $props();

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
  let isFullscreen = $state(false);
  let isGlobeView = $state(false);

  let innerWidth = $state(1024);
  let isMobile = $derived(innerWidth < 768);
  let hideMapControls = $derived(isMobile && sheetHeight > 40);

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

  void addClipMapMarker;

  function handleAssetClick(assetId: string, map: Map | null) {
    if (!map) {
      return;
    }
    onSelect([assetId]);
  }

  async function handleClusterClick(clusterId: number, mapInstance: Map | null) {
    if (!mapInstance) {
      return;
    }
    const mapSource = mapInstance.getSource('geojson') as GeoJSONSource;

    await autoZoomCluster({
      map: mapInstance,
      mapSource,
      clusterId,
      onSelect,
      onClusterSelect,
    });
  }

  const handleBoundsChange = debounce(() => {
    if (!map || !onBoundsChange) {
      return;
    }

    const bounds = map.getBounds();
    if (!bounds) {
      return;
    }

    let west = bounds.getWest();
    let east = bounds.getEast();
    let south = Math.max(-90, Math.min(90, bounds.getSouth()));
    let north = Math.max(-90, Math.min(90, bounds.getNorth()));

    if (east - west >= 360) {
      west = -180;
      east = 180;
    } else {
      west = bounds.getSouthWest().wrap().lng;
      east = bounds.getNorthEast().wrap().lng;
    }

    onBoundsChange({ west, south, east, north });
  }, 200);

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
      return { fileCreatedAfter: duration.isValid ? DateTime.now().minus(duration).toISO() : undefined };
    }
    return {
      fileCreatedAfter: dateAfter?.toUTC().toISO(),
      fileCreatedBefore: dateBefore?.toUTC().toISO(),
    };
  }

  const filter: ExpressionSpecification | undefined = $derived.by(() =>
    visibleAssetIds
      ? (['in', ['get', 'id'], ['literal', Array.from(visibleAssetIds)]] as unknown as ExpressionSpecification)
      : undefined,
  );

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
      { signal: abortController.signal },
    );
  }

  const handleSettingsClick = () => {
    handlePromiseError(
      modalManager.show(MapSettingsModal, { settings: { ...$mapSettings } }).then(async (settings) => {
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

  onMount(() => {
    void loadMapMarkers().then((markers) => {
      if (!mapMarkers) {
        mapMarkers = markers;
      }
    });
  });

  onDestroy(() => {
    abortController?.abort();
  });

  $effect(() => {
    map?.setStyle(styleUrl, {
      transformStyle: (previousStyle, nextStyle) => {
        if (previousStyle) {
          const customLayers = previousStyle.layers.filter((l) => l.type === 'fill' && l.source === 'geojson');
          const layers = nextStyle.layers.concat(customLayers);
          const sources = nextStyle.sources;
          for (const [key, value] of Object.entries(previousStyle.sources || {})) {
            if (key.startsWith('geojson')) {
              sources[key] = value;
            }
          }
          return { ...nextStyle, sources, layers };
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

  $effect(() => {
    const currentMap = map;
    if (!currentMap) {
      return;
    }

    if (isMobile && isTimelineOpen) {
      const bottomPadding = (sheetHeight / 100) * innerHeight;
      untrack(() => {
        currentMap.setPadding({ top: 0, left: 0, right: 0, bottom: bottomPadding });
      });
    } else {
      untrack(() => {
        currentMap.setPadding({ top: 0, left: 0, right: 0, bottom: 0 });
      });
    }
  });

  const onAssetsDelete = () => {
    handlePromiseError(
      loadMapMarkers().then((markers) => {
        mapMarkers = markers;
      }),
    );
  };

  const toggleFullscreen = () => {
    if (!map) {
      return;
    }
    const container = map.getContainer().parentElement;
    if (!container) {
      return;
    }

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      isFullscreen = false;
    } else {
      container.requestFullscreen().catch(() => {});
      isFullscreen = true;
    }
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

<svelte:window bind:innerWidth />

<OnEvents {onAssetsDelete} />

<MapLibre
  hash={false}
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
    event.on('moveend', handleBoundsChange);
    event.on('zoomend', handleBoundsChange);

    handleBoundsChange();

    event.on('mouseenter', 'geojson-clusters', () => {
      event.getCanvas().style.cursor = 'pointer';
    });
    event.on('mouseleave', 'geojson-clusters', () => {
      event.getCanvas().style.cursor = '';
    });

    document.addEventListener('fullscreenchange', () => {
      isFullscreen = !!document.fullscreenElement;
    });
  }}
  bind:map
>
  {#snippet children({ map }: { map: Map })}
    <div class="pointer-events-none absolute inset-0 z-10 p-4">
      <div class="pointer-events-auto absolute top-4 right-4 flex flex-col gap-3">
        {#if showSettings}
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/70 text-black/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 dark:border-white/10 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
            title={$t('map_settings')}
            onclick={handleSettingsClick}
          >
            <Icon icon={mdiCog} size="24" />
          </button>
        {/if}

        {#if !simplified}
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/70 text-black/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 dark:border-white/10 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
            title={isGlobeView ? $t('switch_to_flat_map') : $t('switch_to_globe_map')}
            aria-pressed={isGlobeView}
            onclick={toggleMapProjection}
          >
            <Icon icon={isGlobeView ? mdiMap : mdiEarth} size="24" />
          </button>

          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/70 text-black/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 dark:border-white/10 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
            title={isFullscreen ? $t('exit_fullscreen') : $t('fullscreen')}
            onclick={toggleFullscreen}
          >
            <Icon icon={isFullscreen ? mdiFullscreenExit : mdiFullscreen} size="24" />
          </button>
        {/if}

        {#if onOpenInMapView}
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/70 text-black/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 dark:border-white/10 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
            title={$t('open_in_map_view')}
            onclick={() => void onOpenInMapView()}
          >
            <Icon icon={mdiMap} size="24" />
          </button>
        {/if}

        {#if onToggleTimeline}
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/70 text-black/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 dark:border-white/10 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
            title={$t('timeline')}
            onclick={() => onToggleTimeline?.()}
          >
            <Icon
              icon={mdiImageMultiple}
              size="24"
              class={isTimelineOpen ? 'text-immich-primary dark:text-immich-primary' : ''}
            />
          </button>
        {/if}
      </div>

      {#if !simplified}
        <div
          class="absolute right-4 flex flex-col gap-3 transition-all duration-300 ease-out"
          class:opacity-0={hideMapControls}
          class:pointer-events-none={hideMapControls}
          class:pointer-events-auto={!hideMapControls}
          class:transition-none={isDraggingSheet}
          style:bottom={isTimelineOpen && isMobile ? `calc(${Math.min(sheetHeight, 40)}vh + 1rem)` : '2.5rem'}
        >
          <button
            type="button"
            class="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/70 text-black/80 shadow-lg backdrop-blur-md transition-all hover:bg-white/90 dark:border-white/10 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
            title={$t('geolocate')}
            onclick={handleLocate}
          >
            <Icon icon={mdiCrosshairsGps} size="24" />
          </button>

          <div
            class="flex flex-col overflow-hidden rounded-2xl border border-white/20 shadow-lg backdrop-blur-md dark:border-white/10"
          >
            <button
              type="button"
              class="flex size-11 items-center justify-center bg-white/70 text-black/80 transition-all hover:bg-white/90 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
              title={$t('zoom_in')}
              onclick={() => map.zoomIn()}
            >
              <Icon icon={mdiPlus} size="24" />
            </button>
            <div class="h-px w-full bg-black/10 dark:bg-white/10"></div>
            <button
              type="button"
              class="flex size-11 items-center justify-center bg-white/70 text-black/80 transition-all hover:bg-white/90 dark:bg-immich-dark-gray/70 dark:text-white/80 dark:hover:bg-immich-dark-gray/90"
              title={$t('zoom_out')}
              onclick={() => map.zoomOut()}
            >
              <Icon icon={mdiMinus} size="24" />
            </button>
          </div>
        </div>
      {/if}

      <div
        class="absolute left-4 rounded-sm bg-white/70 px-2 py-0.5 text-[11px] font-medium text-black/80 shadow-sm backdrop-blur-md ease-out {isDraggingSheet
          ? 'transition-none'
          : 'transition-all duration-300'} dark:bg-immich-dark-gray/70 dark:text-white/80"
        class:opacity-0={hideMapControls}
        class:pointer-events-none={hideMapControls}
        class:pointer-events-auto={!hideMapControls}
        style:bottom={isTimelineOpen && isMobile ? `calc(${Math.min(sheetHeight, 40)}vh + 0.5rem)` : '0.5rem'}
      >
        © OpenStreetMap
      </div>
    </div>

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
          filter={filter as never}
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
      {/if}
    </GeoJSON>
  {/snippet}
</MapLibre>
