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
      <Combobox
        label="Make"
        on:select={({ detail }) => (filters.make = detail?.value)}
        options={toComboBoxOptions(makes)}
        placeholder="Search camera make..."
        selectedOption={makeFilter ? { label: makeFilter, value: makeFilter } : undefined}
      />
    </div>

    <div class="w-full">
      <Combobox
        label="Model"
        on:select={({ detail }) => (filters.model = detail?.value)}
        options={toComboBoxOptions(models)}
        placeholder="Search camera model..."
        selectedOption={modelFilter ? { label: modelFilter, value: modelFilter } : undefined}
      />
    </div>
  </div>
</div>
