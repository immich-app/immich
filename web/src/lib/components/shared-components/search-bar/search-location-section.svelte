<script lang="ts" context="module">
  export interface SearchLocationFilter {
    country?: string | null;
    state?: string | null;
    city?: string | null;
  }
</script>

<script lang="ts">
  import { getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import Combobox, { toComboBoxOptions } from '../combobox.svelte';
  import { handlePromiseError } from '$lib/utils';
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
    countries = await getSearchSuggestions({
      $type: SearchSuggestionType.Country,
    });
    countries.push($t('unknown'));
    if (filters.country && !countries.includes(filters.country)) {
      filters.country = undefined;
    }
  }

  async function updateStates(country?: string | null) {
    if (country === null) {
      states = [];
      return;
    }
    states = await getSearchSuggestions({
      $type: SearchSuggestionType.State,
      country,
    });

    if (filters.state && !states.includes(filters.state)) {
      filters.state = undefined;
    }
  }

  async function updateCities(country?: string | null, state?: string | null) {
    if (country === null || state === null) {
      cities = [];
      return;
    }

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
  <p class="immich-form-label">{$t('place').toUpperCase()}</p>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
    <div class="w-full">
      <Combobox
        label={$t('country')}
        on:select={({ detail }) => (filters.country = detail?.value === $t('unknown') ? null : detail?.value)}
        options={toComboBoxOptions(countries)}
        placeholder={$t('search_country')}
        selectedOption={filters.country || filters.country === null
          ? { label: filters?.country || $t('unknown'), value: filters.country ?? $t('unknown') }
          : undefined}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('state')}
        on:select={({ detail }) => (filters.state = detail?.value)}
        options={toComboBoxOptions(states)}
        placeholder={$t('search_state')}
        selectedOption={filters.state ? { label: filters.state, value: filters.state } : undefined}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('city')}
        on:select={({ detail }) => (filters.city = detail?.value)}
        options={toComboBoxOptions(cities)}
        placeholder={$t('search_city')}
        selectedOption={filters.city ? { label: filters.city, value: filters.city } : undefined}
      />
    </div>
  </div>
</div>
