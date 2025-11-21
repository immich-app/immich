<script lang="ts" module>
  export interface SearchCameraFilter {
    make?: string;
    model?: string;
    lensModel?: string;
  }
</script>

<script lang="ts">
  import Combobox, { asComboboxOptions, asSelectedOption } from '$lib/components/shared-components/combobox.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { SearchSuggestionType, getSearchSuggestions } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    filters: SearchCameraFilter;
  }

  let { filters = $bindable() }: Props = $props();

  let makes: string[] = $state([]);
  let models: string[] = $state([]);
  let lensModels: string[] = $state([]);

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

  async function updateLensModels(make?: string, model?: string) {
    const results: Array<string | null> = await getSearchSuggestions({
      $type: SearchSuggestionType.CameraLensModel,
      make,
      model,
      includeNull: true,
    });

    lensModels = results.map((result) => result ?? '');

    if (filters.lensModel && !lensModels.includes(filters.lensModel)) {
      filters.lensModel = undefined;
    }
  }

  const makeFilter = $derived(filters.make);
  const modelFilter = $derived(filters.model);
  const lensModelFilter = $derived(filters.lensModel);

  // TODO replace by async $derived, at the latest when it's in stable https://svelte.dev/docs/svelte/await-expressions
  $effect(() => {
    handlePromiseError(updateMakes());
  });
  $effect(() => {
    handlePromiseError(updateModels(makeFilter));
  });
  $effect(() => {
    handlePromiseError(updateLensModels(makeFilter, modelFilter));
  });
</script>

<div id="camera-selection">
  <p class="uppercase immich-form-label">{$t('camera')}</p>

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

    <div class="w-full">
      <Combobox
        label={$t('lens_model')}
        onSelect={(option) => (filters.lensModel = option?.value)}
        options={asComboboxOptions(lensModels)}
        placeholder={$t('search_camera_lens_model')}
        selectedOption={asSelectedOption(lensModelFilter)}
      />
    </div>
  </div>
</div>
