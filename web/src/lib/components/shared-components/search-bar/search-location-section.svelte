<script lang="ts" context="module">
  export interface SearchLocationFilter {
    country?: string;
    state?: string;
    city?: string;
  }
</script>

<script lang="ts">
  import Combobox, { asComboboxOptions, asSelectedOption } from '$lib/components/shared-components/combobox.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let filters: SearchLocationFilter;

  let countries: string[] = [];
  let states: string[] = [];
  let cities: string[] = [];

  $: countryFilter = filters.country;
  $: stateFilter = filters.state;
  $: handlePromiseError(updateCountries());
  $: handlePromiseError(updateStates(countryFilter));
  $: handlePromiseError(updateCities(countryFilter, stateFilter));

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
</script>

<div id="location-selection">
  <p class="immich-form-label">{$t('place').toUpperCase()}</p>

  <div class="grid grid-auto-fit-40 gap-5 mt-1">
    <div class="w-full">
      <Combobox
        label={$t('country')}
        onSelect={(option) => (filters.country = option?.value)}
        options={asComboboxOptions(countries)}
        placeholder={$t('search_country')}
        selectedOption={asSelectedOption(filters.country)}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('state')}
        onSelect={(option) => (filters.state = option?.value)}
        options={asComboboxOptions(states)}
        placeholder={$t('search_state')}
        selectedOption={asSelectedOption(filters.state)}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('city')}
        onSelect={(option) => (filters.city = option?.value)}
        options={asComboboxOptions(cities)}
        placeholder={$t('search_city')}
        selectedOption={asSelectedOption(filters.city)}
      />
    </div>
  </div>
</div>
