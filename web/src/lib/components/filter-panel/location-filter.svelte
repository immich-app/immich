<script lang="ts">
  import type { FilterContext } from './filter-panel';

  interface Props {
    countries: string[];
    selectedCity?: string;
    selectedCountry?: string;
    context?: FilterContext;
    onCityFetch: (country: string, context?: FilterContext) => Promise<string[]>;
    onSelectionChange: (country?: string, city?: string) => void;
  }

  let { countries, selectedCity, selectedCountry, context, onCityFetch, onSelectionChange }: Props = $props();

  let expandedCountry = $state<string | undefined>(undefined);
  let cities = $state<string[]>([]);
  let loadingCities = $state(false);

  // Orphaned country: selected but not in current results
  let orphanedCountry = $derived(selectedCountry && !countries.includes(selectedCountry) ? selectedCountry : undefined);

  $effect(() => {
    if (expandedCountry) {
      const _context = context;
      loadingCities = true;
      void onCityFetch(expandedCountry, _context).then((result) => {
        cities = result;
        loadingCities = false;

        // Cascade child auto-clear: if selected city is not in new results, clear it
        if (selectedCity && result.length > 0 && !result.includes(selectedCity)) {
          onSelectionChange(expandedCountry, undefined);
        }
      });
    } else {
      cities = [];
    }
  });

  function handleCountryClick(country: string) {
    if (selectedCountry === country && !selectedCity) {
      // Deselect country
      expandedCountry = undefined;
      onSelectionChange(undefined, undefined);
    } else {
      // Select country
      expandedCountry = country;
      onSelectionChange(country, undefined);
    }
  }

  function handleCityClick(city: string, country: string) {
    if (selectedCity === city) {
      // Deselect city, keep country
      onSelectionChange(country, undefined);
    } else {
      // Select city (auto-fills country)
      onSelectionChange(country, city);
    }
  }
</script>

<div data-testid="location-filter">
  {#if countries.length === 0 && !orphanedCountry}
    <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="location-empty">No locations in this space</p>
  {:else}
    <!-- Orphaned country (selected but no longer in suggestions) -->
    {#if orphanedCountry}
      {@const isCountrySelected = true}
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium opacity-50 hover:bg-subtle"
        onclick={() => handleCountryClick(orphanedCountry!)}
        aria-pressed="true"
        data-testid="location-country-{orphanedCountry}"
      >
        <div
          class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isCountrySelected &&
          !selectedCity
            ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
            : 'border-gray-300 dark:border-gray-600'}"
        >
          {#if isCountrySelected && !selectedCity}
            <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
          {/if}
        </div>
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{orphanedCountry}</span>
      </button>
    {/if}

    {#each countries as country (country)}
      {@const isCountrySelected = selectedCountry === country}
      <!-- Country row -->
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isCountrySelected
          ? 'font-medium'
          : 'text-gray-500 dark:text-gray-300'}"
        onclick={() => handleCountryClick(country)}
        data-testid="location-country-{country}"
      >
        <!-- Radio indicator -->
        <div
          class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isCountrySelected &&
          !selectedCity
            ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
            : 'border-gray-300 dark:border-gray-600'}"
        >
          {#if isCountrySelected && !selectedCity}
            <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
          {/if}
        </div>

        <!-- Label -->
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{country}</span>
      </button>

      <!-- Cities (indented when country is expanded) -->
      {#if expandedCountry === country && !loadingCities}
        {#each cities as city (city)}
          {@const isCitySelected = selectedCity === city && selectedCountry === country}
          <button
            type="button"
            class="-mx-2 ml-5 flex w-[calc(100%-1.25rem+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isCitySelected
              ? 'font-medium'
              : 'text-gray-500 dark:text-gray-300'}"
            onclick={() => handleCityClick(city, country)}
            data-testid="location-city-{city}"
          >
            <!-- Radio indicator -->
            <div
              class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 {isCitySelected
                ? 'border-immich-primary bg-immich-primary dark:border-immich-dark-primary dark:bg-immich-dark-primary'
                : 'border-gray-300 dark:border-gray-600'}"
            >
              {#if isCitySelected}
                <div class="h-1.5 w-1.5 rounded-full bg-white dark:bg-black"></div>
              {/if}
            </div>

            <!-- Label -->
            <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{city}</span>
          </button>
        {/each}
      {/if}
    {/each}
  {/if}
</div>
