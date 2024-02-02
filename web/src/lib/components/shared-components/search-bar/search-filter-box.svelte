<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { fly } from 'svelte/transition';
  import Combobox, { type ComboBoxOption } from '../combobox.svelte';

  enum MediaType {
    All = 'all',
    Image = 'image',
    Video = 'video',
  }

  let selectedCountry: ComboBoxOption = { label: '', value: '' };
  let selectedState: ComboBoxOption = { label: '', value: '' };
  let selectedCity: ComboBoxOption = { label: '', value: '' };

  let mediaType: MediaType = MediaType.All;
  let notInAlbum = false;
  let inArchive = false;
  let inFavorite = false;
</script>

<div
  transition:fly={{ y: 25, duration: 250 }}
  class="absolute w-full rounded-b-3xl border border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300 p-6"
>
  <p class="text-xs py-2">FILTERS</p>
  <hr class="py-2" />

  <form id="search-filter-form" autocomplete="off">
    <div class="py-3">
      <label class="immich-form-label" for="context">CONTEXT</label>
      <input
        class="immich-form-input hover:cursor-text w-full mt-3"
        type="text"
        id="context"
        name="context"
        placeholder="Sunrise on the beach"
      />
    </div>

    <div class="py-3 grid grid-cols-2">
      <!-- MEDIA TYPE -->
      <div id="media-type-selection">
        <p class="immich-form-label">MEDIA TYPE</p>

        <div class="flex gap-5 mt-3">
          <label
            for="type-all"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={mediaType}
              value={MediaType.All}
              type="radio"
              name="radio-type"
              id="type-all"
            />All</label
          >

          <label
            for="type-image"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={mediaType}
              value={MediaType.Image}
              type="radio"
              name="radio-type"
              id="type-image"
            />Image</label
          >

          <label
            for="type-video"
            class="text-base flex place-items-center gap-1 hover:cursor-pointer text-black dark:text-white"
          >
            <input
              bind:group={mediaType}
              value={MediaType.Video}
              type="radio"
              name="radio-type"
              id="type-video"
            />Video</label
          >
        </div>
      </div>

      <!-- DISPLAY OPTIONS -->
      <div id="display-options-selection">
        <p class="immich-form-label">DISPLAY OPTIONS</p>

        <div class="flex gap-5 mt-3">
          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={notInAlbum} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Not in any album</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={inArchive} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Archive</span>
          </label>

          <label class="flex items-center mb-2">
            <input type="checkbox" class="form-checkbox h-5 w-5 color" bind:checked={inFavorite} />
            <span class="ml-2 text-sm text-black dark:text-white pt-1">Favorite</span>
          </label>
        </div>
      </div>
    </div>

    <hr />

    <!-- PEOPLE -->
    <div id="people-selection" class="my-4">
      <div class="flex justify-between place-items-center gap-6">
        <div class="flex-1">
          <p class="immich-form-label">PEOPLE</p>
        </div>

        <div class="flex-1">
          <Combobox options={[]} selectedOption={selectedCountry} placeholder="Search people..." />
        </div>
      </div>
    </div>

    <hr />
    <!-- LOCATION -->
    <div id="location-selection" class="my-4">
      <p class="immich-form-label">PLACE</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Country</p>
          <Combobox options={[]} selectedOption={selectedCountry} placeholder="Search country..." />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">State</p>
          <Combobox options={[]} selectedOption={selectedState} placeholder="Search state..." />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">City</p>
          <Combobox options={[]} selectedOption={selectedCity} placeholder="Search city..." />
        </div>
      </div>
    </div>

    <hr />
    <!-- CAMERA MODEL -->
    <div id="camera-selection" class="my-4">
      <p class="immich-form-label">CAMERA</p>

      <div class="flex justify-between gap-5 mt-3">
        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Make</p>
          <Combobox options={[]} selectedOption={selectedCountry} placeholder="Search country..." />
        </div>

        <div class="w-full">
          <p class="text-sm text-black dark:text-white">Model</p>
          <Combobox options={[]} selectedOption={selectedState} placeholder="Search state..." />
        </div>
      </div>
    </div>

    <hr />

    <!-- DATE RANGE -->
    <div id="date-range-selection" class="my-4 flex justify-between gap-5">
      <div class="mb-3 flex-1 mt">
        <label class="immich-form-label" for="start-date">START DATE</label>
        <input
          class="immich-form-input w-full mt-3 hover:cursor-pointer"
          type="date"
          id="start-date"
          name="start-date"
        />
      </div>

      <div class="mb-3 flex-1">
        <label class="immich-form-label" for="end-date">END DATE</label>
        <input
          class="immich-form-input w-full mt-3 hover:cursor-pointer"
          type="date"
          id="end-date"
          name="end-date"
          placeholder=""
        />
      </div>
    </div>

    <div id="button-row" class="flex justify-end gap-4 mt-5">
      <Button color="gray">CLEAR ALL</Button>
      <Button type="submit">SEARCH</Button>
    </div>
  </form>
</div>
