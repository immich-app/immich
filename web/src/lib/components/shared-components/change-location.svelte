<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from './confirm-dialogue.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';

  import LoadingSpinner from './loading-spinner.svelte';
  import { delay } from '$lib/utils/asset-utils';
  import { timeToLoadTheMap } from '$lib/constants';
  import { searchPlaces, type AssetResponseDto, type PlacesResponseDto } from '@immich/sdk';
  import Combobox, { type ComboBoxOption } from '$lib/components/shared-components/combobox.svelte';

  export const title = 'Change Location';
  export let asset: AssetResponseDto | undefined = undefined;

  interface Point {
    lng: number;
    lat: number;
  }

  let places: PlacesResponseDto[] = [];
  let suggestedPlaces: ComboBoxOption[] = [];
  let searchQuery: string = '';
  let isSearching = false;
  let showSpinner = false;
  let selectedOption: ComboBoxOption | undefined = undefined;
  let addClipMapMarker: (long: number, lat: number) => void;
  let removeClipMapMarker: () => void;

  const dispatch = createEventDispatcher<{
    cancel: void;
    confirm: Point;
  }>();

  $: lat = asset?.exifInfo?.latitude || 0;
  $: lng = asset?.exifInfo?.longitude || 0;
  $: zoom = lat && lng ? 15 : 1;
  $: noResultsMessage = suggestedPlaces.length === 0 && searchQuery === '' ? 'Start typing to search' : 'No results';

  $: {
    if (places) {
      suggestedPlaces = places.slice(0, 5).map((place) => convertToComboBoxOption(place));
    }
    if (searchQuery === '') {
      suggestedPlaces = [];
    }
  }

  let point: Point | null = null;

  const handleCancel = () => dispatch('cancel');

  const handleClickedPoint = (selected: Point) => {
    point = selected;
    selectedOption = undefined;
    suggestedPlaces = [];
    searchQuery = '';
  };

  const handleConfirm = () => {
    if (point) {
      dispatch('confirm', point);
    } else {
      dispatch('cancel');
    }
  };

  const handleSelect = (event: CustomEvent<ComboBoxOption | undefined>) => {
    const selectedOption = event.detail;
    searchQuery = selectedOption?.label ?? '';
    if (!selectedOption) {
      modifyMapMarker();
      return;
    }
    const [lat, lng] = selectedOption.value.split(',');
    modifyMapMarker(+lat, +lng);
  };

  const handleInput = (event: CustomEvent<string>) => {
    searchQuery = event.detail;
    void fetchSuggestions();
  };

  const handleFocusOut = (event: CustomEvent<string>) => {
    const query = event.detail;
    searchQuery = query;
    if (query === '') {
      suggestedPlaces = [];
    }
  };

  const fetchSuggestions = async () => {
    if (searchQuery === '' || isSearching) {
      return;
    }

    // TODO: refactor setTimeout/clearTimeout logic - there are no less than 12 places that duplicate this code
    isSearching = true;
    const timeout = setTimeout(() => (showSpinner = true), timeBeforeShowLoadingSpinner);
    try {
      places = await searchPlaces({ name: searchQuery });
    } catch (error) {
      places = [];
      handleError(error, "Can't search places");
    } finally {
      clearTimeout(timeout);
      isSearching = false;
      showSpinner = false;
    }
  };

  const modifyMapMarker = (latitude?: number, longitude?: number) => {
    if (!latitude || !longitude) {
      point = null;
      removeClipMapMarker();
      return;
    }
    point = { lng: longitude, lat: latitude };
    addClipMapMarker(longitude, latitude);
  };

  const getLocation = (name: string, admin1Name?: string, admin2Name?: string): string => {
    return `${name}${admin1Name ? ', ' + admin1Name : ''}${admin2Name ? ', ' + admin2Name : ''}`;
  };

  const convertToComboBoxOption = (place: PlacesResponseDto): ComboBoxOption => {
    return {
      label: getLocation(place.name, place.admin1name, place.admin2name),
      value: `${place.latitude},${place.longitude}`,
    };
  };
</script>

<ConfirmDialogue
  confirmColor="primary"
  cancelColor="secondary"
  title="Change Location"
  width={800}
  onConfirm={handleConfirm}
  onClose={handleCancel}
>
  <div slot="prompt" class="flex flex-col w-full h-full gap-2">
    <div class="w-64 sm:w-96">
      <Combobox
        bind:selectedOption
        enableFiltering={false}
        id="change-location-combobox"
        label="Search for a city"
        {noResultsMessage}
        on:focusOut={handleFocusOut}
        on:input={handleInput}
        on:select={handleSelect}
        options={suggestedPlaces}
        placeholder="City name"
        {showSpinner}
      />
    </div>
    <div class="h-4" />
    <label for="datetime" class="text-sm text-black dark:text-white">Choose a point on the map</label>
    <div class="h-[400px] min-h-[300px] w-full">
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
          bind:removeClipMapMarker
          center={lat && lng ? { lat, lng } : undefined}
          simplified={true}
          clickable={true}
          on:clickedPoint={({ detail: point }) => handleClickedPoint(point)}
        />
      {/await}
    </div>
  </div>
</ConfirmDialogue>
