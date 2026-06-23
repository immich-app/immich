<script lang="ts">
  import Combobox from '$lib/components/shared-components/Combobox.svelte';
  import type { SearchImagePropsFilter } from '$lib/types';
  import { Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    filters: SearchImagePropsFilter;
  };

  let { filters = $bindable() }: Props = $props();

  const orientationOptions = $derived([
    { value: 'landscape', label: $t('landscape') },
    { value: 'portrait', label: $t('portrait') },
  ]);
</script>

<div id="image-selection">
  <Text fontWeight="medium">{$t('image_properties')}</Text>

  <div class="mt-1 grid grid-auto-fit-40 gap-5">
    <div class="w-1/3">
      <Combobox
        label={$t('orientation')}
        onSelect={(option) => (filters.orientation = option?.value as SearchImagePropsFilter['orientation'])}
        options={orientationOptions}
        placeholder={$t('orientation')}
        selectedOption={orientationOptions.find((option) => option.value === filters.orientation)}
      />
    </div>
  </div>
</div>
