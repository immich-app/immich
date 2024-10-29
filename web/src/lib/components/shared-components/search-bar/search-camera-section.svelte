<script lang="ts" context="module">
  export interface SearchCameraFilter {
    make?: string;
    model?: string;
  }
</script>

<script lang="ts">
  import Combobox, { asComboboxOptions, asSelectedOption } from '$lib/components/shared-components/combobox.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { SearchSuggestionType, getSearchSuggestions } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let filters: SearchCameraFilter;

  let makes: string[] = [];
  let models: string[] = [];

  $: makeFilter = filters.make;
  $: modelFilter = filters.model;
  $: handlePromiseError(updateMakes());
  $: handlePromiseError(updateModels(makeFilter));

  async function updateMakes() {
    const results: Array<string | null> = await getSearchSuggestions({
      $type: SearchSuggestionType.CameraMake,
      includeNull: true,
    });

    makes = results.map((result) => result ?? '');

    if (filters.make && !makes.includes(filters.make)) {
      filters.make = undefined;
    }
  }

  async function updateModels(make?: string) {
    const results: Array<string | null> = await getSearchSuggestions({
      $type: SearchSuggestionType.CameraModel,
      make,
      includeNull: true,
    });

    models = results.map((result) => result ?? '');

    if (filters.model && !models.includes(filters.model)) {
      filters.model = undefined;
    }
  }
</script>

<div id="camera-selection">
  <p class="immich-form-label">{$t('camera').toUpperCase()}</p>

  <div class="grid grid-auto-fit-40 gap-5 mt-1">
    <div class="w-full">
      <Combobox
        label={$t('make')}
        onSelect={(option) => (filters.make = option?.value)}
        options={asComboboxOptions(makes)}
        placeholder={$t('search_camera_make')}
        selectedOption={asSelectedOption(makeFilter)}
      />
    </div>

    <div class="w-full">
      <Combobox
        label={$t('model')}
        onSelect={(option) => (filters.model = option?.value)}
        options={asComboboxOptions(models)}
        placeholder={$t('search_camera_model')}
        selectedOption={asSelectedOption(modelFilter)}
      />
    </div>
  </div>
</div>
