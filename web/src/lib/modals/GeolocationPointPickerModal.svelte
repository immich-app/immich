<script lang="ts">
  import { isDefined } from '$lib';
  import { clickOutside } from '$lib/actions/click-outside';
  import { listNavigation } from '$lib/actions/list-navigation';
  import CoordinatesInput from '$lib/components/shared-components/CoordinatesInput.svelte';
  import type Map from '$lib/components/shared-components/map/Map.svelte';
  import { timeDebounceOnSearch, timeToLoadTheMap } from '$lib/constants';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { geolocationManager } from '$lib/managers/geolocation.manager.svelte';
  import type { LatLng } from '$lib/types';
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

  type Props = {
    asset?: AssetResponseDto;
    point?: LatLng;
    onClose: (point?: LatLng) => void;
  };

  let { asset, point: initialPoint, onClose }: Props = $props();

  let places: PlacesResponseDto[] = $state([]);
  let suggestedPlaces: PlacesResponseDto[] = $derived(places.slice(0, 5));
  let searchWord: string = $state('');
  let latestSearchTimeout: number;
  let showLoadingSpinner = $state(false);
  let suggestionContainer: HTMLDivElement | undefined = $state();
  let hideSuggestion = $state(false);
  let mapElement = $state<ReturnType<typeof Map>>();
  let favoriteLocations: FavoriteLocationResponseDto[] = $state([]);
  let favoriteName = $state('');
  let savingFavorite = $state(false);

  let assetPoint = $derived.by<LatLng | undefined>(() => {
    if (!asset || !asset.exifInfo) {
      return;
    }

    const { latitude, longitude } = asset.exifInfo;
    if (!isDefined(latitude) || !isDefined(longitude)) {
      return;
    }

    return { lat: latitude, lng: longitude };
  });

  let point = $state<LatLng | undefined>(initialPoint ?? assetPoint);
  let zoom = $state(point ? 12.5 : 1);
  let center = $state(point ?? geolocationManager.lastPoint);

  onMount(async () => {
    try {
      favoriteLocations = await getFavoriteLocations();
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_favorite_locations'));
    }
  });

  $effect(() => {
    if (mapElement && initialPoint) {
      mapElement.addClipMapMarker(initialPoint.lng, initialPoint.lat);
    }
  });

  const handleConfirm = (confirmed?: boolean) => {
    if (point && confirmed) {
      geolocationManager.onSelected(point);
      onClose(point);
    } else {
      onClose();
    }
  };

  const getLocation = (name: string, admin1Name?: string, admin2Name?: string): string => {
    return [name, admin1Name, admin2Name].filter(Boolean).join(', ');
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
        const coordinateLat = Number(coordinateParts[0]);
        const coordinateLng = Number(coordinateParts[1]);

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
          if (latestSearchTimeout !== searchTimeout) {
            return;
          }

          places = searchResult;
          showLoadingSpinner = false;
        })
        .catch((error) => {
          // skip error when a newer search is happening
          if (latestSearchTimeout !== searchTimeout) {
            return;
          }

          places = [];
          handleError(error, $t('errors.cant_search_places'));
          showLoadingSpinner = false;
        });
    }, timeDebounceOnSearch);
    latestSearchTimeout = searchTimeout;
  };

  const handleUseSuggested = (latitude: number, longitude: number, zoomLevel?: number) => {
    hideSuggestion = true;
    point = { lng: longitude, lat: latitude };
    center = point;
    mapElement?.addClipMapMarker(longitude, latitude);
    if (zoomLevel) {
      zoom = zoomLevel;
    }
  };

  const handleSaveFavorite = async () => {
    const name = favoriteName.trim();
    if (!name || !point || savingFavorite) {
      return;
    }

    savingFavorite = true;
    try {
      const favorite = await createFavoriteLocation({
        favoriteLocationCreateDto: {
          name,
          latitude: point.lat,
          longitude: point.lng,
        },
      });
      favoriteLocations = [...favoriteLocations, favorite].toSorted((a, b) => a.name.localeCompare(b.name));
      favoriteName = '';
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_favorite_location'));
    } finally {
      savingFavorite = false;
    }
  };

  const handleDeleteFavorite = async (id: string) => {
    try {
      await deleteFavoriteLocation({ id });
      favoriteLocations = favoriteLocations.filter((favorite) => favorite.id !== id);
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_favorite_location'));
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
    <div class="flex size-full flex-col gap-2">
      <div class="relative z-1 w-64 sm:w-96" use:clickOutside={{ onOutclick: () => (hideSuggestion = true) }}>
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
          class="absolute w-full rounded-b-lg bg-gray-200 dark:bg-gray-700"
          id="suggestion"
          bind:this={suggestionContainer}
        >
          {#if !hideSuggestion}
            {#each suggestedPlaces as place (place.latitude + place.longitude)}
              <button
                type="button"
                class="flex h-12 w-full place-items-center border-t border-gray-400 px-5 last:rounded-b-lg last:border-b hover:bg-gray-300 focus:bg-gray-300 dark:border-immich-dark-gray hover:dark:bg-[#232932] focus:dark:bg-[#232932]"
                onclick={() => handleUseSuggested(place.latitude, place.longitude)}
              >
                <p class="truncate text-sm text-gray-700 dark:text-gray-100">
                  {getLocation(place.name, place.admin1name, place.admin2name)}
                </p>
              </button>
            {/each}
          {/if}
        </div>
      </div>

      <span>{$t('pick_a_location')}</span>
      <div class="z-0 h-125 min-h-75 w-full">
        {#await import('$lib/components/shared-components/map/Map.svelte')}
          {#await delay(timeToLoadTheMap) then}
            <!-- show the loading spinner only if loading the map takes too much time -->
            <div class="flex size-full items-center justify-center">
              <LoadingSpinner />
            </div>
          {/await}
        {:then { default: Map }}
          <Map
            bind:this={mapElement}
            mapMarkers={asset && assetPoint
              ? [
                  {
                    id: asset.id,
                    lat: assetPoint.lat,
                    lon: assetPoint.lng,
                    city: asset.exifInfo?.city ?? null,
                    state: asset.exifInfo?.state ?? null,
                    country: asset.exifInfo?.country ?? null,
                  },
                ]
              : []}
            {zoom}
            {center}
            simplified={true}
            clickable={true}
            onClickPoint={(selected) => (point = selected)}
            showSettings={false}
            rounded
          />
        {/await}
      </div>

      <div class="mt-4 grid gap-4 text-start text-sm sm:grid-cols-2">
        <CoordinatesInput lat={point?.lat} lng={point?.lng} {onUpdate} />
      </div>

      <section class="mt-4 text-start" aria-label={$t('favorite_locations')}>
        <div class="mb-2 flex items-center gap-2">
          <Input bind:value={favoriteName} placeholder={$t('favorite_location_name_placeholder')} />
          <Button
            size="tiny"
            variant="outline"
            disabled={!point || favoriteName.trim() === '' || savingFavorite}
            onclick={handleSaveFavorite}
          >
            {$t('save')}
          </Button>
        </div>

        {#if favoriteLocations.length === 0}
          <p class="text-sm text-gray-500 dark:text-gray-400">{$t('favorite_locations_not_found')}</p>
        {:else}
          <ul class="max-h-40 space-y-1 overflow-y-auto">
            {#each favoriteLocations as favorite (favorite.id)}
              <li class="flex items-center gap-2">
                <button
                  type="button"
                  class="flex-1 truncate rounded px-3 py-2 text-start hover:bg-gray-200 dark:hover:bg-gray-700"
                  onclick={() => handleUseSuggested(favorite.latitude, favorite.longitude, 14)}
                >
                  {favorite.name}
                </button>
                <IconButton
                  icon={mdiDelete}
                  size="small"
                  color="danger"
                  aria-label={$t('delete_favorite_location', { values: { name: favorite.name } })}
                  onclick={() => handleDeleteFavorite(favorite.id)}
                />
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>
  {/snippet}
</ConfirmModal>
