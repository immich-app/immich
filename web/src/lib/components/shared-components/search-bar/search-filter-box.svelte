<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { fly } from 'svelte/transition';
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';

  let selectedCountry: ComboBoxOption = { label: '', value: '' };
  let selectedState: ComboBoxOption = { label: '', value: '' };
  let selectedCity: ComboBoxOption = { label: '', value: '' };
</script>

<div
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300 p-6"
>
  <div class="mb-5">
    <p class="text-xs py-2">PRE-FILTER</p>
    <hr class="py-2" />
    <div class="flex flex-wrap gap-4">
      <Button size="sm">
        <p class="text-xs">Photos and videos not in albums</p>
      </Button>
      <Button size="sm">
        <p class="text-xs">All videos</p>
      </Button>
    </div>
  </div>

  <p class="text-xs py-2">FILTERS</p>
  <hr class="py-2" />

  <form id="search-filter-form" autocomplete="off">
    <div class="py-3">
      <label class="immich-form-label" for="context">CONTEXT</label>
      <input
        class="immich-form-input w-full mt-3"
        type="text"
        id="context"
        name="context"
        placeholder="Sunrise on the beach"
      />
    </div>

    <div class="py-3">
      <p class="immich-form-label">PLACE</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-xs">Country</p>
          <Combobox options={[]} selectedOption={selectedCountry} placeholder="Search country..." />
        </div>

        <div class="w-full">
          <p class="text-xs">State</p>
          <Combobox options={[]} selectedOption={selectedState} placeholder="Search state..." />
        </div>

        <div class="w-full">
          <p class="text-xs">City</p>
          <Combobox options={[]} selectedOption={selectedCity} placeholder="Search city..." />
        </div>
      </div>
    </div>

    <div class="py-3">
      <p class="immich-form-label">CAMERA</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-xs">Make</p>
          <Combobox options={[]} selectedOption={selectedCountry} placeholder="Search country..." />
        </div>

        <div class="w-full">
          <p class="text-xs">Model</p>
          <Combobox options={[]} selectedOption={selectedState} placeholder="Search state..." />
        </div>
      </div>
    </div>

    <div class="flex justify-between gap-5">
      <div class="py-3 flex-1 mt">
        <label class="immich-form-label" for="start-date">START DATE</label>
        <input class="immich-form-input w-full mt-3" type="date" id="start-date" name="start-date" />
      </div>

      <div class="py-3 flex-1">
        <label class="immich-form-label" for="end-date">END DATE</label>
        <input class="immich-form-input w-full mt-3" type="date" id="end-date" name="end-date" placeholder="" />
      </div>
    </div>

    <div id="button-row" class="flex justify-end gap-4 mt-5">
      <Button color="gray">CLEAR ALL</Button>
      <Button type="submit">SEARCH</Button>
    </div>
  </form>
</div>
