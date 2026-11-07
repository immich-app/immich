<script lang="ts">
  import Combobox, { asComboboxOptions, asSelectedOption } from '#lib/components/shared-components/Combobox.svelte';
  import { searchManager } from '#lib/managers/search-manager.svelte.ts';
  import { getSearchSuggestionsQuery } from '#lib/queries/search.query.ts';
  import { SearchSuggestionType } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  let filters = $derived(searchManager.filter.location);

  let countryFilter = $derived(filters.country);
  let stateFilter = $derived(filters.state);

  const queries = {
    countries: createQuery(() => getSearchSuggestionsQuery({ $type: SearchSuggestionType.Country, includeNull: true })),
    states: createQuery(() =>
      getSearchSuggestionsQuery({ $type: SearchSuggestionType.State, country: countryFilter, includeNull: true }),
    ),
    cities: createQuery(() =>
      getSearchSuggestionsQuery({
        $type: SearchSuggestionType.City,
        country: countryFilter,
        state: stateFilter,
        includeNull: true,
      }),
    ),
  };

  const asValues = (results: Array<string | null> = []) => results.map((result) => result ?? '');

  const countries = $derived(asValues(queries.countries.data));
  const states = $derived(asValues(queries.states.data));
  const cities = $derived(asValues(queries.cities.data));

  $effect(() => {
    if (queries.countries.data && filters.country && !countries.includes(filters.country)) {
      filters.country = undefined;
    }
  });

  $effect(() => {
    if (queries.states.data && filters.state && !states.includes(filters.state)) {
      filters.state = undefined;
    }
  });

  $effect(() => {
    if (queries.cities.data && filters.city && !cities.includes(filters.city)) {
      filters.city = undefined;
    }
  });
</script>

<div data-testid="search-location-section">
  <Text>{$t('search_filter_location_description')}</Text>

  <div class="mt-5 grid grid-auto-fit-40 gap-5">
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
