<script lang="ts">
  import { generateId } from '$lib/utils/generate-id';
  import { Input, Label, Text } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    filename: string;
    description: string;
    ocr: string;
    queryType: 'smart' | 'metadata' | 'description' | 'ocr';
  };

  let { filename = $bindable(), description = $bindable(), ocr = $bindable(), queryType }: Props = $props();

  const filenameInputId = generateId();
  const descriptionInputId = generateId();
  const ocrInputId = generateId();
</script>

<div>
  <Text fontWeight="medium">{$t('text_filters')}</Text>
  <div class="grid grid-auto-fit-40 gap-5 mt-1">
    {#if queryType !== 'metadata'}
      <div class="w-full">
        <Label class="block mb-1 text-xs text-neutral-500 font-light" for={filenameInputId}>{$t('file_name_or_extension')}</Label>
        <Input id={filenameInputId} type="text" placeholder={$t('search_by_filename_example')} bind:value={filename} />
      </div>
    {/if}
    {#if queryType !== 'description'}
      <div class="w-full">
        <Label class="block mb-1 text-xs text-neutral-500 font-light" for={descriptionInputId}>{$t('description')}</Label>
        <Input id={descriptionInputId} type="text" placeholder={$t('search_by_description_example')} bind:value={description} />
      </div>
    {/if}
    {#if queryType !== 'ocr'}
      <div class="w-full">
        <Label class="block mb-1 text-xs text-neutral-500 font-light" for={ocrInputId}>{$t('ocr')}</Label>
        <Input id={ocrInputId} type="text" placeholder={$t('search_by_ocr_example')} bind:value={ocr} />
      </div>
    {/if}
  </div>
</div>
