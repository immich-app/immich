<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import CoordinatesInput from '$lib/components/shared-components/coordinates-input.svelte';
  import type Map from '$lib/components/shared-components/map/map.svelte';
  import { timeDebounceOnSearch, timeToLoadTheMap } from '$lib/constants';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { lastChosenLocation } from '$lib/stores/asset-editor.store';
  import { delay } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import {
    createFavoriteLocation,
    deleteFavoriteLocation,
    getFavoriteLocations,
    searchPlaces,
    type AssetResponseDto,
    type FavoriteLocationResponseDto,
    type PlacesResponseDto,
  } from '@immich/sdk';
  import { Button, ConfirmModal, IconButton, Input, LoadingSpinner } from '@immich/ui';
  import { mdiDelete, mdiMapMarkerMultipleOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { get } from 'svelte/store';
  interface Point {
    lng: number;
    lat: number;
  }

  interface Props {
    asset?: AssetResponseDto | undefined;
    point?: Point;
    onClose: (point?: Point) => void;
  }

  let { asset = undefined, point: initialPoint, onClose }: Props = $props();

  let places: PlacesResponseDto[] = $state([]);
  let suggestedPlaces: PlacesResponseDto[] = $derived(places.slice(0, 5));
  let searchWord: string = $state('');
  let latestSearchTimeout: number;
  let showLoadingSpinner = $state(false);
  let suggestionContainer: HTMLDivElement | undefined = $state();
  let hideSuggestion = $state(false);
  let mapElement = $state<ReturnType<typeof Map>>();

  let previousLocation = get(lastChosenLocation);

  let assetLat = $derived(initialPoint?.lat ?? asset?.exifInfo?.latitude ?? undefined);
  let assetLng = $derived(initialPoint?.lng ?? asset?.exifInfo?.longitude ?? undefined);

  let mapLat = $derived(assetLat ?? previousLocation?.lat ?? undefined);
  let mapLng = $derived(assetLng ?? previousLocation?.lng ?? undefined);

  let zoom = $derived(mapLat && mapLng ? 12.5 : 1);

  let favoriteLocations: FavoriteLocationResponseDto[] = $state([]);
  let newFavoriteName = $state('');
  let savingFavorite = $state(false);

  const loadFavoriteLocations = async () => {
    try {
      favoriteLocations = await getFavoriteLocations();
    } catch (error) {
      handleError(error, 'Failed to load favorite locations');
    }
  };

  onMount(async () => {
    await loadFavoriteLocations();
  });

  $effect(() => {
    if (mapElement && initialPoint) {
      mapElement.addClipMapMarker(initialPoint.lng, initialPoint.lat);
    }
  });

  $effect(() => {
    if (searchWord === '') {
      suggestedPlaces = [];
    }
  });

  let point: Point | null = $state(initialPoint ?? null);

  const handleConfirm = (confirmed?: boolean) => {
    if (point && confirmed) {
      lastChosenLocation.set(point);
      onClose(point);
    } else {
      onClose();
    }
  };

  const handleSaveFavorite = async () => {
    if (newFavoriteName.trim() === '') {
      return;
    }

    savingFavorite = true;
    try {
      const newLocation: FavoriteLocationResponseDto = await createFavoriteLocation({
        createFavoriteLocationDto: {
          name: newFavoriteName,
          latitude: point!.lat,
          longitude: point!.lng,
        },
      });
      favoriteLocations = [...favoriteLocations, newLocation];
      favoriteLocations = favoriteLocations.sort((a, b) => a.name.localeCompare(b.name));
      newFavoriteName = '';
    } catch (error) {
      handleError(error, 'Failed to save favorite location');
    } finally {
      savingFavorite = false;
    }
  };

  const handleDeleteFavorite = async (locationId: string) => {
    try {
      await deleteFavoriteLocation({ id: locationId });
      favoriteLocations = favoriteLocations.filter((loc) => loc.id !== locationId);
    } catch (error) {
      handleError(error, 'Failed to delete favorite location');
    }
  };

  const getLocation = (name: string, admin1Name?: string, admin2Name?: string): string => {
    return `${name}${admin1Name ? ', ' + admin1Name : ''}${admin2Name ? ', ' + admin2Name : ''}`;
  };

  const handleSearchPlaces = () => {
    if (latestSearchTimeout) {
      clearTimeout(latestSearchTimeout);
    }
    showLoadingSpinner = true;

    // eslint-disable-next-line unicorn/prefer-global-this
    const searchTimeout = window.setTimeout(() => {
      if (searchWord === '') {
        places = [];
        showLoadingSpinner = false;
        return;
      }

      // Try to parse coordinate pair from search input in the format `LATITUDE, LONGITUDE` as floats
      const coordinateParts = searchWord.split(',').map((part) => part.trim());
      if (coordinateParts.length === 2) {
        const coordinateLat = Number.parseFloat(coordinateParts[0]);
        const coordinateLng = Number.parseFloat(coordinateParts[1]);

        if (
          !Number.isNaN(coordinateLat) &&
          !Number.isNaN(coordinateLng) &&
          coordinateLat >= -90 &&
          coordinateLat <= 90 &&
          coordinateLng >= -180 &&
          coordinateLng <= 180
        ) {
          places = [];
          showLoadingSpinner = false;
          handleUseSuggested(coordinateLat, coordinateLng);
          return;
        }
      }

      searchPlaces({ name: searchWord })
        .then((searchResult) => {
          // skip result when a newer search is happening
          if (latestSearchTimeout === searchTimeout) {
            places = searchResult;
            showLoadingSpinner = false;
          }
        })
        .catch((error) => {
          // skip error when a newer search is happening
          if (latestSearchTimeout === searchTimeout) {
            places = [];
            handleError(error, $t('errors.cant_search_places'));
            showLoadingSpinner = false;
          }
        });
    }, timeDebounceOnSearch);
    latestSearchTimeout = searchTimeout;
  };

  const handleUseSuggested = (latitude: number, longitude: number, setZoom?: number) => {
    hideSuggestion = true;
    point = { lng: longitude, lat: latitude };
    mapElement?.addClipMapMarker(longitude, latitude);
    if (setZoom) {
      zoom = setZoom;
    }
  };

  const onUpdate = (lat: number, lng: number) => {
    point = { lat, lng };
    mapElement?.addClipMapMarker(lng, lat);
  };
</script>

<ConfirmModal
  confirmColor="primary"
  title={$t('change_location')}
  icon={mdiMapMarkerMultipleOutline}
  size="medium"
  onClose={handleConfirm}
>
  {#snippet prompt()}
    <div class="flex flex-col w-full h-full gap-2">
      <div class="relative w-64 sm:w-96 z-1">
        {#if suggestionContainer}
          <div use:listNavigation={suggestionContainer}>
            <button type="button" class="w-full" onclick={() => (hideSuggestion = false)}>
              <SearchBar
                placeholder={$t('search_places')}
                bind:name={searchWord}
                {showLoadingSpinner}
                onReset={() => (suggestedPlaces = [])}
                onSearch={handleSearchPlaces}
                roundedBottom={suggestedPlaces.length === 0 || hideSuggestion}
              />
            </button>
          </div>
        {/if}

        <div
          class="absolute w-full"
          id="suggestion"
          bind:this={suggestionContainer}
          use:clickOutside={{ onOutclick: () => (hideSuggestion = true) }}
        >
          {#if !hideSuggestion}
            {#each suggestedPlaces as place, index (place.latitude + place.longitude)}
              <button
                type="button"
                class=" flex w-full border-t border-gray-400 dark:border-immich-dark-gray h-14 place-items-center bg-gray-200 p-2 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-[#232932] focus:bg-gray-300 focus:dark:bg-[#232932] {index ===
                suggestedPlaces.length - 1
                  ? 'rounded-b-lg border-b'
                  : ''}"
                onclick={() => handleUseSuggested(place.latitude, place.longitude)}
              >
                <p class="ms-4 text-sm text-gray-700 dark:text-gray-100 truncate">
                  {getLocation(place.name, place.admin1name, place.admin2name)}
                </p>
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <span>{$t('pick_a_location')}</span>
      <div class="h-125 min-h-75 w-full z-0">
        {#await import('$lib/components/shared-components/map/map.svelte')}
          {#await delay(timeToLoadTheMap) then}
            <!-- show the loading spinner only if loading the map takes too much time -->
            <div class="flex items-center justify-center h-full w-full">
              <LoadingSpinner />
            </div>
          {/await}
        {:then { default: Map }}
          <Map
            bind:this={mapElement}
            mapMarkers={assetLat !== undefined && assetLng !== undefined && asset
              ? [
                  {
                    id: asset.id,
                    lat: assetLat,
                    lon: assetLng,
                    city: asset.exifInfo?.city ?? null,
                    state: asset.exifInfo?.state ?? null,
                    country: asset.exifInfo?.country ?? null,
                  },
                ]
              : []}
            {zoom}
            center={mapLat && mapLng ? { lat: mapLat, lng: mapLng } : undefined}
            simplified={true}
            clickable={true}
            onClickPoint={(selected) => (point = selected)}
            showSettings={false}
            rounded
          />
        {/await}
      </div>

      <div class="grid sm:grid-cols-2 gap-4 text-sm text-start mt-4">
        <CoordinatesInput lat={point ? point.lat : assetLat} lng={point ? point.lng : assetLng} {onUpdate} />
      </div>

      <div class="mt-4">
        <div class="flex justify-between items-center gap-2 mb-2">
          <p>{$t('favorite_locations')}</p>
          <div class="flex gap-2 items-center justify-end">
            <Input placeholder={$t('name')} size="tiny" bind:value={newFavoriteName} />
            <Button
              onclick={handleSaveFavorite}
              disabled={newFavoriteName.trim() === '' || savingFavorite || point === null}
              variant="outline"
              size="tiny"
              class="shrink-0">{$t('save')}</Button
            >
          </div>
        </div>

        <div class="max-h-40 overflow-y-auto border border-gray-300 dark:border-immich-dark-gray rounded-md p-2">
          {#if favoriteLocations.length === 0}
            <p class="text-sm text-gray-500 dark:text-gray-400">{$t('favorite_locations_not_found')}</p>
          {:else}
            <ul class="space-y-2">
              {#each favoriteLocations as location (location.id)}
                <li>
                  <button
                    type="button"
                    class="w-full"
                    onclick={() => handleUseSuggested(location.latitude!, location.longitude!, 14)}
                  >
                    <div
                      class="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 hover:dark:bg-gray-700"
                    >
                      {location.name}
                      <IconButton
                        icon={mdiDelete}
                        shape="round"
                        variant="outline"
                        size="medium"
                        color="danger"
                        aria-label={$t('delete')}
                        onclick={async (e: Event) => {
                          e.stopPropagation();
                          await handleDeleteFavorite(location.id);
                        }}
                      />
                    </div>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>
  {/snippet}
</ConfirmModal>
