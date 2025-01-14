<script lang="ts" module>
  export interface SearchLocationFilter {
    country?: string;
    state?: string;
    city?: string;
  }
</script>

<script lang="ts">
  import { run } from 'svelte/legacy';

  import Combobox, { asComboboxOptions, asSelectedOption } from '$lib/components/shared-components/combobox.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { getSearchSuggestions, SearchSuggestionType } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: SearchLocationFilter;
  }

  let { filters = $bindable() }: Props = $props();

  let countries: string[] = $state([]);
  let states: string[] = $state([]);
  let cities: string[] = $state([]);

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
  run(() => {
    handlePromiseError(updateCountries());
  });
  run(() => {
    handlePromiseError(updateStates(countryFilter));
  });
  run(() => {
    handlePromiseError(updateCities(countryFilter, stateFilter));
  });
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
