<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from './confirm-dialogue.svelte';
  import { timeDebounceOnSearch } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';

  import { clickOutside } from '$lib/utils/click-outside';
  import LoadingSpinner from './loading-spinner.svelte';
  import { delay } from '$lib/utils/asset-utils';
  import { timeToLoadTheMap } from '$lib/constants';
  import { searchPlaces, type AssetResponseDto, type PlacesResponseDto } from '@immich/sdk';
  import SearchBar from '../elements/search-bar.svelte';
  import { listNavigation } from '$lib/utils/list-navigation';

  export let asset: AssetResponseDto | undefined = undefined;

  interface Point {
    lng: number;
    lat: number;
  }

  let places: PlacesResponseDto[] = [];
  let suggestedPlaces: PlacesResponseDto[] = [];
  let searchWord: string;
  let latestSearchTimeout: number;
  let showLoadingSpinner = false;
  let suggestionContainer: HTMLDivElement;
  let hideSuggestion = false;
  let addClipMapMarker: (long: number, lat: number) => void;

  const dispatch = createEventDispatcher<{
    cancel: void;
    confirm: Point;
  }>();

  $: lat = asset?.exifInfo?.latitude || 0;
  $: lng = asset?.exifInfo?.longitude || 0;
  $: zoom = lat && lng ? 15 : 1;

  $: {
    if (places) {
      suggestedPlaces = places.slice(0, 5);
    }
    if (searchWord === '') {
      suggestedPlaces = [];
    }
  }

  let point: Point | null = null;

  const handleCancel = () => dispatch('cancel');

  const handleSelect = (selected: Point) => {
    point = selected;
  };

  const handleConfirm = () => {
    if (point) {
      dispatch('confirm', point);
    } else {
      dispatch('cancel');
    }
  };

  const getLocation = (name: string, admin1Name?: string, admin2Name?: string): string => {
    return `${name}${admin1Name ? ', ' + admin1Name : ''}${admin2Name ? ', ' + admin2Name : ''}`;
  };

  const handleSearchPlaces = () => {
    if (searchWord === '') {
      return;
    }

    if (latestSearchTimeout) {
      clearTimeout(latestSearchTimeout);
    }
    showLoadingSpinner = true;
    const searchTimeout = window.setTimeout(() => {
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
            handleError(error, "Can't search places");
            showLoadingSpinner = false;
          }
        });
    }, timeDebounceOnSearch);
    latestSearchTimeout = searchTimeout;
  };

  const handleUseSuggested = (latitude: number, longitude: number) => {
    hideSuggestion = true;
    point = { lng: longitude, lat: latitude };
    addClipMapMarker(longitude, latitude);
  };
</script>

<ConfirmDialogue
  id="change-location-modal"
  confirmColor="primary"
  title="Change location"
  width="wide"
  onConfirm={handleConfirm}
  onClose={handleCancel}
>
  <div slot="prompt" class="flex flex-col w-full h-full gap-2">
    <div
      class="relative w-64 sm:w-96"
      use:clickOutside={{ onOutclick: () => (hideSuggestion = true) }}
      use:listNavigation={suggestionContainer}
    >
      <button class="w-full" on:click={() => (hideSuggestion = false)}>
        <SearchBar
          placeholder="Search places"
          bind:name={searchWord}
          {showLoadingSpinner}
          on:reset={() => {
            suggestedPlaces = [];
          }}
          on:search={handleSearchPlaces}
          roundedBottom={suggestedPlaces.length === 0 || hideSuggestion}
        />
      </button>
      <div class="absolute z-[99] w-full" id="suggestion" bind:this={suggestionContainer}>
        {#if !hideSuggestion}
          {#each suggestedPlaces as place, index}
            <button
              class=" flex w-full border-t border-gray-400 dark:border-immich-dark-gray h-14 place-items-center bg-gray-200 p-2 dark:bg-gray-700 hover:bg-gray-300 hover:dark:bg-[#232932] focus:bg-gray-300 focus:dark:bg-[#232932] {index ===
              suggestedPlaces.length - 1
                ? 'rounded-b-lg border-b'
                : ''}"
              on:click={() => handleUseSuggested(place.latitude, place.longitude)}
            >
              <p class="ml-4 text-sm text-gray-700 dark:text-gray-100 truncate">
                {getLocation(place.name, place.admin1name, place.admin2name)}
              </p>
            </button>
          {/each}
        {/if}
      </div>
    </div>
    <label for="datetime">Pick a location</label>
    <div class="h-[500px] min-h-[300px] w-full">
      {#await import('../shared-components/map/map.svelte')}
        {#await delay(timeToLoadTheMap) then}
          <!-- show the loading spinner only if loading the map takes too much time -->
          <div class="flex items-center justify-center h-full w-full">
            <LoadingSpinner />
          </div>
        {/await}
      {:then component}
        <svelte:component
          this={component.default}
          mapMarkers={lat && lng && asset
            ? [
                {
                  id: asset.id,
                  lat,
                  lon: lng,
                  city: asset.exifInfo?.city ?? null,
                  state: asset.exifInfo?.state ?? null,
                  country: asset.exifInfo?.country ?? null,
                },
              ]
            : []}
          {zoom}
          bind:addClipMapMarker
          center={lat && lng ? { lat, lng } : undefined}
          simplified={true}
          clickable={true}
          on:clickedPoint={({ detail: point }) => handleSelect(point)}
        />
      {/await}
    </div>
  </div>
</ConfirmDialogue>
