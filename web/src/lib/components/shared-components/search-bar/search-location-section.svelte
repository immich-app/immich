<script lang="ts" module>
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
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: SearchLocationFilter;
  }

  let { filters = $bindable() }: Props = $props();

  let countries: string[] = $state([]);
  let states: string[] = $state([]);
  let cities: string[] = $state([]);

  let isSearchingCountry = $state(false);
  let isSearchingState = $state(false);
  let isSearchingCity = $state(false);

  const DEBOUNCE_MS = 300;

  // Track active timeouts for cleanup
  const timeouts: Set<ReturnType<typeof setTimeout>> = new Set();

  /**
   * Creates a debounced search handler for location suggestions.
   * Automatically cleans up pending timeouts on component destroy.
   */
  function createDebouncedSearch(
    setLoading: (loading: boolean) => void,
    searchFn: (query?: string) => Promise<void>,
  ): (query: string) => void {
    return (query: string) => {
      // Clear any existing timeout for this handler
      setLoading(true);
      const timeout = setTimeout(async () => {
        try {
          await searchFn(query || undefined);
        } finally {
          setLoading(false);
          timeouts.delete(timeout);
        }
      }, DEBOUNCE_MS);
      timeouts.add(timeout);
    };
  }

  async function fetchCountries(query?: string) {
    const results = await getSearchSuggestions({
      $type: SearchSuggestionType.Country,
      includeNull: true,
      query,
    });
    countries = results.map((r) => r ?? '');
    if (!query && filters.country && !countries.includes(filters.country)) {
      filters.country = undefined;
    }
  }

  async function fetchStates(query?: string) {
    const results = await getSearchSuggestions({
      $type: SearchSuggestionType.State,
      country: filters.country,
      includeNull: true,
      query,
    });
    states = results.map((r) => r ?? '');
    if (!query && filters.state && !states.includes(filters.state)) {
      filters.state = undefined;
    }
  }

  async function fetchCities(query?: string) {
    const results = await getSearchSuggestions({
      $type: SearchSuggestionType.City,
      country: filters.country,
      state: filters.state,
      query,
    });
    cities = results.map((r) => r ?? '');
    if (!query && filters.city && !cities.includes(filters.city)) {
      filters.city = undefined;
    }
  }

  const handleCountrySearch = createDebouncedSearch((l) => (isSearchingCountry = l), fetchCountries);
  const handleStateSearch = createDebouncedSearch((l) => (isSearchingState = l), fetchStates);
  const handleCitySearch = createDebouncedSearch((l) => (isSearchingCity = l), fetchCities);

  // Refresh dependent dropdowns when parent selection changes
  $effect(() => {
    filters.country;
    handlePromiseError(fetchStates());
  });

  $effect(() => {
    filters.country;
    filters.state;
    handlePromiseError(fetchCities());
  });

  onMount(() => fetchCountries());

  onDestroy(() => {
    for (const timeout of timeouts) {
      clearTimeout(timeout);
    }
    timeouts.clear();
  });
</script>

<div id="location-selection">
  <p class="uppercase immich-form-label">{$t('place')}</p>

  <div class="grid grid-auto-fit-40 gap-5 mt-1">
    <div class="w-full">
      <Combobox
        label={$t('country')}
        onSelect={(option) => (filters.country = option?.value)}
        options={asComboboxOptions(countries)}
        placeholder={$t('search_country')}
        selectedOption={asSelectedOption(filters.country)}
        onSearch={handleCountrySearch}
        isSearching={isSearchingCountry}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('state')}
        onSelect={(option) => (filters.state = option?.value)}
        options={asComboboxOptions(states)}
        placeholder={$t('search_state')}
        selectedOption={asSelectedOption(filters.state)}
        onSearch={handleStateSearch}
        isSearching={isSearchingState}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('city')}
        onSelect={(option) => (filters.city = option?.value)}
        options={asComboboxOptions(cities)}
        placeholder={$t('search_country')}
        onSearch={handleCitySearch}
        isSearching={isSearchingCity}
      />
    </div>
  </div>
</div>
