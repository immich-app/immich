<script lang="ts" context="module">
  export interface SearchLocationFilter {
    country?: string;
    state?: string;
    city?: string;
  }
</script>

<script lang="ts">
  import { getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';
  import type { SearchFilter } from './search-filter-box.svelte';

  export let filter: SearchFilter['location'];

  let countries: string[] = [];
  let states: string[] = [];
  let cities: string[] = [];

  const toComboBoxOptions = (items: string[]) => items.map<ComboBoxOption>((item) => ({ label: item, value: item }));

  $: countryFilter = filter.country;
  $: stateFilter = filter.state;
  $: updateCountries();
  $: updateStates(countryFilter);
  $: updateCities(countryFilter, stateFilter);

  async function updateCountries() {
    countries = await getSearchSuggestions({
      $type: SearchSuggestionType.Country,
    });

    if (filter.country && !countries.includes(filter.country)) {
      filter.country = undefined;
    }
  }

  async function updateStates(country?: string) {
    states = await getSearchSuggestions({
      $type: SearchSuggestionType.State,
      country,
    });

    if (filter.state && !states.includes(filter.state)) {
      filter.state = undefined;
    }
  }

  async function updateCities(country?: string, state?: string) {
    cities = await getSearchSuggestions({
      $type: SearchSuggestionType.City,
      country,
      state,
    });

    if (filter.city && !cities.includes(filter.city)) {
      filter.city = undefined;
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
        selectedOption={filter.country ? { label: filter.country, value: filter.country } : undefined}
        on:select={({ detail }) => (filter.country = detail?.value)}
        placeholder="Search country..."
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-state">State</label>
      <Combobox
        id="search-place-state"
        options={toComboBoxOptions(states)}
        selectedOption={filter.state ? { label: filter.state, value: filter.state } : undefined}
        on:select={({ detail }) => (filter.state = detail?.value)}
        placeholder="Search state..."
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-city">City</label>
      <Combobox
        id="search-place-city"
        options={toComboBoxOptions(cities)}
        selectedOption={filter.city ? { label: filter.city, value: filter.city } : undefined}
        on:select={({ detail }) => (filter.city = detail?.value)}
        placeholder="Search city..."
      />
    </div>
  </div>
</div>
