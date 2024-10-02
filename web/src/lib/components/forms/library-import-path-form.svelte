<script lang="ts">
  import Button from '../elements/buttons/button.svelte';
  import FullScreenModal from '../shared-components/full-screen-modal.svelte';
  import { mdiFolderSync } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  export let importPath: string | null;
  export let importPaths: string[] = [];
  export let title = $t('import_path');
  export let cancelText = $t('cancel');
  export let submitText = $t('save');
  export let isEditing = false;
  export let onCancel: () => void;
  export let onSubmit: (importPath: string | null) => void;
  export let onDelete: () => void = () => {};

  onMount(() => {
    if (isEditing) {
      importPaths = importPaths.filter((path) => path !== importPath);
    }
  });

  $: isDuplicate = importPath !== null && importPaths.includes(importPath);
  $: canSubmit = importPath !== '' && importPath !== null && !importPaths.includes(importPath);
</script>

<FullScreenModal {title} icon={mdiFolderSync} onClose={onCancel}>
  <form on:submit|preventDefault={() => onSubmit(importPath)} autocomplete="off" id="library-import-path-form">
    <p class="py-5 text-sm">{$t('admin.library_import_path_description')}</p>

    <div class="my-4 flex flex-col gap-2">
      <label class="immich-form-label" for="path">{$t('path')}</label>
      <input class="immich-form-input" id="path" name="path" type="text" bind:value={importPath} />
    </div>

    <div class="mt-8 flex w-full gap-4">
      {#if isDuplicate}
        <p class="text-red-500 text-sm">{$t('errors.import_path_already_exists')}</p>
      {/if}
    </div>
  </form>
  <svelte:fragment slot="sticky-bottom">
    <Button color="gray" fullwidth on:click={onCancel}>{cancelText}</Button>
    {#if isEditing}
      <Button color="red" fullwidth on:click={onDelete}>{$t('delete')}</Button>
    {/if}
    <Button type="submit" disabled={!canSubmit} fullwidth form="library-import-path-form">{submitText}</Button>
  </svelte:fragment>
</FullScreenModal>
