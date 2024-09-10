<script lang="ts">
  import RadioButton from '$lib/components/elements/radio-button.svelte';
  import { t } from 'svelte-i18n';

  export let query: string | undefined;
  export let queryType: 'smart' | 'metadata' = 'smart';
</script>

<fieldset>
  <legend class="immich-form-label">{$t('search_type')}</legend>
  <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1 mb-2">
    <RadioButton name="query-type" id="context-radio" label={$t('context')} bind:group={queryType} value="smart" />
    <RadioButton
      name="query-type"
      id="file-name-radio"
      label={$t('file_name_or_extension')}
      bind:group={queryType}
      value="metadata"
    />
  </div>
</fieldset>

{#if queryType === 'smart'}
  <label for="context-input" class="immich-form-label">{$t('search_by_context')}</label>
  <input
    class="immich-form-input hover:cursor-text w-full !mt-1"
    type="text"
    id="context-input"
    name="context"
    placeholder={$t('sunrise_on_the_beach')}
    bind:value={query}
  />
{:else}
  <label for="file-name-input" class="immich-form-label">{$t('search_by_filename')}</label>
  <input
    class="immich-form-input hover:cursor-text w-full !mt-1"
    type="text"
    id="file-name-input"
    name="file-name"
    placeholder={$t('search_by_filename_example')}
    bind:value={query}
    aria-labelledby="file-name-label"
  />
{/if}
