<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from './confirm-dialogue.svelte';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';

  import { clickOutside } from '$lib/utils/click-outside';
  import LoadingSpinner from './loading-spinner.svelte';
  import { delay } from '$lib/utils/asset-utils';
  import { timeToLoadTheMap } from '$lib/constants';
  import { searchPlaces, type AssetResponseDto, type PlacesResponseDto } from '@immich/sdk';
  import SearchBar from '../elements/search-bar.svelte';

  export const title = 'Change Location';
  export let asset: AssetResponseDto | undefined = undefined;

  interface Point {
    lng: number;
    lat: number;
  }

  let places: PlacesResponseDto[] = [];
  let suggestedPlaces: PlacesResponseDto[] = [];
  let searchWord: string;
  let isSearching = false;
  let showSpinner = false;
  let focusedElements: (HTMLButtonElement | null)[] = Array.from({ length: maximumLengthSearchPeople }, () => null);
  let indexFocus: number | null = null;
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
      indexFocus = null;
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

  const handleSearchPlaces = async () => {
    if (searchWord === '' || isSearching) {
      return;
    }

    // TODO: refactor setTimeout/clearTimeout logic - there are no less than 12 places that duplicate this code
    isSearching = true;
    const timeout = setTimeout(() => (showSpinner = true), timeBeforeShowLoadingSpinner);
    try {
      places = await searchPlaces({ name: searchWord });
    } catch (error) {
      places = [];
      handleError(error, "Can't search places");
    } finally {
      clearTimeout(timeout);
      isSearching = false;
      showSpinner = false;
    }
  };

  const handleUseSuggested = (latitude: number, longitude: number) => {
    hideSuggestion = true;
    point = { lng: longitude, lat: latitude };
    addClipMapMarker(longitude, latitude);
  };

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if (suggestedPlaces.length === 0) {
      return;
    }

    event.stopPropagation();
    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        if (indexFocus === null) {
          indexFocus = 0;
        } else if (indexFocus === suggestedPlaces.length - 1) {
          indexFocus = 0;
        } else {
          indexFocus++;
        }
        focusedElements[indexFocus]?.focus();
        return;
      }
      case 'ArrowUp': {
        if (indexFocus === null) {
          indexFocus = 0;
          return;
        }
        if (indexFocus === 0) {
          indexFocus = suggestedPlaces.length - 1;
        } else {
          indexFocus--;
        }
        focusedElements[indexFocus]?.focus();

        return;
      }
      case 'Enter': {
        if (indexFocus !== null) {
          hideSuggestion = true;
          handleUseSuggested(suggestedPlaces[indexFocus].latitude, suggestedPlaces[indexFocus].longitude);
        }
      }
    }
  };
</script>

<svelte:document on:keydown={handleKeyboardPress} />

<ConfirmDialogue
  confirmColor="primary"
  cancelColor="secondary"
  title="Change Location"
  width={800}
  on:confirm={handleConfirm}
  on:cancel={handleCancel}
>
  <div slot="prompt" class="flex flex-col w-full h-full gap-2">
    <div class="relative w-64 sm:w-96" use:clickOutside on:outclick={() => (hideSuggestion = true)}>
      <button class="w-full" on:click={() => (hideSuggestion = false)}>
        <SearchBar
          placeholder="Search places"
          bind:name={searchWord}
          isSearching={showSpinner}
          on:reset={() => {
            suggestedPlaces = [];
          }}
          on:search={handleSearchPlaces}
          roundedBottom={suggestedPlaces.length === 0 || hideSuggestion}
        />
      </button>
      <div class="absolute z-[99] w-full" id="suggestion">
        {#if !hideSuggestion}
          {#each suggestedPlaces as place, index}
            <button
              bind:this={focusedElements[index]}
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
          mapMarkers={lat && lng && asset ? [{ id: asset.id, lat, lon: lng }] : []}
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
