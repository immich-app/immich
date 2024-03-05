<script lang="ts">
  export let fileName: string | undefined;
  export let context: string | undefined;

  enum TextSearchOptions {
    Context = 'context',
    FileName = 'file-name',
  }

  let selectedOption = fileName ? TextSearchOptions.FileName : TextSearchOptions.Context;

  $: {
    if (selectedOption === TextSearchOptions.Context) {
      fileName = undefined;
    } else {
      context = undefined;
    }
  }
</script>

<div class="flex gap-5">
  <label class="immich-form-label" for="context">
    <input type="radio" name="context" id="context" bind:group={selectedOption} value={TextSearchOptions.Context} />
    <span>CONTEXT</span>
  </label>

  <label class="immich-form-label" for="file-name">
    <input
      type="radio"
      name="file-name"
      id="file-name"
      bind:group={selectedOption}
      value={TextSearchOptions.FileName}
    />
    <span>FILE NAME</span>
  </label>
</div>

{#if selectedOption === TextSearchOptions.Context}
  <input
    class="immich-form-input hover:cursor-text w-full !mt-1"
    type="text"
    id="context"
    name="context"
    placeholder="Sunrise on the beach"
    bind:value={context}
  />
{:else}
  <input
    class="immich-form-input hover:cursor-text w-full !mt-1"
    type="text"
    id="file-name"
    name="file-name"
    placeholder={'File name or extension i.e. IMG_1234.JPG or PNG'}
    bind:value={fileName}
  />
{/if}
