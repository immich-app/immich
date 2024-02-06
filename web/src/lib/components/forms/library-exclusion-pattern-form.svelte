<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiFolderRemove } from '@mdi/js';
  import { onMount } from 'svelte';

  export let exclusionPattern: string;
  export let exclusionPatterns: string[] = [];
  export let isEditing = false;
  export let submitText = 'Submit';

  onMount(() => {
    if (isEditing) {
      exclusionPatterns = exclusionPatterns.filter((pattern) => pattern !== exclusionPattern);
    }
  });

  $: isDuplicate = exclusionPattern !== null && exclusionPatterns.includes(exclusionPattern);
  $: canSubmit = exclusionPattern !== '' && exclusionPattern !== null && !exclusionPatterns.includes(exclusionPattern);

  const dispatch = createEventDispatcher<{
    cancel: void;
    submit: { excludePattern: string };
    delete: void;
  }>();
  const handleCancel = () => dispatch('cancel');
  const handleSubmit = () => dispatch('submit', { excludePattern: exclusionPattern });
</script>

<FullScreenModal on:clickOutside={() => handleCancel()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    >
      <Icon path={mdiFolderRemove} size="4em" />
      <h1 class="text-2xl font-medium text-immich-primary dark:text-immich-dark-primary">Add Exclusion pattern</h1>
    </div>

    <form on:submit|preventDefault={() => handleSubmit()} autocomplete="off">
      <p class="p-5 text-sm">
        Exclusion patterns lets you ignore files and folders when scanning your library. This is useful if you have
        folders that contain files you don't want to import, such as RAW files.
        <br /><br />
        Add exclusion patterns. Globbing using *, **, and ? is supported. To ignore all files in any directory named "Raw",
        use "**/Raw/**". To ignore all files ending in ".tif", use "**/*.tif". To ignore an absolute path, use "/path/to/ignore".
      </p>
      <div class="m-4 flex flex-col gap-2">
        <label class="immich-form-label" for="exclusionPattern">Pattern</label>
        <input
          class="immich-form-input"
          id="exclusionPattern"
          name="exclusionPattern"
          type="text"
          bind:value={exclusionPattern}
        />
      </div>
      <div class="mt-8 flex w-full gap-4 px-4">
        <Button color="gray" fullwidth on:click={() => handleCancel()}>Cancel</Button>
        {#if isEditing}
          <Button color="red" fullwidth on:click={() => dispatch('delete')}>Delete</Button>
        {/if}

        <Button type="submit" disabled={!canSubmit} fullwidth>{submitText}</Button>
      </div>
      <div class="mt-8 flex w-full gap-4 px-4">
        {#if isDuplicate}
          <p class="text-red-500 text-sm">This exclusion pattern already exists.</p>
        {/if}
      </div>
    </form>
  </div>
</FullScreenModal>
