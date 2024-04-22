<script lang="ts">
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

<fieldset class="flex flex-wrap gap-x-5 gap-y-2">
  <legend>Search type</legend>
  <label class="immich-form-label text-sm">
    <input
      type="radio"
      name="query-type"
      bind:group={selectedOption}
      value={TextSearchOptions.Context}
      class="focus-visible:ring-2"
    />
    Context
  </label>
  <label class="immich-form-label text-sm mb-2">
    <input
      type="radio"
      name="query-type"
      bind:group={selectedOption}
      value={TextSearchOptions.Filename}
      class="focus-visible:ring-2"
    />
    File name or extension
  </label>
</fieldset>

{#if selectedOption === TextSearchOptions.Context}
  <label>
    Search by context
    <input
      class="immich-form-input hover:cursor-text w-full !mt-1"
      type="text"
      id="context"
      name="context"
      placeholder="Sunrise on the beach"
      bind:value={context}
      aria-labelledby="context-label"
    />
  </label>
{:else}
  <label>
    Search by file name or extension
    <input
      class="immich-form-input hover:cursor-text w-full !mt-1"
      type="text"
      id="file-name"
      name="file-name"
      placeholder="i.e. IMG_1234.JPG or PNG"
      bind:value={filename}
      aria-labelledby="file-name-label"
    />
  </label>
{/if}
