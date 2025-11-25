<script lang="ts">
  import { PlacesGroupBy, type PlacesViewSettings } from '$lib/stores/preferences.store';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { type AssetResponseDto } from '@immich/sdk';
  import { mdiMapMarkerOff } from '@mdi/js';
  import { groupBy } from 'lodash-es';
  import PlacesCardGroup from './places-card-group.svelte';

  import { type PlacesGroup, getSelectedPlacesGroupOption } from '$lib/utils/places-utils';
  import { Icon } from '@immich/ui';
  import { t } from 'svelte-i18n';

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

  const filteredPlaces = $derived.by(() => {
    const searchQueryNormalized = normalizeSearchString(searchQuery);
    return searchQueryNormalized
      ? places.filter((place) => normalizeSearchString(place.exifInfo?.city ?? '').includes(searchQueryNormalized))
      : places;
  });

  const placesGroupOption: string = $derived(getSelectedPlacesGroupOption(userSettings));
  const groupingFunction = $derived(groupOptions[placesGroupOption] ?? groupOptions[PlacesGroupBy.None]);
  const groupedPlaces: PlacesGroup[] = $derived(groupingFunction(filteredPlaces));

  $effect(() => {
    searchResultCount = filteredPlaces.length;
  });

  $effect(() => {
    placesGroupIds = groupedPlaces.map(({ id }) => id);
  });
</script>

{#if places.length > 0}
  <!-- Album Cards -->
  {#if placesGroupOption === PlacesGroupBy.None}
    <PlacesCardGroup places={groupedPlaces[0].places} />
  {:else}
    {#each groupedPlaces as placeGroup (placeGroup.id)}
      <PlacesCardGroup places={placeGroup.places} group={placeGroup} />
    {/each}
  {/if}
{:else}
  <div class="flex min-h-[calc(66vh-11rem)] w-full place-content-center items-center dark:text-white">
    <div class="flex flex-col content-center items-center text-center">
      <Icon icon={mdiMapMarkerOff} size="3.5em" />
      <p class="mt-5 text-3xl font-medium">{$t('no_places')}</p>
    </div>
  </div>
{/if}
