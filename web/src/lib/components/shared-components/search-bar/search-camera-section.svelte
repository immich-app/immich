<script lang="ts" context="module">
  export interface SearchCameraFilter {
    make?: string;
    model?: string;
  }
</script>

<script lang="ts">
  import { SearchSuggestionType, getSearchSuggestions } from '@immich/sdk';
  import Combobox, { toComboBoxOptions } from '../combobox.svelte';
  import { handlePromiseError } from '$lib/utils';

  export let filters: SearchCameraFilter;

  let makes: string[] = [];
  let models: string[] = [];

  $: makeFilter = filters.make;
  $: modelFilter = filters.model;
  $: handlePromiseError(updateMakes(modelFilter));
  $: handlePromiseError(updateModels(makeFilter));

  async function updateMakes(model?: string) {
    makes = await getSearchSuggestions({
      $type: SearchSuggestionType.CameraMake,
      model,
    });
  }

  async function updateModels(make?: string) {
    models = await getSearchSuggestions({
      $type: SearchSuggestionType.CameraModel,
      make,
    });
  }
</script>

<div id="camera-selection">
  <p class="immich-form-label">CAMERA</p>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-camera-make">Make</label>
      <Combobox
        id="search-camera-make"
        options={toComboBoxOptions(makes)}
        selectedOption={makeFilter ? { label: makeFilter, value: makeFilter } : undefined}
        on:select={({ detail }) => (filters.make = detail?.value)}
        placeholder="Search camera make..."
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-camera-model">Model</label>
      <Combobox
        id="search-camera-model"
        options={toComboBoxOptions(models)}
        selectedOption={modelFilter ? { label: modelFilter, value: modelFilter } : undefined}
        on:select={({ detail }) => (filters.model = detail?.value)}
        placeholder="Search camera model..."
      />
    </div>
  </div>
</div>
