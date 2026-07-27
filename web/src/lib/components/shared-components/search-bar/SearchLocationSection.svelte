<script lang="ts">
  import Combobox, { asComboboxOptions, asSelectedOption } from '$lib/components/shared-components/Combobox.svelte';
  import { searchPlacesTitle } from '$lib/components/shared-components/search-bar/search-bar-utils';
  import type { SearchLocationFilter } from '$lib/types';
  import { handlePromiseError } from '$lib/utils';
  import { getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    filters: SearchLocationFilter;
    title: string | undefined;
  };

  // eslint-disable-next-line no-useless-assignment
  let { filters = $bindable(), title = $bindable() }: Props = $props();

  let countries: string[] = $state([]);
  let states: string[] = $state([]);
  let cities: string[] = $state([]);

  const updateTitle = () => (title = searchPlacesTitle(filters.city, filters.state, filters.country));

  async function updateCountries() {
    const results: Array<string | null> = await getSearchSuggestions({
      $type: SearchSuggestionType.Country,
      includeNull: true,
    });

    countries = results.map((result) => result ?? '');

    if (filters.country && !countries.includes(filters.country)) {
      filters.country = undefined;
    }
  }

  async function updateStates(country?: string) {
    const results: Array<string | null> = await getSearchSuggestions({
      $type: SearchSuggestionType.State,
      country,
      includeNull: true,
    });

    states = results.map((result) => result ?? '');

    if (filters.state && !states.includes(filters.state)) {
      filters.state = undefined;
    }
  }

  async function updateCities(country?: string, state?: string) {
    const results: Array<string | null> = await getSearchSuggestions({
      $type: SearchSuggestionType.City,
      country,
      state,
    });

    cities = results.map((result) => result ?? '');

    if (filters.city && !cities.includes(filters.city)) {
      filters.city = undefined;
    }
  }
  let countryFilter = $derived(filters.country);
  let stateFilter = $derived(filters.state);

  // TODO replace by async $derived, at the latest when it's in stable https://svelte.dev/docs/svelte/await-expressions
  $effect(() => handlePromiseError(updateStates(countryFilter)));
  $effect(() => handlePromiseError(updateCities(countryFilter, stateFilter)));

  onMount(() => {
    updateTitle();
    void updateCountries();
  });
</script>

<div id="location-selection">
  <Text>{$t('search_filter_location_description')}</Text>

  <div class="mt-5 grid grid-auto-fit-40 gap-5">
    <div class="w-full">
      <Combobox
        label={$t('country')}
        onSelect={(option) => {
          filters.country = option?.value;
          updateTitle();
        }}
        options={asComboboxOptions(countries)}
        placeholder={$t('search_country')}
        selectedOption={asSelectedOption(filters.country)}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('state')}
        onSelect={(option) => {
          filters.state = option?.value;
          updateTitle();
        }}
        options={asComboboxOptions(states)}
        placeholder={$t('search_state')}
        selectedOption={asSelectedOption(filters.state)}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('city')}
        onSelect={(option) => {
          filters.city = option?.value;
          updateTitle();
        }}
        options={asComboboxOptions(cities)}
        placeholder={$t('search_city')}
        selectedOption={asSelectedOption(filters.city)}
      />
    </div>
  </div>
</div>
