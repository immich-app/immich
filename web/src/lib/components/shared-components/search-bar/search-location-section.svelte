<script lang="ts">
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';
  import type { SearchFilter } from './search-filter-box.svelte';

  export let filteredLocation: SearchFilter['location'];
  export let suggestedCountries: ComboBoxOption[];
  export let suggestedStates: ComboBoxOption[];
  export let suggestedCities: ComboBoxOption[];
  export let updateSuggestions: () => Promise<void>;
</script>

<div id="location-selection">
  <p class="immich-form-label">PLACE</p>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-country">Country</label>
      <Combobox
        id="search-place-country"
        options={suggestedCountries}
        bind:selectedOption={filteredLocation.country}
        placeholder="Search country..."
        on:click={updateSuggestions}
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-state">State</label>
      <Combobox
        id="search-place-state"
        options={suggestedStates}
        bind:selectedOption={filteredLocation.state}
        placeholder="Search state..."
        on:click={updateSuggestions}
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-place-city">City</label>
      <Combobox
        id="search-place-city"
        options={suggestedCities}
        bind:selectedOption={filteredLocation.city}
        placeholder="Search city..."
        on:click={updateSuggestions}
      />
    </div>
  </div>
</div>
