<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  const filters = $derived(searchManager.filter.imageProperties);

  const orientationFilter = $derived(filters.orientation);

  const orientationOptions = $derived([
    { value: 'landscape', label: $t('landscape') },
    { value: 'portrait', label: $t('portrait') },
  ]);

  function setOrientation(value?: string) {
    filters.orientation = value === 'landscape' || value === 'portrait' ? value : undefined;
  }
</script>

<div id="image-selection">
  <Text fontWeight="medium" class="py-5">{$t('image_properties')}</Text>

  <div class="grid grid-auto-fit-40 gap-2">
    <div class="w-full">
      <Combobox
        label={$t('orientation')}
        onSelect={(option) => setOrientation(option?.value)}
        options={orientationOptions}
        placeholder={$t('orientation')}
        selectedOption={orientationOptions.find((option) => option.value === orientationFilter)}
      />
    </div>
  </div>
</div>
