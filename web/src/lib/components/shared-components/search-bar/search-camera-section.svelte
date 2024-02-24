<script lang="ts">
  import type { ComboBoxOption } from '../combobox.svelte';
  import Combobox from '../combobox.svelte';
  import type { SearchFilter } from './search-filter-box.svelte';

  export let filteredCamera: SearchFilter['camera'];
  export let suggestedMakes: ComboBoxOption[];
  export let suggestedModels: ComboBoxOption[];
  export let updateSuggestions: () => Promise<void>;
</script>

<div id="camera-selection">
  <p class="immich-form-label">CAMERA</p>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-5 mt-1">
    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-camera-make">Make</label>
      <Combobox
        id="search-camera-make"
        options={suggestedMakes}
        bind:selectedOption={filteredCamera.make}
        placeholder="Search camera make..."
        on:click={updateSuggestions}
      />
    </div>

    <div class="w-full">
      <label class="text-sm text-black dark:text-white" for="search-camera-model">Model</label>
      <Combobox
        id="search-camera-model"
        options={suggestedModels}
        bind:selectedOption={filteredCamera.model}
        placeholder="Search camera model..."
        on:click={updateSuggestions}
      />
    </div>
  </div>
</div>
