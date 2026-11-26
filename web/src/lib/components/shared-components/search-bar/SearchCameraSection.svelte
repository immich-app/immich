<script lang="ts">
  import Combobox, { asComboboxOptions, asSelectedOption } from '#lib/components/shared-components/Combobox.svelte';
  import { searchManager } from '#lib/managers/search-manager.svelte.ts';
  import { getSearchSuggestionsQuery } from '#lib/queries/search.query.ts';
  import { SearchSuggestionType } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { createQuery } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  let filters = $derived(searchManager.filter.camera);

  const makeFilter = $derived(filters.make);
  const modelFilter = $derived(filters.model);
  const lensModelFilter = $derived(filters.lensModel);

  const queries = {
    makes: createQuery(() => getSearchSuggestionsQuery({ $type: SearchSuggestionType.CameraMake, includeNull: true })),
    models: createQuery(() =>
      getSearchSuggestionsQuery({ $type: SearchSuggestionType.CameraModel, make: makeFilter, includeNull: true }),
    ),
    lensModels: createQuery(() =>
      getSearchSuggestionsQuery({
        $type: SearchSuggestionType.CameraLensModel,
        make: makeFilter,
        model: modelFilter,
        includeNull: true,
      }),
    ),
  };

  const asValues = (results: Array<string | null> = []) => results.map((result) => result ?? '');

  const makes = $derived(asValues(queries.makes.data));
  const models = $derived(asValues(queries.models.data));
  const lensModels = $derived(asValues(queries.lensModels.data));

  $effect(() => {
    if (queries.makes.data && filters.make && !makes.includes(filters.make)) {
      filters.make = undefined;
    }
  });

  $effect(() => {
    if (queries.models.data && filters.model && !models.includes(filters.model)) {
      filters.model = undefined;
    }
  });

  $effect(() => {
    if (queries.lensModels.data && filters.lensModel && !lensModels.includes(filters.lensModel)) {
      filters.lensModel = undefined;
    }
  });
</script>

<div id="camera-selection">
  <Text fontWeight="medium" class="pb-5">{$t('camera')}</Text>
  <div class="grid grid-auto-fit-40 gap-2">
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
