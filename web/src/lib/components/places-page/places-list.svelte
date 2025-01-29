<script lang="ts">
  import PlacesCardGroup from './places-card-group.svelte';
  import { groupBy } from 'lodash-es';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiMapMarkerOff } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { PlacesGroupBy, type PlacesViewSettings } from '$lib/stores/preferences.store';

  import { type PlacesGroup, getSelectedPlacesGroupOption } from '$lib/utils/places-utils';
  import { t } from 'svelte-i18n';
  import { run } from 'svelte/legacy';

  interface Props {
    places?: AssetResponseDto[];
    searchQuery?: string;
    searchResultCount: number;
    userSettings: PlacesViewSettings;
    placesGroupIds?: string[];
  }

  let {
    places = $bindable([]),
    searchQuery = '',
    searchResultCount = $bindable(0),
    userSettings,
    placesGroupIds = $bindable([]),
  }: Props = $props();

  interface PlacesGroupOption {
    [option: string]: (places: AssetResponseDto[]) => PlacesGroup[];
  }

  const groupOptions: PlacesGroupOption = {
    /** No grouping */
    [PlacesGroupBy.None]: (places): PlacesGroup[] => {
      return [
        {
          id: $t('places'),
          name: $t('places'),
          places,
        },
      ];
    },

    /** Group by year */
    [PlacesGroupBy.Country]: (places): PlacesGroup[] => {
      const unknownCountry = $t('unknown_country');

      const groupedByCountry = groupBy(places, (place) => {
        return place.exifInfo?.country ?? unknownCountry;
      });

      const sortedByCountryName = Object.entries(groupedByCountry).sort(([a], [b]) => {
        // We make sure empty albums stay at the end of the list
        if (a === unknownCountry) {
          return 1;
        } else if (b === unknownCountry) {
          return -1;
        } else {
          return a.localeCompare(b);
        }
      });

      return sortedByCountryName.map(([country, places]) => ({
        id: country,
        name: country,
        places,
      }));
    },
  };

  let filteredPlaces: AssetResponseDto[] = $state([]);
  let groupedPlaces: PlacesGroup[] = $state([]);

  let placesGroupOption: string = $state(PlacesGroupBy.None);

  let hasPlaces = $derived(places.length > 0);

  // Step 1: Filter using the given search query.
  run(() => {
    if (searchQuery) {
      const searchQueryNormalized = normalizeSearchString(searchQuery);

      filteredPlaces = places.filter((place) => {
        return normalizeSearchString(place.exifInfo?.city ?? '').includes(searchQueryNormalized);
      });
    } else {
      filteredPlaces = places;
    }

    searchResultCount = filteredPlaces.length;
  });

  // Step 2: Group places.
  run(() => {
    placesGroupOption = getSelectedPlacesGroupOption(userSettings);
    const groupFunc = groupOptions[placesGroupOption] ?? groupOptions[PlacesGroupBy.None];
    groupedPlaces = groupFunc(filteredPlaces);

    placesGroupIds = groupedPlaces.map(({ id }) => id);
  });
</script>

{#if hasPlaces}
  <!-- Album Cards -->
  {#if placesGroupOption === PlacesGroupBy.None}
    <PlacesCardGroup places={groupedPlaces[0].places} />
  {:else}
    {#each groupedPlaces as placeGroup (placeGroup.id)}
      <PlacesCardGroup places={placeGroup.places} group={placeGroup} />
    {/each}
  {/if}
{:else}
  <div class="flex min-h-[calc(66vh_-_11rem)] w-full place-content-center items-center dark:text-white">
    <div class="flex flex-col content-center items-center text-center">
      <Icon path={mdiMapMarkerOff} size="3.5em" />
      <p class="mt-5 text-3xl font-medium">{$t('no_places')}</p>
    </div>
  </div>
{/if}
