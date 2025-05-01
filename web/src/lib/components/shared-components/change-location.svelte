<script lang="ts">
  import ConfirmDialog from './dialog/confirm-dialog.svelte';
  import { timeDebounceOnSearch } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { lastChosenLocation } from '$lib/stores/asset-editor.store';

  import { clickOutside } from '$lib/actions/click-outside';
  import LoadingSpinner from './loading-spinner.svelte';
  import { delay } from '$lib/utils/asset-utils';
  import { timeToLoadTheMap } from '$lib/constants';
  import { searchPlaces, type AssetResponseDto, type PlacesResponseDto } from '@immich/sdk';
  import SearchBar from '../elements/search-bar.svelte';
  import { listNavigation } from '$lib/actions/list-navigation';
  import { t } from 'svelte-i18n';
  import CoordinatesInput from '$lib/components/shared-components/coordinates-input.svelte';
  import type Map from '$lib/components/shared-components/map/map.svelte';
  import { get } from 'svelte/store';
  interface Point {
    lng: number;
    lat: number;
  }

  interface Props {
    asset?: AssetResponseDto | undefined;
    onCancel: () => void;
    onConfirm: (point: Point) => void;
  }

  let { asset = undefined, onCancel, onConfirm }: Props = $props();

  let places: PlacesResponseDto[] = $state([]);
  let suggestedPlaces: PlacesResponseDto[] = $state([]);
  let searchWord: string = $state('');
  let latestSearchTimeout: number;
  let showLoadingSpinner = $state(false);
  let suggestionContainer: HTMLDivElement | undefined = $state();
  let hideSuggestion = $state(false);
  let mapElement = $state<ReturnType<typeof Map>>();

  let previousLocation = get(lastChosenLocation);

  let assetLat = $derived(asset?.exifInfo?.latitude ?? undefined);
  let assetLng = $derived(asset?.exifInfo?.longitude ?? undefined);

  let mapLat = $derived(assetLat ?? previousLocation?.lat ?? undefined);
  let mapLng = $derived(assetLng ?? previousLocation?.lng ?? undefined);

  let zoom = $derived(mapLat !== undefined && mapLng !== undefined ? 12.5 : 1);

  $effect(() => {
    if (places) {
      suggestedPlaces = places.slice(0, 5);
    }
    if (searchWord === '') {
      suggestedPlaces = [];
    }
  });

  let point: Point | null = $state(null);

  const handleConfirm = () => {
    if (point) {
      lastChosenLocation.set(point);
      onConfirm(point);
    } else {
      onCancel();
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

  const handleUseSuggested = (latitude: number, longitude: number) => {
    hideSuggestion = true;
    point = { lng: longitude, lat: latitude };
    mapElement?.addClipMapMarker(longitude, latitude);
  };
</script>

<ConfirmDialog confirmColor="primary" title={$t('change_location')} width="wide" onConfirm={handleConfirm} {onCancel}>
  {#snippet promptSnippet()}
    <div class="flex flex-col w-full h-full gap-2">
      <div class="relative w-64 sm:w-96">
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
          class="absolute z-[99] w-full"
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
      <div class="h-[500px] min-h-[300px] w-full">
        {#await import('../shared-components/map/map.svelte')}
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
          />
        {/await}
      </div>

      <div class="grid sm:grid-cols-2 gap-4 text-sm text-start mt-4">
        <CoordinatesInput
          lat={point ? point.lat : assetLat}
          lng={point ? point.lng : assetLng}
          onUpdate={(lat, lng) => {
            point = { lat, lng };
            mapElement?.addClipMapMarker(lng, lat);
          }}
        />
      </div>
    </div>
  {/snippet}
</ConfirmDialog>
