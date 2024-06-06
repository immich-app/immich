<script lang="ts">
  import RadioButton from '$lib/components/elements/radio-button.svelte';
  import { t } from 'svelte-i18n';

  export let filename: string | undefined;
  export let context: string | undefined;

  enum TextSearchOptions {
    Context = 'context',
    Filename = 'filename',
  }

  let selectedOption = filename ? TextSearchOptions.Filename : TextSearchOptions.Context;

  $: {
    if (selectedOption === TextSearchOptions.Context) {
      filename = undefined;
    } else {
      context = undefined;
    }
  }
</script>

<fieldset>
  <legend class="immich-form-label">{$t('search_type')}</legend>
  <div class="flex flex-wrap gap-x-5 gap-y-2 mt-1 mb-2">
    <RadioButton
      name="query-type"
      id="context-radio"
      bind:group={selectedOption}
      label={$t('context')}
      value={TextSearchOptions.Context}
    />
    <RadioButton
      name="query-type"
      id="file-name-radio"
      bind:group={selectedOption}
      label={$t('file_name_or_extension')}
      value={TextSearchOptions.Filename}
    />
  </div>
</fieldset>

{#if selectedOption === TextSearchOptions.Context}
  <label for="context-input" class="immich-form-label">{$t('search_by_context')}</label>
  <input
    class="immich-form-input hover:cursor-text w-full !mt-1"
    type="text"
    id="context-input"
    name="context"
    placeholder={$t('sunrise_on_the_beach')}
    bind:value={context}
  />
{:else}
  <label for="file-name-input" class="immich-form-label">Search by file name or extension</label>
  <input
    class="immich-form-input hover:cursor-text w-full !mt-1"
    type="text"
    id="file-name-input"
    name="file-name"
    placeholder="i.e. IMG_1234.JPG or PNG"
    bind:value={filename}
    aria-labelledby="file-name-label"
  />
{/if}
