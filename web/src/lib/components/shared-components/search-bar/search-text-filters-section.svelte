<script lang="ts">
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import type { SearchTextFilters } from '$lib/types';
  import { generateId } from '$lib/utils/generate-id';
  import { Input, Label, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    filters: SearchTextFilters;
  };

  let { filters = $bindable() }: Props = $props();

  const filenameInputId = generateId();
  const descriptionInputId = generateId();
  const ocrInputId = generateId();
</script>

<section>
  <Text fontWeight="medium">{$t('text_filters')}</Text>

  <div class="grid grid-auto-fit-40 gap-5 mt-1">
    <div class="w-full">
      <Label class="block mb-1 text-xs text-neutral-500 font-light" for={filenameInputId}>{$t('file_name_or_extension')}</Label>
      <Input id={filenameInputId} type="text" placeholder={$t('search_by_filename_example')} bind:value={filters.filename} />
    </div>

    <div class="w-full">
      <Label class="block mb-1 text-xs text-neutral-500 font-light" for={descriptionInputId}>{$t('description')}</Label>
      <Input
        id={descriptionInputId}
        type="text"
        placeholder={$t('search_by_description_example')}
        bind:value={filters.description}
      />
    </div>

    {#if featureFlagsManager.value.ocr}
      <div class="w-full">
        <Label class="block mb-1 text-xs text-neutral-500 font-light" for={ocrInputId}>{$t('ocr')}</Label>
        <Input id={ocrInputId} type="text" placeholder={$t('search_by_ocr_example')} bind:value={filters.ocr} />
      </div>
    {/if}
  </div>
</section>