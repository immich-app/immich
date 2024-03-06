<script lang="ts" context="module">
  export interface SearchLocationFilter {
    country?: string;
    state?: string;
    city?: string;
  }
</script>

<script lang="ts">
  import { getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import Combobox, { toComboBoxOptions } from '../combobox.svelte';
  import { handlePromiseError } from '$lib/utils';

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
    countries = await getSearchSuggestions({
      $type: SearchSuggestionType.Country,
    });

    if (filters.country && !countries.includes(filters.country)) {
      filters.country = undefined;
    }
  }

  async function updateStates(country?: string) {
    states = await getSearchSuggestions({
      $type: SearchSuggestionType.State,
      country,
    });

    if (filters.state && !states.includes(filters.state)) {
      filters.state = undefined;
    }
  }

  async function updateCities(country?: string, state?: string) {
    cities = await getSearchSuggestions({
      $type: SearchSuggestionType.City,
      country,
      state,
    });

    if (filters.city && !cities.includes(filters.city)) {
      filters.city = undefined;
    }
  }
</script>

<div id="location-selection">
  <p class="immich-form-label">PLACE</p>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-country">Country</label>
      <Combobox
        id="search-place-country"
        options={toComboBoxOptions(countries)}
        selectedOption={filters.country ? { label: filters.country, value: filters.country } : undefined}
        on:select={({ detail }) => (filters.country = detail?.value)}
        placeholder="Search country..."
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-state">State</label>
      <Combobox
        id="search-place-state"
        options={toComboBoxOptions(states)}
        selectedOption={filters.state ? { label: filters.state, value: filters.state } : undefined}
        on:select={({ detail }) => (filters.state = detail?.value)}
        placeholder="Search state..."
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-city">City</label>
      <Combobox
        id="search-place-city"
        options={toComboBoxOptions(cities)}
        selectedOption={filters.city ? { label: filters.city, value: filters.city } : undefined}
        on:select={({ detail }) => (filters.city = detail?.value)}
        placeholder="Search city..."
      />
    </div>
  </div>
</div>
